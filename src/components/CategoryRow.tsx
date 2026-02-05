import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, X, Plus } from 'lucide-react';
import type { Category, Timeframe, Task } from '../lib/types';
import { TaskCard } from './TaskCard';
import { DroppableCell } from './DroppableCell';
import { ConfirmModal } from './ConfirmModal';

interface CategoryRowProps {
  category: Category;
  timeframes: Timeframe[];
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
  onTaskSelect: (taskId: string) => void;
  onQuickAdd: (categoryId: string, timeframeId: string) => void;
  onStatusCycle: (taskId: string) => void;
  hiddenColumnCount?: number;
}

export function CategoryRow({
  category,
  timeframes,
  tasks,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  onDelete,
  onTaskSelect,
  onQuickAdd,
  onStatusCycle,
  hiddenColumnCount = 0,
}: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get tasks for this category
  const categoryTasks = tasks.filter((t) => t.categoryId === category.id);
  const taskCount = categoryTasks.length;

  // Get tasks for a specific cell (category + timeframe)
  const getTasksInCell = (timeframeId: string) => {
    return categoryTasks.filter((t) => t.timeframeId === timeframeId);
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== category.name) {
      onUpdate(category.id, { name: trimmed });
    } else {
      setEditValue(category.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(category.name);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(category.id);
    setIsDeleteConfirmOpen(false);
  }, [category.id, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteConfirmOpen(false);
  }, []);

  return (
    <tr>
      {/* Category name column - sticky for horizontal scroll */}
      <td
        className="sticky left-0 z-10 bg-[#E8EDEB] border border-[#637569]/30 px-4 py-3 text-sm font-medium text-[#29564F] w-[180px] min-w-[180px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Collapse/expand button */}
            <button
              onClick={() => onToggleCollapse(category.id)}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0"
              title={isCollapsed ? 'Expand' : 'Collapse'}
              aria-label={isCollapsed ? `Expand ${category.name}` : `Collapse ${category.name}`}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Category name */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 px-1 py-0.5 text-sm border border-[#29564F] rounded outline-none focus:ring-2 focus:ring-[#29564F]/30"
              />
            ) : (
              <span
                onClick={() => {
                  setEditValue(category.name);
                  setIsEditing(true);
                }}
                className="cursor-pointer hover:text-[#637569] truncate"
                title="Click to edit"
              >
                {category.name}
              </span>
            )}

            {/* Task count */}
            <span className="text-gray-400 text-xs flex-shrink-0">({taskCount})</span>
          </div>

          {/* Delete button - shown on hover */}
          {isHovered && !isEditing && (
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 ml-1"
              title="Delete category"
              aria-label={`Delete ${category.name}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Task cells or collapsed state */}
      {isCollapsed ? (
        <td
          colSpan={timeframes.length + 1 + (hiddenColumnCount > 0 ? 1 : 0)}
          className="border border-gray-200 bg-gray-50 px-4 py-3"
        >
          <span className="text-gray-400 text-sm italic">collapsed</span>
        </td>
      ) : (
        <>
          {/* Task cells for each timeframe */}
          {timeframes.map((timeframe) => {
            const cellTasks = getTasksInCell(timeframe.id);

            return (
              <DroppableCell
                key={timeframe.id}
                categoryId={category.id}
                timeframeId={timeframe.id}
              >
                {cellTasks.length > 0 ? (
                  <div className="space-y-1">
                    {cellTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDoubleClick={() => onTaskSelect(task.id)}
                        onStatusCycle={() => onStatusCycle(task.id)}
                      />
                    ))}
                    {/* Quick add button when there are tasks */}
                    <button
                      onClick={() => onQuickAdd(category.id, timeframe.id)}
                      className="w-full min-h-[24px] text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded transition-colors flex items-center justify-center"
                      title="Add task"
                      aria-label={`Add task to ${category.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onQuickAdd(category.id, timeframe.id)}
                    className="w-full h-full min-h-[40px] text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded transition-colors flex items-center justify-center"
                    title="Add task"
                    aria-label={`Add task to ${category.name}`}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </DroppableCell>
            );
          })}

          {/* Empty cell for hidden columns indicator */}
          {hiddenColumnCount > 0 && (
            <td className="border border-yellow-200 bg-yellow-50 min-w-[120px] max-w-[320px]"></td>
          )}
          {/* Empty cell for the add timeframe column */}
          <td className="border border-gray-200 bg-gray-50 min-w-[50px] max-w-[320px]"></td>

          {/* Delete Confirmation Modal (rendered in portal via fixed positioning) */}
          <ConfirmModal
            isOpen={isDeleteConfirmOpen}
            title="Delete Category"
            message={
              taskCount > 0
                ? `Are you sure you want to delete "${category.name}"? This will also delete ${taskCount} task${taskCount === 1 ? '' : 's'}.`
                : `Are you sure you want to delete "${category.name}"?`
            }
            confirmLabel="Delete"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            variant="danger"
          />
        </>
      )}
    </tr>
  );
}
