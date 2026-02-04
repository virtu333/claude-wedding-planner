import { useState, useCallback } from 'react';
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
import { cn, getStatusColors } from '../../lib/utils';
import {
  getMonthGridDays,
  getTasksForDate,
  isInMonth,
  isToday,
  isSameDay,
  DAY_NAMES,
  formatDateId,
  parseDateId,
} from '../../lib/calendarUtils';
import type { Task } from '../../lib/types';

const MAX_VISIBLE_TASKS = 3;

interface MonthlyViewProps {
  currentDate: Date;
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onStatusCycle: (taskId: string) => void;
  onDateChange: (date: Date) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function MonthlyView({
  currentDate,
  tasks,
  onTaskSelect,
  onStatusCycle,
  onDateChange,
  onUpdateTask,
}: MonthlyViewProps) {
  const monthDays = getMonthGridDays(currentDate);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure drag sensors (same as GridView)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Switch to daily view for a specific date
  const handleDayClick = (date: Date) => {
    onDateChange(date);
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
      const newDate = parseDateId(event.over.id as string);

      if (!newDate) return;

      // Find the task and check if it's actually moving to a different day
      const task = tasks.find((t) => t.id === taskId);
      if (task?.dueDate && isSameDay(new Date(task.dueDate), newDate)) {
        return; // Same day, no update needed
      }

      // Update the task's dueDate - auto-sync will handle timeframeId
      onUpdateTask(taskId, { dueDate: newDate });

      // If dropped on a day outside current month, navigate to that month
      if (!isInMonth(newDate, currentDate)) {
        onDateChange(newDate);
      }
    },
    [tasks, onUpdateTask, currentDate, onDateChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-[#637569]/30">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-r border-[#637569]/30 last:border-r-0"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {monthDays.map((day, index) => {
            const dayTasks = getTasksForDate(tasks, day);
            // Sort by priority: high first
            const sortedTasks = [...dayTasks].sort((a, b) => {
              if (a.priority === 'high' && b.priority !== 'high') return -1;
              if (a.priority !== 'high' && b.priority === 'high') return 1;
              return 0;
            });
            const inMonth = isInMonth(day, currentDate);
            const today = isToday(day);
            const overflowCount = Math.max(0, sortedTasks.length - MAX_VISIBLE_TASKS);

            return (
              <DroppableMonthDay
                key={index}
                day={day}
                inMonth={inMonth}
                isToday={today}
                onDayClick={handleDayClick}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      today
                        ? 'text-white bg-[#29564F] w-6 h-6 rounded-full flex items-center justify-center'
                        : inMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Task indicators */}
                <div className="space-y-0.5">
                  {sortedTasks.slice(0, MAX_VISIBLE_TASKS).map((task) => (
                    <DraggableMonthlyTaskDot
                      key={task.id}
                      task={task}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskSelect(task.id);
                      }}
                      onStatusCycle={(e) => {
                        e.stopPropagation();
                        onStatusCycle(task.id);
                      }}
                    />
                  ))}

                  {/* Overflow indicator */}
                  {overflowCount > 0 && (
                    <div className="text-[10px] text-gray-500 font-medium pl-1">
                      +{overflowCount} more
                    </div>
                  )}
                </div>
              </DroppableMonthDay>
            );
          })}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-lg">
            <MonthlyTaskDotContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable month day cell
interface DroppableMonthDayProps {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  onDayClick: (date: Date) => void;
  children: React.ReactNode;
}

function DroppableMonthDay({ day, inMonth, isToday: today, onDayClick, children }: DroppableMonthDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: formatDateId(day),
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-r border-b border-[#637569]/30 p-1 min-h-[100px] cursor-pointer transition-colors',
        !inMonth && 'bg-gray-50',
        today && 'bg-[#29564F]/5',
        isOver && 'bg-[#29564F]/10 ring-2 ring-inset ring-[#29564F]/50',
        'hover:bg-[#29564F]/10'
      )}
      onClick={() => onDayClick(day)}
    >
      {children}
    </div>
  );
}

// Draggable monthly task dot
interface MonthlyTaskDotProps {
  task: Task;
  onClick: (e: React.MouseEvent) => void;
  onStatusCycle: (e: React.MouseEvent) => void;
}

function DraggableMonthlyTaskDot({ task, onClick, onStatusCycle }: MonthlyTaskDotProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const statusColors = getStatusColors(task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-1 py-0.5 rounded text-[10px] cursor-grab transition-colors',
        statusColors.bg,
        task.status === 'completed' && 'opacity-60',
        isDragging && 'opacity-50 shadow-lg',
        'hover:opacity-80 active:cursor-grabbing'
      )}
    >
      <button
        onClick={onStatusCycle}
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0 transition-transform hover:scale-125',
          statusColors.dot
        )}
        title="Click to change status"
      />
      <span className="truncate text-gray-700">{task.title}</span>
      {task.priority === 'high' && (
        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
      )}
    </div>
  );
}

// Non-draggable content for overlay
function MonthlyTaskDotContent({ task }: { task: Task }) {
  const statusColors = getStatusColors(task.status);

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1 py-0.5 rounded text-[10px]',
        statusColors.bg,
        task.status === 'completed' && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          statusColors.dot
        )}
      />
      <span className="truncate text-gray-700">{task.title}</span>
      {task.priority === 'high' && (
        <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
      )}
    </div>
  );
}
