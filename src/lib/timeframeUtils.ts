import type { Timeframe } from './types';
import { generateId } from './utils';

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Format a Date as an ISO date string (YYYY-MM-DD).
 * Used for timeframe startDate/endDate fields.
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string to a Date object (at midnight local time).
 */
function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date falls within a timeframe's date metadata.
 * Returns false if timeframe lacks date metadata.
 */
function isDateInTimeframe(date: Date, tf: Timeframe): boolean {
  if (!tf.startDate || !tf.endDate) return false;
  const dateStr = toISODateString(date);
  return dateStr >= tf.startDate && dateStr <= tf.endDate;
}

/**
 * Check if a date falls within a date range (inclusive).
 * Used for legacy fallback matching.
 */
function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

// ============================================================================
// LEGACY TIMEFRAME RANGES (for backwards compatibility during migration)
// ============================================================================

/**
 * LEGACY: Hardcoded date ranges for existing timeframes.
 * Used as fallback when timeframes lack date metadata.
 *
 * TODO: Remove after all boards have been migrated to use date metadata.
 */
const LEGACY_TIMEFRAME_RANGES: Record<string, { start: Date; end: Date }> = {
  'June-Aug 2025': { start: new Date(2025, 5, 1), end: new Date(2025, 7, 31) },
  'Sept-Nov 2025': { start: new Date(2025, 8, 1), end: new Date(2025, 10, 30) },
  'Dec 2025': { start: new Date(2025, 11, 1), end: new Date(2025, 11, 31) },
  'Jan 2026': { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) },
  'Feb 1-7': { start: new Date(2026, 1, 1), end: new Date(2026, 1, 7) },
  'Feb 8-14': { start: new Date(2026, 1, 8), end: new Date(2026, 1, 14) },
  'Feb 15-21': { start: new Date(2026, 1, 15), end: new Date(2026, 1, 21) },
  'Feb 22-28': { start: new Date(2026, 1, 22), end: new Date(2026, 1, 28) },
  'Mar 1-7': { start: new Date(2026, 2, 1), end: new Date(2026, 2, 7) },
  'Mar 8-14': { start: new Date(2026, 2, 8), end: new Date(2026, 2, 14) },
  'Mar 15-21': { start: new Date(2026, 2, 15), end: new Date(2026, 2, 21) },
  'Mar 22-31': { start: new Date(2026, 2, 22), end: new Date(2026, 2, 31) },
  'Apr 1-15': { start: new Date(2026, 3, 1), end: new Date(2026, 3, 15) },
  'Apr 16-30': { start: new Date(2026, 3, 16), end: new Date(2026, 3, 30) },
  'May 1-7': { start: new Date(2026, 4, 1), end: new Date(2026, 4, 7) },
  // Single-day timeframes (both with and without day prefix for compatibility)
  'May 8': { start: new Date(2026, 4, 8), end: new Date(2026, 4, 8) },
  'May 9': { start: new Date(2026, 4, 9), end: new Date(2026, 4, 9) },
  'May 10': { start: new Date(2026, 4, 10), end: new Date(2026, 4, 10) },
  'May 11': { start: new Date(2026, 4, 11), end: new Date(2026, 4, 11) },
  'May 12': { start: new Date(2026, 4, 12), end: new Date(2026, 4, 12) },
  'May 13': { start: new Date(2026, 4, 13), end: new Date(2026, 4, 13) },
  'May 14': { start: new Date(2026, 4, 14), end: new Date(2026, 4, 14) },
  'May 15': { start: new Date(2026, 4, 15), end: new Date(2026, 4, 15) },
  'May 16': { start: new Date(2026, 4, 16), end: new Date(2026, 4, 16) },
  'May 17': { start: new Date(2026, 4, 17), end: new Date(2026, 4, 17) },
  'Fri May 8': { start: new Date(2026, 4, 8), end: new Date(2026, 4, 8) },
  'Sat May 9': { start: new Date(2026, 4, 9), end: new Date(2026, 4, 9) },
  'Sun May 10': { start: new Date(2026, 4, 10), end: new Date(2026, 4, 10) },
  'Mon May 11': { start: new Date(2026, 4, 11), end: new Date(2026, 4, 11) },
  'Tue May 12': { start: new Date(2026, 4, 12), end: new Date(2026, 4, 12) },
  'Wed May 13': { start: new Date(2026, 4, 13), end: new Date(2026, 4, 13) },
  'Thu May 14': { start: new Date(2026, 4, 14), end: new Date(2026, 4, 14) },
  'Fri May 15': { start: new Date(2026, 4, 15), end: new Date(2026, 4, 15) },
  'Sat May 16': { start: new Date(2026, 4, 16), end: new Date(2026, 4, 16) },
  'Sun May 17': { start: new Date(2026, 4, 17), end: new Date(2026, 4, 17) },
  'Post-Wedding': { start: new Date(2026, 4, 18), end: new Date(2026, 11, 31) },
};

