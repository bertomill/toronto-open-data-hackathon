import Database from 'better-sqlite3';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const CSV_PATH = '../toronto_budget_combined_2024_to_2019.csv';
const DB_PATH = '../frontend/public/data/toronto_budget.db';

console.log('🚀 Converting CSV to SQLite database...');

// Read and parse CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
const { data } = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true
});

console.log(`📊 Parsed ${data.length} rows from CSV`);

// Create database
const db = new Database(DB_PATH);

// Create table with proper schema
db.exec(`
  CREATE TABLE IF NOT EXISTS budget_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    program TEXT,
    service TEXT,
    activity TEXT,
    amount REAL,
    amount_raw TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create indexes for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_year ON budget_data(year);
  CREATE INDEX IF NOT EXISTS idx_program ON budget_data(program);
  CREATE INDEX IF NOT EXISTS idx_service ON budget_data(service);
  CREATE INDEX IF NOT EXISTS idx_activity ON budget_data(activity);
  CREATE INDEX IF NOT EXISTS idx_amount ON budget_data(amount);
`);

// Prepare insert statement
const insert = db.prepare(`
  INSERT INTO budget_data (year, program, service, activity, amount, amount_raw)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Process and insert data
console.log('💾 Inserting data into database...');
let insertedCount = 0;
let errorCount = 0;

const insertMany = db.transaction((records) => {
  for (const record of records) {
    try {
      // Parse amount - handle commas and negative values
      let amount = 0;
      if (record.Amount && record.Amount.trim()) {
        const isNegative = record.Amount.startsWith('(') && record.Amount.endsWith(')');
        const cleanAmount = record.Amount
          .replace(/[$,()]/g, '') // Remove $, commas AND parentheses
          .trim();
        
        amount = parseFloat(cleanAmount) || 0;
        if (isNegative) {
          amount = -Math.abs(amount); // Ensure negative value
        }
      }

      insert.run(
        parseInt(record.Year) || null,
        record.Program || '',
        record.Service || '',
        record.Activity || '',
        amount,
        record.Amount || ''
      );
      insertedCount++;
    } catch (error) {
      console.warn(`⚠️  Error inserting record:`, error.message);
      errorCount++;
    }
  }
});

insertMany(data);

// Add metadata table
db.exec(`
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert metadata
const insertMeta = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)');
insertMeta.run('total_records', insertedCount.toString());
insertMeta.run('data_source', 'toronto_budget_combined_2024_to_2019.csv');
insertMeta.run('years_covered', '2019-2024');
insertMeta.run('last_updated', new Date().toISOString());

// Get some stats
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_records,
    MIN(year) as min_year,
    MAX(year) as max_year,
    COUNT(DISTINCT program) as unique_programs,
    COUNT(DISTINCT service) as unique_services,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_revenue
  FROM budget_data
`).get();

console.log('✅ Database created successfully!');
console.log(`📈 Statistics:`);
console.log(`   • Records inserted: ${insertedCount}`);
console.log(`   • Errors: ${errorCount}`);
console.log(`   • Years: ${stats.min_year}-${stats.max_year}`);
console.log(`   • Programs: ${stats.unique_programs}`);
console.log(`   • Services: ${stats.unique_services}`);
console.log(`   • Total Expenses: $${stats.total_expenses?.toLocaleString() || 0}`);
console.log(`   • Total Revenue: $${stats.total_revenue?.toLocaleString() || 0}`);

// Add sample queries table for better AI context
db.exec(`
  CREATE TABLE IF NOT EXISTS sample_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    sql_query TEXT,
    description TEXT
  )
`);

const sampleQueries = [
  {
    question: "What was the total budget for 2024?",
    sql: "SELECT SUM(ABS(amount)) as total_budget FROM budget_data WHERE year = 2024",
    description: "Calculate total budget (all expenses and revenues) for a specific year"
  },
  {
    question: "How much did Toronto spend on police in 2023?",
    sql: "SELECT SUM(amount) as police_spending FROM budget_data WHERE year = 2023 AND program LIKE '%Police%' AND amount > 0",
    description: "Find police-related expenses for a specific year"
  },
  {
    question: "Show me the budget trend for fire services over the years",
    sql: "SELECT year, SUM(amount) as total_amount FROM budget_data WHERE program LIKE '%Fire%' AND amount > 0 GROUP BY year ORDER BY year",
    description: "Analyze spending trends for a specific program over time"
  },
  {
    question: "What are the top 5 programs by spending in 2024?",
    sql: "SELECT program, SUM(amount) as total_spending FROM budget_data WHERE year = 2024 AND amount > 0 GROUP BY program ORDER BY total_spending DESC LIMIT 5",
    description: "Rank programs by total spending for a specific year"
  },
  {
    question: "How much revenue did Toronto collect from taxes in 2023?",
    sql: "SELECT SUM(ABS(amount)) as total_revenue FROM budget_data WHERE year = 2023 AND amount < 0",
    description: "Calculate total revenue (negative amounts represent income)"
  }
];

const insertSample = db.prepare('INSERT INTO sample_queries (question, sql_query, description) VALUES (?, ?, ?)');
sampleQueries.forEach(sample => {
  insertSample.run(sample.question, sample.sql, sample.description);
});

db.close();
console.log(`🎉 Database saved to: ${DB_PATH}`);
console.log(`📁 Size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`); 