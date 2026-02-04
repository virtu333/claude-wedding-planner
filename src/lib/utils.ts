import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DUE_SOON_DAYS, STATUS_LABELS, ASSIGNEE_LABELS, PRIORITY_LABELS, STATUS_COLORS, ASSIGNEE_COLORS } from './constants';
import type { Board, TaskStatus, TaskAssignee, TaskPriority } from './types';

/**
 * Generate a unique ID using UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Check if a date is overdue (before today)
 */
export function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Check if a date is due soon (within DUE_SOON_DAYS days)
 */
export function isDueSoon(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= DUE_SOON_DAYS;
}

/**
 * Get checklist progress as a string (e.g., "2/5")
 */
export function getChecklistProgress(checklist: { completed: boolean }[] | undefined): string {
  if (!checklist || checklist.length === 0) return '0/0';
  const completed = checklist.filter((item) => item.completed).length;
  return `${completed}/${checklist.length}`;
}

// ============================================================================
// SAFE ENUM ACCESSORS (defensive coding for invalid enum values)
// ============================================================================

const DEFAULT_STATUS_COLORS = { bg: 'bg-gray-200', dot: 'bg-gray-400', border: 'border-gray-400' };
const DEFAULT_ASSIGNEE_COLORS = 'bg-gray-100 text-gray-700';

/**
 * Safely get status colors with fallback for invalid values
 */
export function getStatusColors(status: TaskStatus): { bg: string; dot: string; border: string } {
  return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLORS;
}

/**
 * Safely get assignee colors with fallback for invalid values
 * Returns null for 'unassigned' (no badge shown)
 */
export function getAssigneeColors(assignee: TaskAssignee): string | null {
  if (assignee === 'unassigned') return null;
  return ASSIGNEE_COLORS[assignee as Exclude<TaskAssignee, 'unassigned'>] ?? DEFAULT_ASSIGNEE_COLORS;
}

/**
 * Safely get status label with fallback
 */
export function getStatusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status] ?? 'Unknown';
}

/**
 * Safely get assignee label with fallback
 */
export function getAssigneeLabel(assignee: TaskAssignee): string {
  return ASSIGNEE_LABELS[assignee] ?? 'Unknown';
}

/**
 * Safely get priority label with fallback
 */
export function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority] ?? 'Normal';
}

/**
 * Escape a value for CSV (handles commas, quotes, newlines, and formula injection)
 */
function escapeCSVValue(value: string): string {
  // Prevent formula injection: prefix dangerous chars with single quote
  // Excel/Sheets interpret =, +, -, @ as formula starters
  let escaped = value;
  if (/^[=+\-@\t\r]/.test(value)) {
    escaped = "'" + value;
  }
  // Standard CSV escaping
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}

/**
 * Format a date for CSV export (YYYY-MM-DD)
 */
function formatDateForCSV(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Export board data to a CSV file and trigger download
 */
export function exportBoardToCSV(board: Board): void {
  // Create lookup maps for category and timeframe names
  const categoryMap = new Map(board.categories.map((c) => [c.id, c.name]));
  const timeframeMap = new Map(board.timeframes.map((t) => [t.id, t.name]));

  // CSV headers
  const headers = [
    'Title',
    'Category',
    'Timeframe',
    'Status',
    'Assignee',
    'Priority',
    'Due Date',
    'Notes',
    'Checklist',
  ];

  // Build CSV rows
  const rows = board.tasks.map((task) => {
    const checklistProgress =
      task.checklist.length > 0 ? getChecklistProgress(task.checklist) : '';

    return [
      escapeCSVValue(task.title),
      escapeCSVValue(categoryMap.get(task.categoryId) || ''),
      escapeCSVValue(timeframeMap.get(task.timeframeId) || ''),
      escapeCSVValue(getStatusLabel(task.status)),
      escapeCSVValue(getAssigneeLabel(task.assignee)),
      escapeCSVValue(getPriorityLabel(task.priority)),
      formatDateForCSV(task.dueDate),
      escapeCSVValue(task.notes),
      checklistProgress,
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wedding-planner-${formatDateForCSV(new Date())}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
