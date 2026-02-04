import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Flag } from 'lucide-react';
import type { Task } from '../lib/types';
import { cn, formatDate, isOverdue, isDueSoon, getChecklistProgress, getStatusColors, getAssigneeColors, getStatusLabel, getAssigneeLabel } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  onDoubleClick?: () => void;
  onStatusCycle?: () => void;
}

export function TaskCard({ task, onDoubleClick, onStatusCycle }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const isCompleted = task.status === 'completed';

  // Get first line of notes for preview
  const notesPreview = task.notes ? task.notes.split('\n')[0] : '';

  // Determine due date styling (using wedding palette)
  const getDueDateClass = () => {
    if (!task.dueDate) return '';
    if (isOverdue(task.dueDate)) return 'text-[#861930]';  // Burgundy for overdue
    if (isDueSoon(task.dueDate)) return 'text-[#9A3F3C]';  // Terracotta for due soon
    return 'text-gray-500';
  };

  // Check if we have any metadata to show in the bottom row
  const hasChecklist = (task.checklist?.length ?? 0) > 0;
  const hasDueDate = task.dueDate !== null;
  const hasBottomRow = hasChecklist || hasDueDate;

  // Apply transform when dragging
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onDoubleClick={onDoubleClick}
      className={cn(
        'border rounded px-2 py-1.5 cursor-pointer hover:shadow-sm transition-shadow',
        isCompleted
          ? 'opacity-50 bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      {/* Row 1: Grip + Status dot + Title + Priority flag */}
      <div className="flex items-center gap-1.5">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded hover:bg-gray-100"
        >
          <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusCycle?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onStatusCycle?.();
            }
          }}
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 focus:ring-2 focus:ring-offset-1 focus:ring-[#29564F] focus:outline-none',
            getStatusColors(task.status).dot
          )}
          title="Click to cycle status"
          aria-label={`Status: ${getStatusLabel(task.status)}. Click to change.`}
        />
        <span className="text-xs font-medium truncate flex-1 text-gray-700">
          {task.title}
        </span>
        {task.priority === 'high' && (
          <Flag className="w-3 h-3 text-[#9A3F3C] flex-shrink-0" />
        )}
      </div>

      {/* Row 2: Assignee badge (if assigned) */}
      {task.assignee !== 'unassigned' && (
        <div className="mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded inline-block',
              getAssigneeColors(task.assignee)
            )}
          >
            {getAssigneeLabel(task.assignee)}
          </span>
        </div>
      )}

      {/* Row 3: Notes preview (if exists) */}
      {notesPreview && (
        <p className="text-[10px] text-gray-500 truncate mt-1">
          {notesPreview}
        </p>
      )}

      {/* Row 4: Due date + checklist progress */}
      {hasBottomRow && (
        <div className="flex items-center gap-2 text-[10px] mt-1">
          {hasDueDate && (
            <span className={getDueDateClass()}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {hasChecklist && (
            <span className="text-gray-500">
              {getChecklistProgress(task.checklist)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
