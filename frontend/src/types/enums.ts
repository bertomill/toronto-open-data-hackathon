/**
 * Enumeration types and constants
 */

/**
 * Query types for categorizing database queries
 */
export enum QueryType {
  SUMMARY = 'summary',
  TREND = 'trend',
  COMPARISON = 'comparison',
  RANKING = 'ranking',
  SPECIFIC = 'specific'
}

/**
 * Message roles in chat
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

/**
 * View modes for data display
 */
export enum DataViewMode {
  TABLE = 'table',
  JSON = 'json',
  CHART = 'chart'
} 