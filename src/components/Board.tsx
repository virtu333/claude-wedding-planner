import { useState, useCallback, useMemo } from 'react';
import { useBoard } from '../hooks/useBoard';
import { useIsMobile } from '../hooks/useIsMobile';
import { Header } from './Header';
import { GridView } from './views/GridView';
import { CalendarContainer } from './views/CalendarContainer';
import { MobileListView } from './views/MobileListView';
import { TaskDetailPanel } from './TaskDetailPanel';
import { AddTaskModal } from './AddTaskModal';
import type { FilterState, ViewMode, TaskStatus } from '../lib/types';

// Storage key for view preference
const VIEW_PREFERENCE_KEY = 'wedding-planner-view-mode';

export function Board() {
  const {
    board,
    loading,
    selectedTaskId,
    selectTask,
    addTimeframe,
    updateTimeframe,
    deleteTimeframe,
    reorderTimeframes,
    addCategory,
    updateCategory,
    deleteCategory,
    updateTask,
    moveTask,
  } = useBoard();

  // Detect mobile viewport
  const isMobile = useIsMobile();

  // View mode state with localStorage persistence
  // Auto-switch to list view on mobile if no preference saved
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Try to load saved preference
    try {
      const saved = localStorage.getItem(VIEW_PREFERENCE_KEY);
      if (saved && ['grid', 'monthly', 'weekly', 'daily', 'list'].includes(saved)) {
        return saved as ViewMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    // Default to list on mobile, grid on desktop
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'list';
    }
    return 'grid';
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Save view mode to localStorage when it changes
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_PREFERENCE_KEY, mode);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Track collapsed categories (local state, not persisted)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Add task modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickAddTarget, setQuickAddTarget] = useState<{
    categoryId: string;
    timeframeId: string;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    assignee: 'all',
    hideCompleted: false,
    searchQuery: '',
  });

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Open add modal (from header button)
  const handleAddTask = useCallback(() => {
    setQuickAddTarget(null);
    setIsAddModalOpen(true);
  }, []);

  // Open add modal (from quick-add in cell)
  const handleQuickAdd = useCallback((categoryId: string, timeframeId: string) => {
    setQuickAddTarget({ categoryId, timeframeId });
    setIsAddModalOpen(true);
  }, []);

  // Close add modal
  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setQuickAddTarget(null);
  }, []);

  // Cycle task status (for MobileListView)
  const handleStatusCycle = useCallback(
    (taskId: string) => {
      const task = board?.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const statusOrder: TaskStatus[] = ['not_started', 'in_progress', 'completed'];
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % 3];

      updateTask(taskId, { status: nextStatus });
    },
    [board, updateTask]
  );

  // Memoize sorted categories and timeframes
  const sortedCategories = useMemo(
    () => (board ? [...board.categories].sort((a, b) => a.order - b.order) : []),
    [board]
  );

  const sortedTimeframes = useMemo(
    () => (board ? [...board.timeframes].sort((a, b) => a.order - b.order) : []),
    [board]
  );

  // Filter to only visible timeframes
  const visibleTimeframes = useMemo(
    () => sortedTimeframes.filter((t) => !t.hidden),
    [sortedTimeframes]
  );

  const hiddenTimeframeCount = useMemo(
    () => sortedTimeframes.filter((t) => t.hidden).length,
    [sortedTimeframes]
  );

  // Filter tasks based on current filter settings
  const filteredTasks = useMemo(() => {
    if (!board) return [];

    const searchLower = filters.searchQuery.trim().toLowerCase();

    return board.tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
      if (filters.hideCompleted && task.status === 'completed') return false;

      // Search filter (title and notes, case-insensitive)
      if (searchLower) {
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const notesMatch = task.notes.toLowerCase().includes(searchLower);
        if (!titleMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [board, filters]);

  // Check for empty filter results
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.assignee !== 'all' ||
    filters.hideCompleted ||
    filters.searchQuery.trim() !== '';
  const noFilterResults =
    hasActiveFilters && filteredTasks.length === 0 && (board?.tasks.length ?? 0) > 0;

  // Clear all filters helper
  const clearFilters = useCallback(() => {
    setFilters({ status: 'all', assignee: 'all', hideCompleted: false, searchQuery: '' });
  }, []);

  if (loading) {
    return (
      <>
        <Header
          onAddTask={handleAddTask}
          filters={filters}
          onFiltersChange={setFilters}
          taskCount={{ filtered: 0, total: 0 }}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isMobile={isMobile}
        />
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#29564F] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Loading board...</p>
          </div>
        </main>
      </>
    );
  }

  if (!board) {
    return (
      <>
        <Header
          onAddTask={handleAddTask}
          filters={filters}
          onFiltersChange={setFilters}
          taskCount={{ filtered: 0, total: 0 }}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isMobile={isMobile}
        />
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mb-4" />
            <p className="text-red-600 font-medium">Failed to load board</p>
            <p className="text-gray-500 text-sm mt-2">
              Please refresh the page to try again.
            </p>
          </div>
        </main>
      </>
    );
  }

  // Determine which view to render
  const renderView = () => {
    if (viewMode === 'list') {
      return (
        <MobileListView
          tasks={filteredTasks}
          timeframes={visibleTimeframes}
          categories={sortedCategories}
          onTaskSelect={selectTask}
          onStatusCycle={handleStatusCycle}
        />
      );
    }

    if (viewMode === 'grid') {
      return (
        <GridView
          board={board}
          sortedCategories={sortedCategories}
          visibleTimeframes={visibleTimeframes}
          sortedTimeframes={sortedTimeframes}
          hiddenTimeframeCount={hiddenTimeframeCount}
          filteredTasks={filteredTasks}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
          onTaskSelect={selectTask}
          onQuickAdd={handleQuickAdd}
          onAddTimeframe={addTimeframe}
          onUpdateTimeframe={updateTimeframe}
          onDeleteTimeframe={deleteTimeframe}
          onReorderTimeframes={reorderTimeframes}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onUpdateTask={updateTask}
          onMoveTask={moveTask}
        />
      );
    }

    // Calendar views (monthly, weekly, daily)
    return (
      <CalendarContainer
        viewMode={viewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        tasks={filteredTasks}
        categories={sortedCategories}
        onTaskSelect={selectTask}
        onUpdateTask={updateTask}
      />
    );
  };

  return (
    <>
      <Header
        onAddTask={handleAddTask}
        filters={filters}
        onFiltersChange={setFilters}
        taskCount={{ filtered: filteredTasks.length, total: board.tasks.length }}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isMobile={isMobile}
      />
      <main className="flex-1 flex flex-col min-h-0">
        {/* No filter results banner */}
        {noFilterResults && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
            <p className="text-yellow-800 text-sm">
              No tasks match your current filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-yellow-700 text-sm underline hover:text-yellow-900"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Empty board welcome message */}
        {sortedCategories.length === 0 && sortedTimeframes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Wedding Planner
            </h2>
            <p className="text-gray-500 mb-1">
              Get started by adding a category and timeframe below.
            </p>
            <p className="text-gray-400 text-sm">
              Categories organize tasks by type (Venue, Catering, etc.) and timeframes
              organize by when.
            </p>
          </div>
        )}

        {/* Horizontal flex container for view and detail panel */}
        <div className="flex-1 flex min-h-0">
          {/* View content based on viewMode */}
          {renderView()}

          {/* Task Detail Panel */}
          {selectedTaskId && (
            <>
              {/* Backdrop overlay for panel mode on medium screens - click to close */}
              {!isMobile && (
                <div
                  className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                  onClick={() => selectTask(null)}
                />
              )}
              <TaskDetailPanel
                taskId={selectedTaskId}
                onClose={() => selectTask(null)}
                variant={isMobile ? 'sheet' : 'panel'}
              />
            </>
          )}
        </div>

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          defaultCategoryId={quickAddTarget?.categoryId}
          defaultTimeframeId={quickAddTarget?.timeframeId}
        />
      </main>
    </>
  );
}
