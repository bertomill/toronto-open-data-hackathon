/**
 * React component prop types and UI-related interfaces
 */

import type { BudgetRecord, BudgetData } from './data';

/**
 * AI Analysis component props
 */
export interface AIAnalysisProps {
  data: BudgetRecord[];
  query: string;
}

/**
 * Data Viewer component props
 */
export interface DataViewerProps {
  data: BudgetData[];
}

/**
 * Data Dispensations component props
 */
export interface DataDispensationsProps {
  data: BudgetData[];
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
    currentPage: string;
    onPageChange: (page: string) => void;
    onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * Toronto Budget Hero component props
 */
export interface TorontoBudgetHeroProps {
    onStartExploring?: () => void;
}

/**
 * Aurora Background component props
 */
export interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Loading step for UI animations
 */
export interface LoadingStep {
  icon: React.ComponentType<any>;
  message: string;
  duration: number;
} 
