import type { Task } from './types';

/**
 * Get the first day of a month (set to start of day)
 */
export function getFirstDayOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the last day of a month (set to start of day)
 */
export function getLastDayOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get all days in a month grid (includes padding days from prev/next month)
 * Returns 6 weeks (42 days) for consistent grid layout
 */
export function getMonthGridDays(date: Date): Date[] {
  const firstDay = getFirstDayOfMonth(date);

  // Start from Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: Date[] = [];
  const current = new Date(startDate);

  // Always generate 6 weeks (42 days) for consistent grid
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Get the start of a week (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get 7 days of a week starting from Sunday
 */
export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date is in the given month
 */
export function isInMonth(date: Date, month: Date): boolean {
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Format month and year (e.g., "January 2026")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format week range (e.g., "Jan 5 - 11, 2026")
 */
export function formatWeekRange(date: Date): string {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    // "Jan 5 - 11, 2026"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  } else if (sameYear) {
    // "Jan 29 - Feb 4, 2026"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
  } else {
    // "Dec 29, 2025 - Jan 4, 2026"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}

/**
 * Format day header (e.g., "Monday, January 5, 2026")
 */
export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format short day (e.g., "Mon 5")
 */
export function formatShortDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

/**
 * Get tasks for a specific date (matches by dueDate)
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => task.dueDate && isSameDay(task.dueDate, date));
}

/**
 * Get tasks without a due date
 */
export function getUnscheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.dueDate);
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Day names for calendar headers
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a date as a droppable ID for calendar DnD
 * Format: "date:YYYY-MM-DD"
 */
export function formatDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `date:${year}-${month}-${day}`;
}

/**
 * Parse a droppable ID back to a Date
 * Returns null if the ID format is invalid
 */
export function parseDateId(id: string): Date | null {
  if (!id.startsWith('date:')) return null;
  const dateStr = id.slice(5); // Remove "date:" prefix
  const [year, month, day] = dateStr.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}
