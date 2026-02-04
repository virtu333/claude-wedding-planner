import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useBoard } from '../hooks/useBoard';
import type { Category, Timeframe } from '../lib/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  defaultTimeframeId?: string;
}

// Inner form component that resets on mount
function AddTaskForm({
  onClose,
  defaultCategoryId,
  defaultTimeframeId,
  sortedCategories,
  sortedTimeframes,
  addTask,
}: {
  onClose: () => void;
  defaultCategoryId?: string;
  defaultTimeframeId?: string;
  sortedCategories: Category[];
  sortedTimeframes: Timeframe[];
  addTask: (task: {
    title: string;
    notes: string;
    status: 'not_started';
    assignee: 'unassigned';
    priority: 'normal';
    categoryId: string;
    timeframeId: string;
    dueDate: null;
    checklist: never[];
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize form state with defaults
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(
    defaultCategoryId || sortedCategories[0]?.id || ''
  );
  const [timeframeId, setTimeframeId] = useState(
    defaultTimeframeId || sortedTimeframes[0]?.id || ''
  );

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedTitle = title.trim();
      if (!trimmedTitle || !categoryId || !timeframeId) return;

      addTask({
        title: trimmedTitle,
        notes: '',
        status: 'not_started',
        assignee: 'unassigned',
        priority: 'normal',
        categoryId,
        timeframeId,
        dueDate: null,
        checklist: [],
      });

      onClose();
    },
    [title, categoryId, timeframeId, addTask, onClose]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="task-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          ref={inputRef}
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
          required
        />
      </div>

      {/* Category + Timeframe */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="task-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="task-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            required
          >
            {sortedCategories.map((c: Category) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="task-timeframe"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Timeframe <span className="text-red-500">*</span>
          </label>
          <select
            id="task-timeframe"
            value={timeframeId}
            onChange={(e) => setTimeframeId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            required
          >
            {sortedTimeframes.map((t: Timeframe) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#29564F] hover:bg-[#29564F]/90 rounded-md transition-colors"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}

export function AddTaskModal({
  isOpen,
  onClose,
  defaultCategoryId,
  defaultTimeframeId,
}: AddTaskModalProps) {
  const { board, addTask } = useBoard();

  // Get sorted categories and timeframes (memoized)
  const sortedCategories = useMemo(
    () => (board ? [...board.categories].sort((a, b) => a.order - b.order) : []),
    [board]
  );
  const sortedTimeframes = useMemo(
    () => (board ? [...board.timeframes].sort((a, b) => a.order - b.order) : []),
    [board]
  );

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - uses key to reset on each open */}
        <AddTaskForm
          key={`form-${defaultCategoryId ?? 'default'}-${defaultTimeframeId ?? 'default'}`}
          onClose={onClose}
          defaultCategoryId={defaultCategoryId}
          defaultTimeframeId={defaultTimeframeId}
          sortedCategories={sortedCategories}
          sortedTimeframes={sortedTimeframes}
          addTask={addTask}
        />
      </div>
    </div>
  );
}
