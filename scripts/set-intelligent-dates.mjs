#!/usr/bin/env node
/**
 * Set intelligent due dates for tasks based on timeframe, priority, and task type.
 *
 * Key features:
 * - Spreads tasks across the timeframe (not all on midpoint)
 * - HIGH priority tasks with known deadlines get exact dates
 * - "Research" tasks get earlier dates, "Finalize" tasks get later dates
 * - Evenly distributes workload across days
 *
 * Usage: node scripts/set-intelligent-dates.mjs [--dry-run]
 *
 * NOTE: The HARD_DEADLINES and TIMEFRAME_RANGES below are EXAMPLES.
 * Customize them for your own wedding dates and deadlines.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run');

// =============================================================================
// HARD DEADLINE OVERRIDES
// Tasks matching these patterns get specific dates regardless of timeframe.
// CUSTOMIZE THESE for your wedding! Add patterns that match your task titles.
// =============================================================================
const HARD_DEADLINES = [
  // Example patterns - customize with your dates and task names:
  // { pattern: /90.?day payment/i, date: new Date(2026, 1, 16) }, // Feb 16
  // { pattern: /rsvp deadline/i, date: new Date(2026, 2, 1) }, // Mar 1
  // { pattern: /hair.*makeup.*confirm/i, date: new Date(2026, 1, 28) }, // Feb 28
  // { pattern: /send lodging assignment/i, date: new Date(2026, 2, 15) }, // Mar 15
  // { pattern: /venue detail meeting/i, date: new Date(2026, 2, 15) }, // Mar 15
  // { pattern: /final guest count/i, date: new Date(2026, 4, 1) }, // May 1
  // { pattern: /final payment/i, date: new Date(2026, 4, 6) }, // May 6
  // { pattern: /ship wedding dress/i, date: new Date(2026, 4, 3) }, // Before travel
  // { pattern: /pick up.*flowers/i, date: new Date(2026, 4, 14) }, // Before wedding
];

// =============================================================================
// TIMEFRAME DATE RANGES
// CUSTOMIZE THESE to match your wedding timeline and timeframe names.
// The keys must match your timeframe names exactly.
// =============================================================================
const TIMEFRAME_RANGES = {
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
  'Post-Wedding': { start: new Date(2026, 4, 25), end: new Date(2026, 5, 15) },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function loadEnv(path) {
  if (!existsSync(path)) {
    console.error(`Error: ${path} not found`);
    process.exit(1);
  }
  const env = {};
  readFileSync(path, 'utf-8').split('\n').forEach(line => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  return env;
}

/**
 * Determine task type for ordering within timeframe
 * Returns: 0 (early), 1 (middle), 2 (late)
 */
function getTaskOrder(task) {
  const title = task.title.toLowerCase();

  // Early in timeframe: research, plan, think, monitor, identify, outline, draft
  if (/research|plan|think|monitor|identify|outline|draft\s*1|initial/.test(title)) {
    return 0;
  }

  // Late in timeframe: finalize, confirm, send, submit, book, order, execute, purchase
  if (/finalize|confirm|send|submit|book|order|execute|purchase|pick up|deadline/.test(title)) {
    return 2;
  }

  // HIGH priority without specific deadline patterns get middle priority
  if (task.priority === 'high') {
    return 1;
  }

  // Default to middle
  return 1;
}

/**
 * Check if task has a hard deadline override
 */
function getHardDeadline(task) {
  for (const { pattern, date } of HARD_DEADLINES) {
    if (pattern.test(task.title)) {
      return date;
    }
  }
  return null;
}

/**
 * Get date range for a timeframe name
 */
function getTimeframeRange(timeframeName) {
  return TIMEFRAME_RANGES[timeframeName] || null;
}

/**
 * Distribute tasks evenly across a date range
 */
