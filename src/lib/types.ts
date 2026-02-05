// Task status type
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

// Task assignee type
export type TaskAssignee = 'unassigned' | 'bride' | 'groom' | 'both' | 'other';

// Task priority type
export type TaskPriority = 'normal' | 'high';

// View mode type for switching between grid, calendar, and list views
export type ViewMode = 'grid' | 'monthly' | 'weekly' | 'daily' | 'list';

// Checklist item within a task
export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

// Task - the main unit of work
export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  assignee: TaskAssignee;
  priority: TaskPriority;
  categoryId: string;
  timeframeId: string;
  dueDate: Date | null;
  checklist: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Category - rows in the grid
export interface Category {
  id: string;
  name: string;
  order: number;
}

// Timeframe - columns in the grid
export interface Timeframe {
  id: string;
  name: string;
  order: number;
  /** When true, column is hidden from view (tasks preserved). Treat undefined as false. */
  hidden?: boolean;
  /** Optional start date for date-based matching (ISO 8601 "YYYY-MM-DD") */
  startDate?: string;
  /** Optional end date for date-based matching (ISO 8601 "YYYY-MM-DD") */
  endDate?: string;
}

// Board - the top-level container
export interface Board {
  id: string;
  name: string;
  categories: Category[];
  timeframes: Timeframe[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

// Filter state for the header
export interface FilterState {
  status: TaskStatus | 'all';
  assignee: TaskAssignee | 'all';
  hideCompleted: boolean;
  searchQuery: string;
}
