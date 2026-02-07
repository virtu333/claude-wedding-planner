import { X } from 'lucide-react';
import { STATUS_LABELS, ASSIGNEE_LABELS } from '../lib/constants';
import type { FilterState, TaskStatus, TaskAssignee } from '../lib/types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FilterModalProps) {
  if (!isOpen) return null;

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.assignee !== 'all' ||
    filters.hideCompleted ||
    filters.searchQuery.trim() !== '';

  const clearFilters = () => {
    onFiltersChange({ status: 'all', assignee: 'all', hideCompleted: false, searchQuery: '' });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl safe-bottom">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-[#29564F]">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          {/* Status filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  status: e.target.value as TaskStatus | 'all',
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            >
              <option value="all">All Statuses</option>
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Assignee filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignee
            </label>
            <select
              value={filters.assignee}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  assignee: e.target.value as TaskAssignee | 'all',
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-[#29564F] focus:border-[#29564F]"
            >
              <option value="all">All Assignees</option>
              {(Object.entries(ASSIGNEE_LABELS) as [TaskAssignee, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Hide completed toggle */}
          <label className="flex items-center gap-3 py-3 border-t border-gray-200">
            <input
              type="checkbox"
              checked={filters.hideCompleted}
              onChange={(e) =>
                onFiltersChange({ ...filters, hideCompleted: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-[#29564F] focus:ring-[#29564F]"
            />
            <span className="text-base text-gray-700">Hide completed tasks</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-1 py-3 text-gray-600 border border-gray-300 rounded-lg font-medium active:bg-gray-100"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#29564F] text-white rounded-lg font-medium active:bg-[#29564F]/90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