function distributeTasks(tasks, startDate, endDate) {
  if (tasks.length === 0) return [];

  // Sort tasks by order (early, middle, late)
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  // Calculate days in range
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endDate - startDate) / msPerDay) + 1);

  // If single day, all tasks get that date
  if (totalDays === 1) {
    return sortedTasks.map(t => ({ ...t, assignedDate: new Date(startDate) }));
  }

  // Distribute tasks across days
  return sortedTasks.map((task, index) => {
    const fraction = index / (sortedTasks.length - 1 || 1);
    const dayOffset = Math.round(fraction * (totalDays - 1));
    const assignedDate = new Date(startDate.getTime() + dayOffset * msPerDay);
    return { ...task, assignedDate };
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(isDryRun ? '=== DRY RUN ===' : '=== Setting Intelligent Due Dates ===\n');

  // Load environment
  const envPath = join(__dirname, '..', '.env.local');
  const env = loadEnv(envPath);

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });

  const db = getFirestore(app);

  // Get board data
  const boardRef = doc(db, 'boards', 'main');
  const snap = await getDoc(boardRef);

  if (!snap.exists()) {
    console.error('Board not found');
    process.exit(1);
  }

  const board = snap.data();

  // Build timeframe ID -> name map
  const timeframeMap = new Map();
  for (const tf of board.timeframes) {
    timeframeMap.set(tf.id, tf.name);
  }

  // Group tasks by timeframe
  const tasksByTimeframe = new Map();
  const hardDeadlineTasks = [];
  const skippedTasks = [];

  for (const task of board.tasks) {
    // Skip completed tasks in past timeframes
    const tfName = timeframeMap.get(task.timeframeId);
    if (!tfName) {
      skippedTasks.push({ task, reason: 'Unknown timeframe' });
      continue;
    }

    // Check for hard deadline
    const hardDeadline = getHardDeadline(task);
    if (hardDeadline) {
      hardDeadlineTasks.push({ task, date: hardDeadline });
      continue;
    }

    // Group by timeframe for distribution
    if (!tasksByTimeframe.has(task.timeframeId)) {
      tasksByTimeframe.set(task.timeframeId, []);
    }
    tasksByTimeframe.get(task.timeframeId).push({
      ...task,
      order: getTaskOrder(task),
    });
  }

  // Process tasks and assign dates
  const taskUpdates = new Map(); // task.id -> new dueDate

  // 1. Hard deadline tasks
  console.log('=== HARD DEADLINE TASKS ===');
  for (const { task, date } of hardDeadlineTasks) {
    console.log(`  ${formatDate(date)} - ${task.title}`);
    taskUpdates.set(task.id, date);
  }
  console.log(`  (${hardDeadlineTasks.length} tasks)\n`);

  // 2. Timeframe-based distribution
  console.log('=== TIMEFRAME DISTRIBUTION ===');
  for (const [tfId, tasks] of tasksByTimeframe) {
    const tfName = timeframeMap.get(tfId);
    const range = getTimeframeRange(tfName);

    if (!range) {
      console.log(`  ${tfName}: Could not parse date range, skipping ${tasks.length} tasks`);
      for (const task of tasks) {
        skippedTasks.push({ task, reason: `No date range for ${tfName}` });
      }
      continue;
    }

    const distributed = distributeTasks(tasks, range.start, range.end);

    console.log(`\n  ${tfName} (${tasks.length} tasks):`);
    for (const task of distributed) {
      console.log(`    ${formatDate(task.assignedDate)} - ${task.title}${task.priority === 'high' ? ' [HIGH]' : ''}`);
      taskUpdates.set(task.id, task.assignedDate);
    }
  }

  // 3. Skipped tasks
  if (skippedTasks.length > 0) {
    console.log(`\n=== SKIPPED TASKS (${skippedTasks.length}) ===`);
    for (const { task, reason } of skippedTasks) {
      console.log(`  ${task.title} - ${reason}`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`  Total tasks: ${board.tasks.length}`);
  console.log(`  Tasks updated: ${taskUpdates.size}`);
  console.log(`  Tasks skipped: ${skippedTasks.length}`);
  console.log(`  Hard deadlines: ${hardDeadlineTasks.length}`);

  // Apply updates
  if (!isDryRun && taskUpdates.size > 0) {
    const updatedTasks = board.tasks.map(task => {
      const newDate = taskUpdates.get(task.id);
      if (newDate) {
        return { ...task, dueDate: newDate };
      }
      return task;
    });

    await setDoc(boardRef, {
      ...board,
      tasks: updatedTasks,
      updatedAt: new Date(),
    });
    console.log('\n✓ Board updated successfully');
  } else if (isDryRun) {
    console.log('\n(Dry run - no changes made)');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
