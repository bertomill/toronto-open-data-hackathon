/**
 * API request/response and query-related types
 */

import type { BudgetRecord } from './data';
import type { ChartType, ChartConfig, VisualizationAnalysis } from './chart';

/**
 * SQL query generation schema
 */
export interface SQLGenerationResult {
  sql: string;
  queryType: 'summary' | 'trend' | 'comparison' | 'ranking' | 'specific';
  confidence: number;
}

/**
 * Query evidence containing all information about a database query
 */
export interface QueryEvidence {
  sql: string;
  data: BudgetRecord[];
  confidence: number;
  queryType: string;
  totalRows: number;
  dataSource?: string;
  dataRange?: string;
  lastUpdated?: string;
  totalRecords?: number;
  shouldVisualize?: boolean;
  chartType?: ChartType;
  chartConfig?: ChartConfig;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  evidence?: QueryEvidence;
  id?: string;
}

/**
 * API Query Request
 */
export interface QueryRequest {
  question: string;
}

/**
 * API Query Response
 */
export interface QueryResponse {
  success: boolean;
  answer?: string;
  data?: BudgetRecord[];
  query?: {
    sql: string;
    type: string;
    confidence: number;
  };
  visualization?: VisualizationAnalysis;
  metadata?: {
    totalRows: number;
    executionTime: number;
    dataSource: string;
    dataRange: string;
    lastUpdated: string;
    totalRecords: number;
  };
  error?: string;
  suggestion?: string;
  examples?: string[];
}

/**
 * Analysis request for AI analysis endpoint
 */
export interface AnalysisRequest {
  data: BudgetRecord[];
  query: string;
  focusArea?: string;
} 