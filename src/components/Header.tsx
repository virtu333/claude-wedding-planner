import { Download, LayoutGrid, Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { useBoard, type SyncStatus } from '../hooks/useBoard';
import { cn, exportBoardToCSV } from '../lib/utils';
import { STATUS_LABELS, ASSIGNEE_LABELS } from '../lib/constants';
import type { FilterState, TaskStatus, TaskAssignee, ViewMode } from '../lib/types';

// Sync status display config (using wedding palette)
const SYNC_STATUS_CONFIG: Record<SyncStatus, { color: string; label: string }> = {
  synced: { color: 'bg-[#29564F]', label: 'Synced' },      // Dark Green
  syncing: { color: 'bg-[#9E4C26]', label: 'Syncing...' }, // Paprika
  offline: { color: 'bg-gray-400', label: 'Local only' },
  error: { color: 'bg-[#861930]', label: 'Sync error' },   // Burgundy
};

// View mode config
const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
  { mode: 'monthly', icon: Calendar, label: 'Month' },
  { mode: 'weekly', icon: CalendarDays, label: 'Week' },
  { mode: 'daily', icon: CalendarClock, label: 'Day' },
];

interface HeaderProps {
  onAddTask: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  taskCount: { filtered: number; total: number };
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function Header({
  onAddTask,
  filters,
  onFiltersChange,
  taskCount,
  viewMode,
  onViewModeChange,
}: HeaderProps) {
  const { syncStatus, board } = useBoard();

  // Check if any filters are active
  const hasActiveFilters =
    filters.status !== 'all' || filters.assignee !== 'all' || filters.hideCompleted;

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({ status: 'all', assignee: 'all', hideCompleted: false });
  };

  // Determine if we can add tasks (need at least one category and one timeframe)
  const canAddTask =
    board !== null &&
    board.categories.length > 0 &&
    board.timeframes.length > 0;

  // Handle CSV export
  const handleExport = () => {
    if (board) {
      exportBoardToCSV(board);
    }
  };

  const statusConfig = SYNC_STATUS_CONFIG[syncStatus];

  return (
    <header className="bg-white border-b border-[#637569]/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#29564F]">Wedding Planner</h1>

        <div className="flex items-center gap-4">
          {/* Sync status indicator */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                statusConfig.color,
                syncStatus === 'syncing' && 'animate-pulse'
              )}
            />
            <span>{statusConfig.label}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* View mode toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                title={`${label} view`}
                className={cn(
                  'px-2.5 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                  viewMode === mode
                    ? 'bg-[#29564F] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value as TaskStatus | 'all' })
            }
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={filters.assignee}
            onChange={(e) =>
              onFiltersChange({ ...filters, assignee: e.target.value as TaskAssignee | 'all' })
            }
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            aria-label="Filter by assignee"
          >
            <option value="all">All Assignees</option>
            {(Object.entries(ASSIGNEE_LABELS) as [TaskAssignee, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Hide completed toggle */}
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hideCompleted}
              onChange={(e) =>
                onFiltersChange({ ...filters, hideCompleted: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-[#29564F] focus:ring-[#29564F]"
            />
            Hide completed
          </label>

          {/* Clear filters button (only when filters active) */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}

          {/* Task count (only when filtering) */}
          {hasActiveFilters && (
            <span className="text-xs text-gray-500">
              {taskCount.filtered} of {taskCount.total} tasks
            </span>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!board || board.tasks.length === 0}
            title="Export to CSV"
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
              board && board.tasks.length > 0
                ? 'text-[#29564F] border border-[#29564F] hover:bg-[#29564F]/10'
                : 'text-gray-400 border border-gray-300 cursor-not-allowed'
            )}
          >
            <Download size={14} />
            Export
          </button>

          {/* Add Task button */}
          <button
            onClick={onAddTask}
            disabled={!canAddTask}
            title={
              canAddTask
                ? 'Add a new task'
                : 'Add at least one category and one timeframe first'
            }
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              canAddTask
                ? 'text-white bg-[#29564F] hover:bg-[#29564F]/90'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            )}
          >
            + Add Task
          </button>
        </div>
      </div>
    </header>
  );
}
