import { DatabaseStats } from '@/types';
import Database from 'better-sqlite3';
import path from 'path';

// Database connection
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'public', 'data', 'toronto_budget.db');
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

// Database schema information for AI context
export const DATABASE_SCHEMA = `
-- Toronto Budget Database Schema
CREATE TABLE budget_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER,           -- Budget year (2019-2024)
  program TEXT,          -- Government program/department (e.g., "Toronto Police Service")
  service TEXT,          -- Specific service within program
  activity TEXT,         -- Specific activity within service
  amount REAL,           -- Dollar amount (positive = expenses, negative = revenue)
  amount_raw TEXT,       -- Original amount string from CSV
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Key Indexes
CREATE INDEX idx_year ON budget_data(year);
CREATE INDEX idx_program ON budget_data(program);
CREATE INDEX idx_service ON budget_data(service);
CREATE INDEX idx_amount ON budget_data(amount);

-- Sample data structure:
-- year: 2024
-- program: "Toronto Police Service"  
-- service: "Policing"
-- activity: "Community Safety"
-- amount: 1000000.00 (positive for expenses, negative for revenue)
`;

export const QUERY_EXAMPLES = `
-- Common query patterns:

-- 1. Total budget for a year
SELECT SUM(ABS(amount)) as total_budget FROM budget_data WHERE year = 2024;

-- 2. Program spending (expenses only)
SELECT SUM(amount) as spending FROM budget_data 
WHERE program LIKE '%Police%' AND amount > 0 AND year = 2024;

-- 3. Revenue sources (negative amounts)
SELECT program, SUM(ABS(amount)) as revenue FROM budget_data 
WHERE amount < 0 AND year = 2024 GROUP BY program ORDER BY revenue DESC;

-- 4. Year-over-year trends
SELECT year, SUM(amount) as total FROM budget_data 
WHERE program LIKE '%Fire%' AND amount > 0 
GROUP BY year ORDER BY year;

-- 5. Top programs by spending
SELECT program, SUM(amount) as total_spending FROM budget_data 
WHERE amount > 0 AND year = 2024 
GROUP BY program ORDER BY total_spending DESC LIMIT 10;

-- Important notes:
-- - Positive amounts = expenses/spending
-- - Negative amounts = revenue/income  
-- - Use ABS() for total budget calculations
-- - Use LIKE with % for partial text matching
-- - Always filter by year for specific year queries
`;

// Get database statistics
export function getDatabaseStats(): DatabaseStats {
  const db = getDatabase();
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalRecords,
      MIN(year) as minYear,
      MAX(year) as maxYear,
      COUNT(DISTINCT program) as uniquePrograms,
      COUNT(DISTINCT service) as uniqueServices,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalExpenses,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalRevenue
    FROM budget_data
  `).get() as DatabaseStats;
  
  return stats;
}

// Get unique programs for context
export function getPrograms(): string[] {
  const db = getDatabase();
  const programs = db.prepare(`
    SELECT DISTINCT program FROM budget_data 
    WHERE program IS NOT NULL AND program != '' 
    ORDER BY program
  `).all() as { program: string }[];
  
  return programs.map(p => p.program);
}

// Execute a SQL query safely
export function executeQuery(sql: string): Record<string, unknown>[] {
  const db = getDatabase();
  
  // Basic SQL injection protection
  const prohibitedWords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE'];
  const upperSQL = sql.toUpperCase();
  
  for (const word of prohibitedWords) {
    if (upperSQL.includes(word)) {
      throw new Error(`Query contains prohibited operation: ${word}`);
    }
  }
  
  try {
    const stmt = db.prepare(sql);
    return stmt.all() as Record<string, unknown>[];
  } catch (error) {
    throw new Error(`SQL execution error: ${error}`);
  }
}

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
} 