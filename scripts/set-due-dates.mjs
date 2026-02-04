#!/usr/bin/env node
/**
 * Set due dates for tasks based on their timeframe names.
 *
 * NOTE: The date parsing logic uses example patterns. Customize the
 * parseTimeframeToDate() function for your specific timeframe names.
 *
 * Usage: node scripts/set-due-dates.mjs [--dry-run]
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run');

// Load environment
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

// Use .env.local to match Vite dev server (not .env which may have different project)
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

/**
 * Parse a timeframe name into a due date.
 * Examples:
 *   "Jan 2026" -> Jan 15, 2026
 *   "Feb 1-7" -> Feb 4, 2026
 *   "Mar 22-31" -> Mar 27, 2026
 *   "Fri May 8" -> May 8, 2026
 *   "June-Aug 2025" -> Jul 15, 2025
 */
function parseTimeframeToDate(name) {
  // Specific day pattern: "Fri May 8", "Sat May 9", etc.
  const specificDayMatch = name.match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\w+)\s+(\d+)$/i);
  if (specificDayMatch) {
    const month = getMonthNumber(specificDayMatch[1]);
    const day = parseInt(specificDayMatch[2]);
    return new Date(2026, month, day);
  }

  // Date range pattern: "Feb 1-7", "Mar 22-31", "Apr 1-15"
  const rangeMatch = name.match(/^(\w+)\s+(\d+)-(\d+)$/i);
  if (rangeMatch) {
    const month = getMonthNumber(rangeMatch[1]);
    const startDay = parseInt(rangeMatch[2]);
    const endDay = parseInt(rangeMatch[3]);
    const midDay = Math.floor((startDay + endDay) / 2);
    return new Date(2026, month, midDay);
  }

  // Month-year pattern: "Jan 2026", "Dec 2025"
  const monthYearMatch = name.match(/^(\w+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const month = getMonthNumber(monthYearMatch[1]);
    const year = parseInt(monthYearMatch[2]);
    return new Date(year, month, 15); // Middle of the month
  }

  // Multi-month range: "June-Aug 2025", "Sept-Nov 2025"
  const multiMonthMatch = name.match(/^(\w+)-(\w+)\s+(\d{4})$/i);
  if (multiMonthMatch) {
    const startMonth = getMonthNumber(multiMonthMatch[1]);
    const endMonth = getMonthNumber(multiMonthMatch[2]);
    const year = parseInt(multiMonthMatch[3]);
    const midMonth = Math.floor((startMonth + endMonth) / 2);
    return new Date(year, midMonth, 15);
  }

  // Post-wedding pattern: "Post-Wedding"
  if (name.toLowerCase().includes('post-wedding') || name.toLowerCase().includes('post wedding')) {
    return new Date(2026, 5, 1); // June 1, 2026
  }

  // Honeymoon
  if (name.toLowerCase().includes('honeymoon')) {
    return new Date(2026, 5, 15); // June 15, 2026
  }

  return null; // Unknown format
}

function getMonthNumber(monthStr) {
  const months = {
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
  return months[monthStr.toLowerCase()] ?? 0;
}

async function main() {
  console.log(isDryRun ? '=== DRY RUN ===' : '=== Setting Due Dates ===');

  // Get board data
  const boardRef = doc(db, 'boards', 'main');
  const snap = await getDoc(boardRef);

  if (!snap.exists()) {
    console.error('Board not found');
    process.exit(1);
  }

  const board = snap.data();

  // Build timeframe ID -> date map
  const timeframeDates = new Map();
  for (const tf of board.timeframes) {
    const date = parseTimeframeToDate(tf.name);
    if (date) {
      timeframeDates.set(tf.id, date);
      console.log(`  ${tf.name} -> ${date.toLocaleDateString()}`);
    } else {
      console.log(`  ${tf.name} -> (could not parse)`);
    }
  }

  // Update tasks
  let updated = 0;
  let skipped = 0;

  const updatedTasks = board.tasks.map(task => {
    // Skip tasks that already have a due date
    if (task.dueDate !== null) {
      skipped++;
      return task;
    }

    const date = timeframeDates.get(task.timeframeId);
    if (date) {
      updated++;
      return {
        ...task,
        dueDate: date,
      };
    }

    return task;
  });

  console.log(`\nResults:`);
  console.log(`  ${updated} tasks will get due dates`);
  console.log(`  ${skipped} tasks already have due dates`);
  console.log(`  ${board.tasks.length - updated - skipped} tasks have unknown timeframes`);

  if (!isDryRun && updated > 0) {
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
