import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Eye } from 'lucide-react';
import { CategoryRow } from '../CategoryRow';
import { TimeframeHeader } from '../TimeframeHeader';
import { AddTimeframeButton } from '../AddTimeframeButton';
import { AddCategoryButton } from '../AddCategoryButton';
import { TaskCard } from '../TaskCard';
import type { Board, Category, Timeframe, Task, TaskStatus } from '../../lib/types';

interface GridViewProps {
  board: Board;
  sortedCategories: Category[];
  visibleTimeframes: Timeframe[];
  sortedTimeframes: Timeframe[];
  hiddenTimeframeCount: number;
  filteredTasks: Task[];
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onTaskSelect: (taskId: string | null) => void;
  onQuickAdd: (categoryId: string, timeframeId: string) => void;
  onAddTimeframe: (name: string) => void;
  onUpdateTimeframe: (id: string, updates: Partial<Timeframe>) => void;
  onDeleteTimeframe: (id: string) => void;
  onReorderTimeframes: (timeframes: Timeframe[]) => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onMoveTask: (taskId: string, categoryId: string, timeframeId: string) => void;
}

export function GridView({
  board,
  sortedCategories,
  visibleTimeframes,
  sortedTimeframes,
  hiddenTimeframeCount,
  filteredTasks,
  collapsedIds,
  onToggleCollapse,
  onTaskSelect,
  onQuickAdd,
  onAddTimeframe,
  onUpdateTimeframe,
  onDeleteTimeframe,
  onReorderTimeframes,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateTask,
  onMoveTask,
}: GridViewProps) {
  // Track the currently dragged task for overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Handle timeframe reordering
  const handleMoveTimeframeLeft = useCallback(
    (id: string) => {
      const sorted = [...board.timeframes].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((t) => t.id === id);
      if (index <= 0) return;

      const current = sorted[index];
      const previous = sorted[index - 1];

      const updated: Timeframe[] = board.timeframes.map((t) => {
        if (t.id === current.id) return { ...t, order: previous.order };
        if (t.id === previous.id) return { ...t, order: current.order };
        return t;
      });

      onReorderTimeframes(updated);
    },
    [board, onReorderTimeframes]
  );

  const handleMoveTimeframeRight = useCallback(
    (id: string) => {
      const sorted = [...board.timeframes].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((t) => t.id === id);
      if (index < 0 || index >= sorted.length - 1) return;

      const current = sorted[index];
      const next = sorted[index + 1];

      const updated: Timeframe[] = board.timeframes.map((t) => {
        if (t.id === current.id) return { ...t, order: next.order };
        if (t.id === next.id) return { ...t, order: current.order };
        return t;
      });

      onReorderTimeframes(updated);
    },
    [board, onReorderTimeframes]
  );

  // Toggle timeframe visibility
  const handleToggleTimeframeHidden = useCallback(
    (id: string) => {
      const timeframe = board.timeframes.find((t) => t.id === id);
      if (!timeframe) return;
      onUpdateTimeframe(id, { hidden: !timeframe.hidden });
    },
    [board, onUpdateTimeframe]
  );

  // Show all hidden timeframes
  const handleShowAllTimeframes = useCallback(() => {
    const updated = board.timeframes.map((t) => ({ ...t, hidden: false }));
    onReorderTimeframes(updated);
  }, [board, onReorderTimeframes]);

  // Cycle task status
  const cycleTaskStatus = useCallback(
    (taskId: string) => {
      const task = board.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const statusOrder: TaskStatus[] = ['not_started', 'in_progress', 'completed'];
      const currentIndex = statusOrder.indexOf(task.status);
      const nextStatus = statusOrder[(currentIndex + 1) % 3];

      onUpdateTask(taskId, { status: nextStatus });
    },
    [board, onUpdateTask]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = board.tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [board]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const [categoryId, timeframeId] = (over.id as string).split(':');
      if (!categoryId || !timeframeId) return;

      const taskId = active.id as string;
      const task = board.tasks.find((t) => t.id === taskId);

      if (task && task.categoryId === categoryId && task.timeframeId === timeframeId) {
        return;
      }

      onMoveTask(taskId, categoryId, timeframeId);
    },
    [board, onMoveTask]
  );

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <table className="border-collapse">
          {/* Sticky header row */}
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Category column header */}
              <th className="sticky left-0 z-30 bg-[#DFE5E2] border border-[#637569]/30 px-4 py-3 text-left text-sm font-semibold text-[#29564F] w-[180px] min-w-[180px]">
                Category
              </th>
              {/* Timeframe column headers */}
              {visibleTimeframes.map((timeframe, index) => (
                <TimeframeHeader
                  key={timeframe.id}
                  timeframe={timeframe}
                  isFirst={index === 0}
                  isLast={index === visibleTimeframes.length - 1}
                  tasks={board.tasks}
                  onUpdate={onUpdateTimeframe}
                  onDelete={onDeleteTimeframe}
                  onMoveLeft={handleMoveTimeframeLeft}
                  onMoveRight={handleMoveTimeframeRight}
                  onToggleHidden={handleToggleTimeframeHidden}
                />
              ))}
              {/* Hidden columns indicator */}
              {hiddenTimeframeCount > 0 && (
                <th className="bg-yellow-50 border border-yellow-200 px-3 py-3 min-w-[120px]">
                  <button
                    onClick={handleShowAllTimeframes}
                    className="text-sm text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
                    title="Show all hidden columns"
                  >
                    <Eye size={14} />
                    {hiddenTimeframeCount} hidden
                  </button>
                </th>
              )}
              {/* Add timeframe button */}
              <AddTimeframeButton
                timeframes={sortedTimeframes}
                onAdd={onAddTimeframe}
              />
            </tr>
          </thead>

          <tbody>
            {/* Category rows */}
            {sortedCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                timeframes={visibleTimeframes}
                tasks={filteredTasks}
                isCollapsed={collapsedIds.has(category.id)}
                onToggleCollapse={onToggleCollapse}
                onUpdate={onUpdateCategory}
                onDelete={onDeleteCategory}
                onTaskSelect={onTaskSelect}
                onQuickAdd={onQuickAdd}
                onStatusCycle={cycleTaskStatus}
                hiddenColumnCount={hiddenTimeframeCount}
              />
            ))}

            {/* Add category button row */}
            <AddCategoryButton
              colSpan={visibleTimeframes.length + 2 + (hiddenTimeframeCount > 0 ? 1 : 0)}
              onAdd={onAddCategory}
            />
          </tbody>
        </table>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