// ============================================================================
// TIMEFRAME LOOKUP FUNCTIONS
// ============================================================================

/**
 * Find the timeframe ID that contains the given date.
 *
 * Strategy:
 * 1. First, check timeframes with date metadata (primary lookup)
 * 2. If no metadata match, fall back to LEGACY_TIMEFRAME_RANGES
 * 3. Return undefined if no match found
 */
export function findTimeframeForDate(
  date: Date | null,
  timeframes: Timeframe[]
): string | undefined {
  if (!date) return undefined;

  // Primary: Check timeframes with date metadata
  for (const tf of timeframes) {
    if (isDateInTimeframe(date, tf)) {
      return tf.id;
    }
  }

  // Fallback: Legacy name-based lookup
  for (const tf of timeframes) {
    const range = LEGACY_TIMEFRAME_RANGES[tf.name];
    if (range && isDateInRange(date, range.start, range.end)) {
      return tf.id;
    }
  }

  return undefined;
}

/**
 * Generate a monthly timeframe name for a date.
 * e.g., new Date(2026, 6, 15) => "Jul 2026"
 */
export function generateTimeframeName(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Calculate the appropriate order for a new timeframe based on its date.
 * Uses midpoint between neighbors to avoid order collisions.
 */
export function calculateTimeframeOrder(date: Date, timeframes: Timeframe[]): number {
  // Get all timeframes with date metadata (or legacy lookup), sorted by start date
  const timeframesWithDates = timeframes
    .map(tf => {
      // Prefer metadata, fall back to legacy
      let startDate: Date | undefined;
      if (tf.startDate) {
        startDate = parseISODate(tf.startDate);
      } else {
        const legacy = LEGACY_TIMEFRAME_RANGES[tf.name];
        startDate = legacy?.start;
      }
      return { tf, startDate };
    })
    .filter((item): item is { tf: Timeframe; startDate: Date } => item.startDate !== undefined)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  if (timeframesWithDates.length === 0) {
    // No dated timeframes exist, use max order + 1
    const maxOrder = Math.max(0, ...timeframes.map(tf => tf.order));
    return maxOrder + 1;
  }

  // Find insertion point
  let insertIndex = timeframesWithDates.length;
  for (let i = 0; i < timeframesWithDates.length; i++) {
    if (date < timeframesWithDates[i].startDate) {
      insertIndex = i;
      break;
    }
  }

  // Calculate order that fits between neighbors (midpoint to avoid collisions)
  if (insertIndex === 0) {
    // Before all existing timeframes
    const firstOrder = timeframesWithDates[0].tf.order;
    return firstOrder - 1;
  } else if (insertIndex === timeframesWithDates.length) {
    // After all existing timeframes
    const maxOrder = Math.max(0, ...timeframes.map(tf => tf.order));
    return maxOrder + 1;
  } else {
    // Between two timeframes - use midpoint
    const prevOrder = timeframesWithDates[insertIndex - 1].tf.order;
    const nextOrder = timeframesWithDates[insertIndex].tf.order;
    return (prevOrder + nextOrder) / 2;
  }
}

/**
 * Create a new timeframe for a date that doesn't match any existing timeframe.
 * Creates a monthly timeframe with proper date metadata.
 */
export function createTimeframeForDate(date: Date, timeframes: Timeframe[]): Timeframe {
  const name = generateTimeframeName(date);
  const order = calculateTimeframeOrder(date, timeframes);

  // Calculate month start/end dates
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    id: generateId(),
    name,
    order,
    startDate: toISODateString(new Date(year, month, 1)),
    endDate: toISODateString(new Date(year, month, lastDay)),
  };
}

// ============================================================================
// TIMEFRAME NAME PARSING (for auto-backfill on load)
// ============================================================================

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parse a month name to a month index (0-11).
 * Returns -1 if not recognized.
 */
function parseMonth(name: string): number {
  return MONTH_NAMES[name.toLowerCase()] ?? -1;
}

