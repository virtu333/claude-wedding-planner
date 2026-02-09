import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn, getStatusColors, getAssigneeColors } from '../../lib/utils';
import {
  getWeekDays,
  getTasksForDate,
  isToday,
  isSameDay,
  addDays,
  DAY_NAMES,
  formatDateId,
  parseDateId,
} from '../../lib/calendarUtils';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Task, Category } from '../../lib/types';

interface WeeklyViewProps {
  currentDate: Date;
  tasks: Task[];
  categories: Category[];
  onTaskSelect: (taskId: string) => void;
  onStatusCycle: (taskId: string) => void;
  onDateChange: (date: Date) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function WeeklyView({
  currentDate,
  tasks,
  categories,
  onTaskSelect,
  onStatusCycle,
  onUpdateTask,
}: WeeklyViewProps) {
  const weekDays = getWeekDays(currentDate);
  const isMobile = useIsMobile();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Build 9-day array with peek columns (prev Saturday + next Sunday) on desktop
  const displayDays = useMemo(() => {
    if (isMobile) {
      return weekDays.map((date) => ({ date, isPeek: false }));
    }
    const prevSaturday = addDays(weekDays[0], -1); // Saturday before this Sunday
    const nextSunday = addDays(weekDays[6], 1);     // Sunday after this Saturday
    return [
      { date: prevSaturday, isPeek: true },
      ...weekDays.map((date) => ({ date, isPeek: false })),
      { date: nextSunday, isPeek: true },
    ];
  }, [weekDays, isMobile]);

  // Configure drag sensors (same as GridView)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Get tasks for each display day (includes peek days)
  const tasksByDay = useMemo(() => {
    return displayDays.map(({ date }) => getTasksForDate(tasks, date));
  }, [displayDays, tasks]);

  // Filter categories to only those with at least one task this week
  const categoriesWithTasks = useMemo(() => {
    const categoryIdsWithTasks = new Set<string>();

    for (const dayTasks of tasksByDay) {
      for (const task of dayTasks) {
        categoryIdsWithTasks.add(task.categoryId);
      }
    }

    return categories.filter((cat) => categoryIdsWithTasks.has(cat.id));
  }, [categories, tasksByDay]);

  // Helper to get tasks for a specific category and day
  const getTasksForCategoryAndDay = (categoryId: string, day: Date): Task[] => {
    return tasks.filter(
      (task) =>
        task.categoryId === categoryId &&
        task.dueDate &&
        isSameDay(new Date(task.dueDate), day)
    );
  };

  // Drag handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);

      if (!event.over) return;

      const taskId = event.active.id as string;
      const overId = event.over.id as string;

      // Parse format: "categoryId:date:YYYY-MM-DD"
      const datePrefix = overId.indexOf(':date:');
      if (datePrefix === -1) return;

      const dateId = overId.slice(datePrefix + 1); // "date:YYYY-MM-DD"
      const newDate = parseDateId(dateId);

      if (!newDate) return;

      // Find the task and check if it's actually moving to a different day
      const task = tasks.find((t) => t.id === taskId);
      if (task?.dueDate && isSameDay(new Date(task.dueDate), newDate)) {
        return; // Same day, no update needed
      }

      // Update the task's dueDate - auto-sync will handle timeframeId
      onUpdateTask(taskId, { dueDate: newDate });
    },
    [tasks, onUpdateTask]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-auto">
        <table className="w-full border-collapse">
          {/* Day headers */}
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-[#637569]/30">
              {/* Category column header */}
              <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase bg-[#DFE5E2] border-r border-[#637569]/30 sticky left-0 z-30">
                Category
              </th>
              {/* Day columns */}
              {displayDays.map(({ date: day, isPeek }, index) => {
                const today = !isPeek && isToday(day);
                return (
                  <th
                    key={index}
                    className={cn(
                      'px-2 py-3 text-center border-r border-[#637569]/30 last:border-r-0 min-w-[120px] bg-[#DFE5E2]',
                      today && 'bg-[#D0DAD6]',
                      isPeek && 'text-gray-400 bg-[#DFE5E2]/60'
                    )}
                  >
                    <div className="text-xs text-gray-500 uppercase">{DAY_NAMES[day.getDay()]}</div>
                    <div
                      className={cn(
                        'text-lg font-semibold mt-1',
                        today ? 'text-[#29564F]' : isPeek ? 'text-gray-400' : 'text-gray-700'
                      )}
                    >
                      {day.getDate()}
                    </div>
                    {today && (
                      <div className="text-xs text-[#29564F] font-medium">Today</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {categoriesWithTasks.length === 0 ? (
              <tr>
                <td colSpan={displayDays.length + 1} className="text-center py-12 text-gray-500">
                  No tasks scheduled this week.
                </td>
              </tr>
            ) : (
              categoriesWithTasks.map((category) => (
                <tr key={category.id} className="border-b border-[#637569]/30">
                  {/* Category name */}
                  <td className="px-3 py-2 font-medium text-[#29564F] bg-[#DFE5E2]/50 border-r border-[#637569]/30 sticky left-0 align-top">
                    {category.name}
                  </td>

                  {/* Day cells */}
                  {displayDays.map(({ date: day, isPeek }, dayIndex) => {
                    const cellTasks = getTasksForCategoryAndDay(category.id, day);
                    const today = !isPeek && isToday(day);

                    return (
                      <DroppableDayCell key={dayIndex} categoryId={category.id} date={day} isToday={today} isPeek={isPeek}>
                        <div className="space-y-1">
                          {cellTasks.map((task) => (
                            <DraggableWeeklyTaskCard
                              key={task.id}
                              task={task}
                              isPeek={isPeek}
                              onClick={() => onTaskSelect(task.id)}
                              onStatusCycle={() => onStatusCycle(task.id)}
                            />
                          ))}
                        </div>
                      </DroppableDayCell>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-lg">
            <WeeklyTaskCardContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable day cell component
interface DroppableDayCellProps {
  categoryId: string;
  date: Date;
  isToday: boolean;
  isPeek: boolean;
  children: React.ReactNode;
}

function DroppableDayCell({ categoryId, date, isToday: today, isPeek, children }: DroppableDayCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${categoryId}:${formatDateId(date)}`,
  });

  return (
    <td
      ref={setNodeRef}
      className={cn(
        'p-2 border-r border-[#637569]/30 last:border-r-0 align-top min-h-[60px] transition-colors',
        today && 'bg-[#29564F]/5',
        isPeek && 'bg-gray-100/50',
        isOver && 'bg-[#29564F]/10 ring-2 ring-inset ring-[#29564F]/50'
      )}
    >
      {children}
    </td>
  );
}

// Draggable weekly task card
interface WeeklyTaskCardProps {
  task: Task;
  isPeek?: boolean;
  onClick: () => void;
  onStatusCycle: () => void;
}

function DraggableWeeklyTaskCard({ task, isPeek, onClick, onStatusCycle }: WeeklyTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const statusColors = getStatusColors(task.status);
  const assigneeColors = getAssigneeColors(task.assignee);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusCycle();
  };

  const handleCardClick = () => {
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        'p-2 rounded border cursor-pointer transition-all text-sm',
        statusColors.bg,
        statusColors.border,
        task.status === 'completed' && 'opacity-60',
        isPeek && task.status !== 'completed' && 'opacity-50',
        isDragging && 'opacity-50 shadow-lg',
        'hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing touch-none p-0.5 -m-0.5 rounded hover:bg-black/5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </div>

        {/* Status dot */}
        <button
          onClick={handleStatusClick}
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 transition-transform hover:scale-125',
            statusColors.dot
          )}
          title="Click to change status"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-xs">{task.title}</p>
          {assigneeColors && (
            <span
              className={cn(
                'inline-block text-[10px] px-1 py-0.5 rounded mt-1',
                assigneeColors
              )}
            >
              {task.assignee}
            </span>
          )}
        </div>

        {/* Priority indicator */}
        {task.priority === 'high' && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="High priority" />
        )}
      </div>
    </div>
  );
}

// Non-draggable card content for overlay
function WeeklyTaskCardContent({ task }: { task: Task }) {
  const statusColors = getStatusColors(task.status);
  const assigneeColors = getAssigneeColors(task.assignee);

  return (
    <div
      className={cn(
        'p-2 rounded border text-sm',
        statusColors.bg,
        statusColors.border,
        task.status === 'completed' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1',
            statusColors.dot
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-xs">{task.title}</p>
          {assigneeColors && (
            <span
              className={cn(
                'inline-block text-[10px] px-1 py-0.5 rounded mt-1',
                assigneeColors
              )}
            >
              {task.assignee}
            </span>
          )}
        </div>
        {task.priority === 'high' && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
