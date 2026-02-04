import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, EyeOff } from 'lucide-react';
import type { Timeframe, Task } from '../lib/types';
import { ConfirmModal } from './ConfirmModal';

interface TimeframeHeaderProps {
  timeframe: Timeframe;
  isFirst: boolean;
  isLast: boolean;
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Timeframe>) => void;
  onDelete: (id: string) => void;
  onMoveLeft: (id: string) => void;
  onMoveRight: (id: string) => void;
  onToggleHidden: (id: string) => void;
}

export function TimeframeHeader({
  timeframe,
  isFirst,
  isLast,
  tasks,
  onUpdate,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onToggleHidden,
}: TimeframeHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(timeframe.name);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Count tasks in this timeframe
  const taskCount = tasks.filter((t) => t.timeframeId === timeframe.id).length;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== timeframe.name) {
      onUpdate(timeframe.id, { name: trimmed });
    } else {
      setEditValue(timeframe.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(timeframe.name);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(timeframe.id);
    setIsDeleteConfirmOpen(false);
  }, [timeframe.id, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteConfirmOpen(false);
  }, []);

  return (
    <th
      className="bg-[#DFE5E2] border border-[#637569]/30 px-4 py-3 text-left text-sm font-semibold text-[#29564F] min-w-[180px] relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-[#29564F] rounded outline-none focus:ring-2 focus:ring-[#29564F]/30"
        />
      ) : (
        <div className="flex items-center justify-between">
          <span
            onClick={() => {
              setEditValue(timeframe.name);
              setIsEditing(true);
            }}
            className="cursor-pointer hover:text-[#637569]"
            title="Click to edit"
          >
            {timeframe.name}
          </span>

          {/* Action buttons - shown on hover */}
          {isHovered && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onMoveLeft(timeframe.id)}
                disabled={isFirst}
                className={`p-1 rounded ${
                  isFirst
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                title="Move left"
                aria-label={`Move ${timeframe.name} left`}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => onMoveRight(timeframe.id)}
                disabled={isLast}
                className={`p-1 rounded ${
                  isLast
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                }`}
                title="Move right"
                aria-label={`Move ${timeframe.name} right`}
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => onToggleHidden(timeframe.id)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                title="Hide column"
                aria-label={`Hide ${timeframe.name}`}
              >
                <EyeOff size={14} />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                title="Delete timeframe"
                aria-label={`Delete ${timeframe.name}`}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Timeframe"
        message={
          taskCount > 0
            ? `Are you sure you want to delete "${timeframe.name}"? This will also delete ${taskCount} task${taskCount === 1 ? '' : 's'}.`
            : `Are you sure you want to delete "${timeframe.name}"?`
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </th>
  );
}
