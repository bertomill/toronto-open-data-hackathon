import type { BudgetRecord } from './data';

export interface ChartConfig {
  xField: string;
  yField: string;
  groupField?: string;
  title?: string;
}

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'comparison';

export interface VisualizationAnalysis {
  shouldVisualize: boolean;
  chartType?: ChartType;
  chartConfig?: ChartConfig;
}

export interface ChartVisualizationProps {
  data: BudgetRecord[];
  chartType: ChartType;
  config: ChartConfig;
} 