/**
 * Infer the year for a month name based on the wedding date.
 * Example: For a May 2026 wedding, months Jan-May are 2026, June-Dec are 2025.
 * Customize the logic below for your wedding date.
 */
function inferYear(monthName: string): number {
  const monthIndex = parseMonth(monthName);
  if (monthIndex === -1) return 2026; // default
  // Example: wedding in May - so May and earlier months are current year
  return monthIndex <= 4 ? 2026 : 2025;
}

/**
 * Parse common timeframe name patterns and return date range.
 * Returns null if the name is unparseable.
 *
 * Supported patterns:
 * - "Feb 15-21" or "Mar 1-7" (week ranges)
 * - "May 8" or "Fri May 8" (single days)
 * - "Jan 2026" or "December 2025" (full months)
 * - "June-Aug 2025" (multi-month ranges)
 */
export function parseTimeframeName(name: string): { start: Date; end: Date } | null {
  // Pattern: "Feb 15-21" or "Mar 1-7" (week range within a month)
  const weekPattern = /^([A-Za-z]+)\s+(\d+)-(\d+)$/;
  const weekMatch = name.match(weekPattern);
  if (weekMatch) {
    const [, monthStr, startDay, endDay] = weekMatch;
    const year = inferYear(monthStr);
    const monthIndex = parseMonth(monthStr);
    if (monthIndex !== -1) {
      return {
        start: new Date(year, monthIndex, parseInt(startDay)),
        end: new Date(year, monthIndex, parseInt(endDay)),
      };
    }
  }

  // Pattern: "May 8" or "Fri May 8" (single day)
  const dayPattern = /^(?:[A-Za-z]{3}\s+)?([A-Za-z]+)\s+(\d+)$/;
  const dayMatch = name.match(dayPattern);
  if (dayMatch) {
    const [, monthStr, day] = dayMatch;
    const year = inferYear(monthStr);
    const monthIndex = parseMonth(monthStr);
    if (monthIndex !== -1) {
      const date = new Date(year, monthIndex, parseInt(day));
      return { start: date, end: date };
    }
  }

  // Pattern: "Jan 2026" or "December 2025" (full month with explicit year)
  const monthYearPattern = /^([A-Za-z]+)\s+(\d{4})$/;
  const monthYearMatch = name.match(monthYearPattern);
  if (monthYearMatch) {
    const [, monthStr, yearStr] = monthYearMatch;
    const year = parseInt(yearStr);
    const monthIndex = parseMonth(monthStr);
    if (monthIndex !== -1) {
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      return {
        start: new Date(year, monthIndex, 1),
        end: new Date(year, monthIndex, lastDay),
      };
    }
  }

  // Pattern: "June-Aug 2025" or "Sept-Nov 2025" (multi-month range)
  const multiMonthPattern = /^([A-Za-z]+)-([A-Za-z]+)\s+(\d{4})$/;
  const multiMonthMatch = name.match(multiMonthPattern);
  if (multiMonthMatch) {
    const [, startMonthStr, endMonthStr, yearStr] = multiMonthMatch;
    const year = parseInt(yearStr);
    const startMonthIndex = parseMonth(startMonthStr);
    const endMonthIndex = parseMonth(endMonthStr);
    if (startMonthIndex !== -1 && endMonthIndex !== -1) {
      const lastDay = new Date(year, endMonthIndex + 1, 0).getDate();
      return {
        start: new Date(year, startMonthIndex, 1),
        end: new Date(year, endMonthIndex, lastDay),
      };
    }
  }

  return null;
}

/**
 * Attempt to backfill date metadata for timeframes with parseable names.
 * Returns a new array with metadata populated where possible.
 */
export function backfillTimeframeDates(timeframes: Timeframe[]): Timeframe[] {
  return timeframes.map(tf => {
    // Skip if already has metadata
    if (tf.startDate && tf.endDate) return tf;

    // Try to parse from legacy map first (more reliable)
    const legacy = LEGACY_TIMEFRAME_RANGES[tf.name];
    if (legacy) {
      return {
        ...tf,
        startDate: toISODateString(legacy.start),
        endDate: toISODateString(legacy.end),
      };
    }

    // Try to parse the name
    const parsed = parseTimeframeName(tf.name);
    if (parsed) {
      return {
        ...tf,
        startDate: toISODateString(parsed.start),
        endDate: toISODateString(parsed.end),
      };
    }

    // Can't parse - leave as-is
    return tf;
  });
}
