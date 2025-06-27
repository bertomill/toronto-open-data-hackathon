import type { BudgetRecord, BudgetData } from './data';

export interface AIAnalysisProps {
  data: BudgetRecord[];
  query: string;
}

export interface DataViewerProps {
  data: BudgetData[];
}

export interface DataDispensationsProps {
  data: BudgetData[];
}

export interface SidebarProps {
    currentPage: string;
    onPageChange: (page: string) => void;
    onCollapseChange?: (collapsed: boolean) => void;
}

export interface TorontoBudgetHeroProps {
    onStartExploring?: () => void;
}

export interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

export interface LoadingStep {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  duration: number;
} 
