import { useEffect, useState, useCallback } from 'react';
import { X, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useBoard } from '../hooks/useBoard';
import { ConfirmModal } from './ConfirmModal';
import { BottomSheet } from './BottomSheet';
import type { TaskStatus, TaskAssignee, TaskPriority } from '../lib/types';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ASSIGNEE_COLORS,
  ASSIGNEE_LABELS,
  PRIORITY_LABELS,
} from '../lib/constants';
import { cn, getChecklistProgress } from '../lib/utils';

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
  /** 'panel' = desktop side panel (default), 'sheet' = mobile bottom sheet */
  variant?: 'panel' | 'sheet';
}

// Format Date for input type="date" (preserves local timezone)
function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse input value back to Date
function parseDateInput(value: string): Date | null {
  if (!value) return null;
  return new Date(value + 'T00:00:00');
}

export function TaskDetailPanel({ taskId, onClose, variant = 'panel' }: TaskDetailPanelProps) {
  const {
    board,
    updateTask,
    deleteTask,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  } = useBoard();

  // Find the task
  const task = board?.tasks.find((t) => t.id === taskId);

  // Find category name
  const category = task
    ? board?.categories.find((c) => c.id === task.categoryId)
    : null;

  // Get sorted timeframes for dropdown
  const timeframes = board?.timeframes
    ? [...board.timeframes].sort((a, b) => a.order - b.order)
    : [];

  // Checklist state
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Handle ESC key to close (only for panel variant - sheet handles its own)
  useEffect(() => {
    if (variant === 'sheet') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, variant]);

  // Handle delete with confirmation
  const handleDeleteClick = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!task) return;
    deleteTask(task.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  }, [task, deleteTask, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteConfirmOpen(false);
  }, []);

  // Handle adding a new checklist item
  const handleAddChecklistItem = () => {
    if (!task || !newItemTitle.trim()) return;
    addChecklistItem(task.id, newItemTitle.trim());
    setNewItemTitle('');
  };

  // If task not found, show error state
  if (!task) {
    if (variant === 'sheet') {
      return (
        <BottomSheet isOpen={true} onClose={onClose} title="Task not found">
          <div className="p-4 text-center text-gray-500">
            This task could not be found.
          </div>
        </BottomSheet>
      );
    }
    return (
      <div className="fixed top-0 right-0 h-full w-96 max-w-[calc(100vw-48px)] border-l bg-white flex flex-col z-50">
        <div className="flex justify-between items-center p-4 border-b">
          <span className="text-sm text-gray-500">Task not found</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Status options for toggle (using wedding palette)
  const statusOptions: { value: TaskStatus; label: string; activeClass: string }[] = [
    {
      value: 'not_started',
      label: STATUS_LABELS.not_started,
      activeClass: `${STATUS_COLORS.not_started.bg} ${STATUS_COLORS.not_started.border}`,
    },
    {
      value: 'in_progress',
      label: STATUS_LABELS.in_progress,
      activeClass: `${STATUS_COLORS.in_progress.bg} ${STATUS_COLORS.in_progress.border}`,
    },
    {
      value: 'completed',
      label: STATUS_LABELS.completed,
      activeClass: `${STATUS_COLORS.completed.bg} ${STATUS_COLORS.completed.border}`,
    },
  ];

  // Assignee options for toggle (using wedding palette)
  const assigneeOptions: { value: TaskAssignee; label: string; activeClass: string }[] = [
    { value: 'unassigned', label: '—', activeClass: 'bg-gray-100 border-gray-400' },
    {
      value: 'bride',
      label: ASSIGNEE_LABELS.bride,
      activeClass: `${ASSIGNEE_COLORS.bride} border-[#AF7A76]`,
    },
    {
      value: 'groom',
      label: ASSIGNEE_LABELS.groom,
      activeClass: `${ASSIGNEE_COLORS.groom} border-[#637569]`,
    },
    {
      value: 'both',
      label: ASSIGNEE_LABELS.both,
      activeClass: `${ASSIGNEE_COLORS.both} border-[#29564F]`,
    },
    {
      value: 'other',
      label: ASSIGNEE_LABELS.other,
      activeClass: `${ASSIGNEE_COLORS.other} border-gray-400`,
    },
  ];

  // Priority options for toggle (using wedding palette)
  const priorityOptions: { value: TaskPriority; label: string; activeClass: string }[] = [
    { value: 'normal', label: PRIORITY_LABELS.normal, activeClass: 'bg-gray-100 border-gray-400' },
    {
      value: 'high',
      label: PRIORITY_LABELS.high,
      activeClass: 'bg-[#9A3F3C]/15 text-[#9A3F3C] border-[#9A3F3C]',
    },
  ];

  // Shared content for both panel and sheet
  const content = (
    <div className="p-4 space-y-5">
      {/* Title - editable */}
      <input
        type="text"
        value={task.title}
        onChange={(e) => updateTask(task.id, { title: e.target.value })}
        className="text-lg font-semibold w-full border-b border-transparent hover:border-gray-300 focus:border-[#29564F] focus:outline-none pb-1 transition-colors"
        placeholder="Task title..."
      />

      {/* Notes - textarea (shorter for mobile sheet) */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          value={task.notes}
          onChange={(e) => updateTask(task.id, { notes: e.target.value })}
          className={cn(
            'w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-[#29564F] focus:ring-1 focus:ring-[#29564F] focus:outline-none',
            variant === 'sheet' ? 'h-32' : 'h-48'
          )}
          placeholder="Add notes..."
        />
      </div>

      {/* Status toggles */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
        <div className="flex gap-1 flex-wrap">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateTask(task.id, { status: opt.value })}
              className={cn(
                'px-3 py-1.5 text-xs rounded border transition-colors',
                task.status === opt.value
                  ? opt.activeClass
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee toggles */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Assignee</label>
        <div className="flex flex-wrap gap-1">
          {assigneeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateTask(task.id, { assignee: opt.value })}
              className={cn(
                'px-3 py-1.5 text-xs rounded border transition-colors',
                task.assignee === opt.value
                  ? opt.activeClass
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority toggles */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Priority</label>
        <div className="flex gap-1">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateTask(task.id, { priority: opt.value })}
              className={cn(
                'px-3 py-1.5 text-xs rounded border transition-colors',
                task.priority === opt.value
                  ? opt.activeClass
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Timeframe</label>
        <select
          value={task.timeframeId}
          onChange={(e) => updateTask(task.id, { timeframeId: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#29564F] focus:ring-1 focus:ring-[#29564F] focus:outline-none"
        >
          {timeframes.map((tf) => (
            <option key={tf.id} value={tf.id}>
              {tf.name}
            </option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Due Date</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={formatDateForInput(task.dueDate)}
            onChange={(e) =>
              updateTask(task.id, { dueDate: parseDateInput(e.target.value) })
            }
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-[#29564F] focus:ring-1 focus:ring-[#29564F] focus:outline-none"
          />
          {task.dueDate && (
            <button
              onClick={() => updateTask(task.id, { dueDate: null })}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Checklist section */}
      <div className="pt-2 border-t">
        {/* Expandable header */}
        <button
          onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 p-1 -m-1 rounded w-full text-left transition-colors"
        >
          {isChecklistExpanded ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          <span>Checklist ({getChecklistProgress(task.checklist)})</span>
        </button>

        {/* Expanded content */}
        {isChecklistExpanded && (
          <div className="mt-2 ml-1 space-y-1">
            {/* Checklist items */}
            {task.checklist.map((item) => (
              <div key={item.id} className="group flex items-center gap-2 py-1 pr-1">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    updateChecklistItem(task.id, item.id, {
                      completed: !item.completed,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#29564F] focus:ring-[#29564F]"
                />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.completed && 'line-through text-gray-400'
                  )}
                >
                  {item.title}
                </span>
                <button
                  onClick={() => deleteChecklistItem(task.id, item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete item"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add new item input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add item..."
                className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-[#29564F] focus:ring-0 py-1 px-0 placeholder-gray-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Delete button (shared)
  const deleteButton = (
    <div className="p-4">
      <button
        onClick={handleDeleteClick}
        className="w-full py-2 text-sm text-[#861930] border border-[#861930]/30 rounded hover:bg-[#861930]/10 active:bg-[#861930]/20 transition-colors"
      >
        Delete Task
      </button>
    </div>
  );

  // Render as bottom sheet on mobile
  if (variant === 'sheet') {
    return (
      <>
        <BottomSheet
          isOpen={true}
          onClose={onClose}
          title={category?.name || 'Task Details'}
          footer={deleteButton}
        >
          {content}
        </BottomSheet>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          variant="danger"
        />
      </>
    );
  }

  // Render as side panel on desktop (default)
  return (
    <div className="fixed top-0 right-0 h-full w-96 max-w-[calc(100vw-48px)] border-l bg-white flex flex-col shadow-lg z-50">
      {/* Header: Category + Close */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <span className="text-sm text-gray-500">
          {category?.name || 'Unknown Category'}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Close (Esc)"
          aria-label="Close task panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">{content}</div>

      {/* Footer: Delete button */}
      <div className="border-t bg-gray-50">{deleteButton}</div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}
