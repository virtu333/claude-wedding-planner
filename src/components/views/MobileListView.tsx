import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Flag } from 'lucide-react';
import { cn, getStatusColors, getAssigneeColors, getAssigneeLabel } from '../../lib/utils';
import type { Task, Timeframe, Category } from '../../lib/types';

interface MobileListViewProps {
  tasks: Task[];
  timeframes: Timeframe[];
  categories: Category[];
  onTaskSelect: (taskId: string) => void;
  onStatusCycle: (taskId: string) => void;
}

export function MobileListView({
  tasks,
  timeframes,
  categories,
  onTaskSelect,
  onStatusCycle,
}: MobileListViewProps) {
  // Group tasks by timeframe
  const tasksByTimeframe = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of tasks) {
      const existing = grouped.get(task.timeframeId) || [];
      grouped.set(task.timeframeId, [...existing, task]);
    }
    return grouped;
  }, [tasks]);

  // Find first non-empty timeframe for initial expansion
  const firstNonEmptyId = useMemo(() => {
    const visibleTimeframes = timeframes.filter((tf) => !tf.hidden);
    for (const tf of visibleTimeframes) {
      const tfTasks = tasksByTimeframe.get(tf.id);
      if (tfTasks && tfTasks.length > 0) {
        return tf.id;
      }
    }
    return null;
  }, [timeframes, tasksByTimeframe]);

  // Track expanded sections
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(firstNonEmptyId ? [firstNonEmptyId] : [])
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Category lookup for display
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  // Filter to visible timeframes
  const visibleTimeframes = useMemo(
    () => timeframes.filter((tf) => !tf.hidden),
    [timeframes]
  );

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-500 text-center">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {visibleTimeframes.map((timeframe) => {
        const timeframeTasks = tasksByTimeframe.get(timeframe.id) || [];
        const isExpanded = expandedIds.has(timeframe.id);
        const completedCount = timeframeTasks.filter(
          (t) => t.status === 'completed'
        ).length;

        return (
          <div key={timeframe.id} className="border-b border-gray-200">
            {/* Accordion Header */}
            <button
              onClick={() => toggleExpanded(timeframe.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#DFE5E2] active:bg-[#D0DAD6]"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown size={20} className="text-[#29564F]" />
                ) : (
                  <ChevronRight size={20} className="text-[#29564F]" />
                )}
                <span className="font-medium text-[#29564F]">
                  {timeframe.name}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {completedCount}/{timeframeTasks.length}
              </span>
            </button>

            {/* Task List */}
            {isExpanded && (
              <div className="bg-white divide-y divide-gray-100">
                {timeframeTasks.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    No tasks in this timeframe
                  </div>
                ) : (
                  timeframeTasks.map((task) => (
                    <MobileTaskItem
                      key={task.id}
                      task={task}
                      categoryName={categoryMap.get(task.categoryId)}
                      onSelect={() => onTaskSelect(task.id)}
                      onStatusCycle={() => onStatusCycle(task.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MobileTaskItemProps {
  task: Task;
  categoryName?: string;
  onSelect: () => void;
  onStatusCycle: () => void;
}

function MobileTaskItem({
  task,
  categoryName,
  onSelect,
  onStatusCycle,
}: MobileTaskItemProps) {
  const statusColors = getStatusColors(task.status);
  const assigneeColors = getAssigneeColors(task.assignee);

  const handleStatusTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onStatusCycle();
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-4 py-3 min-h-[56px] active:bg-gray-50 cursor-pointer',
        task.status === 'completed' && 'opacity-60'
      )}
    >
      {/* Status dot - larger touch target */}
      <button
        onClick={handleStatusTap}
        className="w-10 h-10 flex items-center justify-center -m-1 rounded-full active:bg-gray-200"
        aria-label={`Change status, currently ${task.status.replace('_', ' ')}`}
      >
        <span
          className={cn('w-4 h-4 rounded-full transition-colors', statusColors.dot)}
        />
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium text-gray-900 truncate',
              task.status === 'completed' && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </span>
          {task.priority === 'high' && (
            <Flag size={14} className="text-[#9A3F3C] flex-shrink-0" />
          )}
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-0.5">
          {categoryName && (
            <span className="text-xs text-gray-500 truncate">{categoryName}</span>
          )}
          {assigneeColors && (
            <span
              className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0', assigneeColors)}
            >
              {getAssigneeLabel(task.assignee)}
            </span>
          )}
        </div>
      </div>

      {/* Chevron hint for tap */}
      <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
    </div>
  );
}
