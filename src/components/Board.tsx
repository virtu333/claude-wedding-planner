import { useState, useCallback, useMemo } from 'react';
import { useBoard } from '../hooks/useBoard';
import { Header } from './Header';
import { GridView } from './views/GridView';
import { CalendarContainer } from './views/CalendarContainer';
import { TaskDetailPanel } from './TaskDetailPanel';
import { AddTaskModal } from './AddTaskModal';
import type { FilterState, ViewMode } from '../lib/types';

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

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

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

    return board.tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
      if (filters.hideCompleted && task.status === 'completed') return false;
      return true;
    });
  }, [board, filters]);

  // Check for empty filter results
  const hasActiveFilters =
    filters.status !== 'all' || filters.assignee !== 'all' || filters.hideCompleted;
  const noFilterResults =
    hasActiveFilters && filteredTasks.length === 0 && (board?.tasks.length ?? 0) > 0;

  // Clear all filters helper
  const clearFilters = useCallback(() => {
    setFilters({ status: 'all', assignee: 'all', hideCompleted: false });
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
          onViewModeChange={setViewMode}
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
          onViewModeChange={setViewMode}
        />
        <main className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mb-4" />
            <p className="text-red-600 font-medium">Failed to load board</p>
            <p className="text-gray-500 text-sm mt-2">Please refresh the page to try again.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        onAddTask={handleAddTask}
        filters={filters}
        onFiltersChange={setFilters}
        taskCount={{ filtered: filteredTasks.length, total: board.tasks.length }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <main className="flex-1 flex flex-col min-h-0">
        {/* No filter results banner */}
        {noFilterResults && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
            <p className="text-yellow-800 text-sm">No tasks match your current filters.</p>
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Wedding Planner
            </h2>
            <p className="text-gray-500 mb-1">
              Get started by adding a category and timeframe below.
            </p>
            <p className="text-gray-400 text-sm">
              Categories organize tasks by type (Venue, Catering, etc.) and timeframes organize by when.
            </p>
          </div>
        )}

        {/* Horizontal flex container for view and detail panel */}
        <div className="flex-1 flex min-h-0">
          {/* View content based on viewMode */}
          {viewMode === 'grid' ? (
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
          ) : (
            <CalendarContainer
              viewMode={viewMode}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              tasks={filteredTasks}
              categories={sortedCategories}
              onTaskSelect={selectTask}
              onUpdateTask={updateTask}
            />
          )}

          {/* Task Detail Panel - slides in from right */}
          {selectedTaskId && (
            <>
              {/* Backdrop overlay for mobile - click to close */}
              <div
                className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                onClick={() => selectTask(null)}
              />
              <TaskDetailPanel
                taskId={selectedTaskId}
                onClose={() => selectTask(null)}
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
