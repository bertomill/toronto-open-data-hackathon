/**
 * Chart and visualization related types
 */

import type { BudgetRecord } from './data';

/**
 * Chart configuration for data visualization
 */
export interface ChartConfig {
  xField: string;
  yField: string;
  groupField?: string;
  title?: string;
}

/**
 * Chart types supported by the visualization system
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'comparison';

/**
 * Visualization analysis result
 */
export interface VisualizationAnalysis {
  shouldVisualize: boolean;
  chartType?: ChartType;
  chartConfig?: ChartConfig;
}

/**
 * Chart Visualization component props
 */
export interface ChartVisualizationProps {
  data: BudgetRecord[];
  chartType: ChartType;
  config: ChartConfig;
} 