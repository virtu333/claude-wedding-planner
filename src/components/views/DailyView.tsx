import { useMemo } from 'react';
import { cn, getStatusColors, getAssigneeColors, getAssigneeLabel } from '../../lib/utils';
import { getTasksForDate, isToday } from '../../lib/calendarUtils';
import type { Task, Category } from '../../lib/types';

interface DailyViewProps {
  currentDate: Date;
  tasks: Task[];
  categories: Category[];
  onTaskSelect: (taskId: string) => void;
  onStatusCycle: (taskId: string) => void;
  onDateChange: (date: Date) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function DailyView({
  currentDate,
  tasks,
  categories,
  onTaskSelect,
  onStatusCycle,
}: DailyViewProps) {
  const dayTasks = getTasksForDate(tasks, currentDate);
  const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
  const today = isToday(currentDate);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    for (const task of dayTasks) {
      const existing = grouped.get(task.categoryId) || [];
      grouped.set(task.categoryId, [...existing, task]);
    }

    return grouped;
  }, [dayTasks]);

  // Filter categories to only those with tasks for this day
  const categoriesWithTasks = useMemo(() => {
    return categories.filter((cat) => tasksByCategory.has(cat.id));
  }, [categories, tasksByCategory]);

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
          {completedCount > 0 && ` (${completedCount} completed)`}
        </span>
        {today && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#29564F] text-white">
            Today
          </span>
        )}
      </div>

      {/* Task list grouped by category */}
      {dayTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriesWithTasks.map((category) => {
            const categoryTasks = tasksByCategory.get(category.id) || [];
            return (
              <div key={category.id}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#637569]/30">
                  <h3 className="font-semibold text-[#29564F]">{category.name}</h3>
                  <span className="text-sm text-gray-500">({categoryTasks.length})</span>
                </div>

                {/* Tasks in this category */}
                <div className="space-y-3 pl-2">
                  {categoryTasks.map((task) => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskSelect(task.id)}
                      onStatusCycle={() => onStatusCycle(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DailyTaskCardProps {
  task: Task;
  onClick: () => void;
  onStatusCycle: () => void;
}

function DailyTaskCard({ task, onClick, onStatusCycle }: DailyTaskCardProps) {
  const statusColors = getStatusColors(task.status);
  const assigneeColors = getAssigneeColors(task.assignee);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusCycle();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border-2 cursor-pointer transition-all',
        statusColors.bg,
        statusColors.border,
        task.status === 'completed' && 'opacity-60',
        'hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <button
          onClick={handleStatusClick}
          className={cn(
            'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 transition-transform hover:scale-125',
            statusColors.dot
          )}
          title="Click to change status"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            {task.priority === 'high' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex-shrink-0">
                High
              </span>
            )}
          </div>

          {/* Notes preview */}
          {task.notes && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.notes}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-2">
            {assigneeColors && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  assigneeColors
                )}
              >
                {getAssigneeLabel(task.assignee)}
              </span>
            )}
            {task.checklist.length > 0 && (
              <span className="text-xs text-gray-500">
                {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} checklist
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
