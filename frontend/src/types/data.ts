/**
 * Core data types and database-related interfaces
 */

/**
 * Generic budget record - used for API responses and chart data
 * Represents a flexible data structure that can contain any budget-related fields
 */
export interface BudgetRecord {
  [key: string]: string | number;
}

/**
 * Raw budget data structure from CSV files
 * Represents the original structure of the Toronto budget data
 */
export interface BudgetData {
  Program: string;
  Service: string;
  Activity: string;
  "Expense/Revenue": string;
  "Category Name": string;
  "Sub-Category Name": string;
  "Commitment item": string;
  Amount: string;
  Year: string;
  [key: string]: string;
}

/**
 * Database statistics for context and validation
 */
export interface DatabaseStats {
  totalRecords: number;
  minYear: number;
  maxYear: number;
  uniquePrograms: number;
  uniqueServices: number;
  totalExpenses: number;
  totalRevenue: number;
}

/**
 * Filter options for data viewer
 */
export interface FilterOptions {
  searchTerm: string;
  selectedYear: string;
  selectedProgram: string;
  selectedType: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  currentPage: number;
  pageSize: number;
  totalItems: number;
} 