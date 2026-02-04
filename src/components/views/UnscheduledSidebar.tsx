import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { cn, getStatusColors, getAssigneeColors } from '../../lib/utils';
import type { Task } from '../../lib/types';

interface UnscheduledSidebarProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onStatusCycle: (taskId: string) => void;
}

export function UnscheduledSidebar({
  tasks,
  onTaskSelect,
  onStatusCycle,
}: UnscheduledSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="w-64 border-l border-[#637569]/30 bg-white flex flex-col">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 px-4 py-3 border-b border-[#637569]/30 bg-[#DFE5E2] hover:bg-[#DFE5E2]/80 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        <Calendar size={16} className="text-[#29564F]" />
        <span className="font-medium text-[#29564F]">Unscheduled</span>
        <span className="text-sm text-gray-500">({tasks.length})</span>
      </button>

      {/* Task list */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tasks.map((task) => (
            <UnscheduledTaskItem
              key={task.id}
              task={task}
              onClick={() => onTaskSelect(task.id)}
              onStatusCycle={() => onStatusCycle(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UnscheduledTaskItemProps {
  task: Task;
  onClick: () => void;
  onStatusCycle: () => void;
}

function UnscheduledTaskItem({ task, onClick, onStatusCycle }: UnscheduledTaskItemProps) {
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
        'p-2 rounded-md border cursor-pointer transition-colors',
        statusColors.bg,
        statusColors.border,
        task.status === 'completed' && 'opacity-60',
        'hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Status dot */}
        <button
          onClick={handleStatusClick}
          className={cn(
            'w-3 h-3 rounded-full flex-shrink-0 mt-1 transition-transform hover:scale-125',
            statusColors.dot
          )}
          title="Click to change status"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
          {assigneeColors && (
            <span
              className={cn(
                'inline-block text-xs px-1.5 py-0.5 rounded mt-1',
                assigneeColors
              )}
            >
              {task.assignee}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
