export interface BudgetRecord {
  [key: string]: string | number;
}

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

export interface DatabaseStats {
  totalRecords: number;
  minYear: number;
  maxYear: number;
  uniquePrograms: number;
  uniqueServices: number;
  totalExpenses: number;
  totalRevenue: number;
}

export interface FilterOptions {
  searchTerm: string;
  selectedYear: string;
  selectedProgram: string;
  selectedType: string;
}

export interface PaginationOptions {
  currentPage: number;
  pageSize: number;
  totalItems: number;
} 