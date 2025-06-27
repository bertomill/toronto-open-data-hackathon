import type { BudgetRecord } from './data';
import type { ChartType, ChartConfig, VisualizationAnalysis } from './chart';

export interface SQLGenerationResult {
  sql: string;
  queryType: 'summary' | 'trend' | 'comparison' | 'ranking' | 'specific';
  confidence: number;
}

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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  evidence?: QueryEvidence;
  id?: string;
}

export interface QueryRequest {
  question: string;
}

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

export interface AnalysisRequest {
  data: BudgetRecord[];
  query: string;
  focusArea?: string;
} 