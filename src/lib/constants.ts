import type { TaskStatus, TaskAssignee, TaskPriority } from './types';

// Status colors (Tailwind classes with wedding palette)
export const STATUS_COLORS: Record<TaskStatus, { bg: string; dot: string; border: string }> = {
  not_started: { bg: 'bg-gray-200', dot: 'bg-gray-400', border: 'border-gray-400' },
  in_progress: { bg: 'bg-[#9E4C26]/10', dot: 'bg-[#9E4C26]', border: 'border-[#9E4C26]' }, // Paprika
  completed: { bg: 'bg-[#29564F]/10', dot: 'bg-[#29564F]', border: 'border-[#29564F]' },   // Dark Green
};

// Assignee colors (Tailwind classes with wedding palette)
export const ASSIGNEE_COLORS: Record<Exclude<TaskAssignee, 'unassigned'>, string> = {
  bride: 'bg-[#AF7A76]/15 text-[#AF7A76]',   // Cedar Rose
  groom: 'bg-[#637569]/15 text-[#637569]',   // Eucalyptus
  both: 'bg-[#29564F]/15 text-[#29564F]',    // Dark Green
  other: 'bg-gray-100 text-gray-700',
};

// Status display labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// Assignee display labels
export const ASSIGNEE_LABELS: Record<TaskAssignee, string> = {
  unassigned: 'Not Assigned',
  bride: 'Bride',
  groom: 'Groom',
  both: 'Both',
  other: 'Other',
};

// Priority display labels
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  normal: 'Normal',
  high: 'High',
};

// Due date thresholds (in days)
export const DUE_SOON_DAYS = 7;
