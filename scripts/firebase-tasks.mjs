#!/usr/bin/env node
/**
 * Wedding Planner Firebase CLI
 *
 * Direct Firebase access for task management, bypassing browser/sync issues.
 *
 * NOTE: The default timeframes in the 'init' command are examples.
 * Customize the dates for your own wedding timeline.
 *
 * Usage: node scripts/firebase-tasks.mjs <command> [args] [--dry-run]
 *
 * Commands:
 *   list                          List all tasks by category
 *   list-categories               List all categories
 *   list-timeframes               List all timeframes
 *   add-category "Name"           Create a new category
 *   add-tasks <file.json>         Import tasks from JSON file
 *   move-tasks "pattern" "Cat"    Move matching tasks to category
 *   delete-task <id|pattern>      Delete a task
 *   update-task <id> <field> <v>  Update a task field
 *   bulk-update <field> <v> "p"   Update field for matching tasks
 *   export [file.json]            Export board to JSON
 *   help                          Show this help message
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// ENVIRONMENT LOADING
// ============================================================================

/**
 * Load environment variables from a .env file
 * Handles quoted values and values containing =
 */
function loadEnv(path) {
  if (!existsSync(path)) {
    console.error(`Error: ${path} not found`);
    console.error('Make sure .env.local exists with Firebase credentials');
    process.exit(1);
  }

  const env = {};
  const content = readFileSync(path, 'utf-8');

  content.split('\n').forEach(line => {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) return;

    // Match KEY=VALUE, handling values with = in them
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes if present
      value = value.replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });

  return env;
}

// Try .env first (production credentials), fall back to .env.local
const envPath = existsSync(join(__dirname, '..', '.env'))
  ? join(__dirname, '..', '.env')
  : join(__dirname, '..', '.env.local');
const env = loadEnv(envPath);

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missing = requiredKeys.filter(k => !env[k]);
if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(k => console.error(`  - ${k}`));
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);

// ============================================================================
// HELPERS
// ============================================================================

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const VALID_STATUSES = ['not_started', 'in_progress', 'completed'];
const VALID_ASSIGNEES = ['unassigned', 'bride', 'groom', 'both', 'other'];
const VALID_PRIORITIES = ['normal', 'high'];

/**
 * Validate an enum field value
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateEnumField(field, value) {
  switch (field) {
    case 'status':
      if (!VALID_STATUSES.includes(value)) {
        return `Invalid status "${value}". Valid values: ${VALID_STATUSES.join(', ')}`;
      }
      break;
    case 'assignee':
      if (!VALID_ASSIGNEES.includes(value)) {
        return `Invalid assignee "${value}". Valid values: ${VALID_ASSIGNEES.join(', ')}`;
      }
      break;
    case 'priority':
      if (!VALID_PRIORITIES.includes(value)) {
        return `Invalid priority "${value}". Valid values: ${VALID_PRIORITIES.join(', ')}`;
      }
      break;
  }
  return null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a UUID v4 style ID
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Fetch the board from Firestore
 */
async function getBoard() {
  try {
    const snap = await getDoc(doc(db, 'boards', 'main'));
    if (!snap.exists()) {
      console.error('No board found in Firestore');
      console.error('Make sure the wedding planner app has been initialized');
      return null;
    }
    return snap.data();
  } catch (error) {
    console.error('Network error fetching board:', error.message);
    return null;
  }
}

/**
 * Save the board to Firestore
 */
async function saveBoard(board, dryRun = false) {
  board.updatedAt = new Date().toISOString();

  if (dryRun) {
    console.log(`[DRY RUN] Would save board with ${board.tasks.length} tasks`);
    return true;
  }

  try {
    await setDoc(doc(db, 'boards', 'main'), board);
    return true;
  } catch (error) {
    console.error('Network error saving board:', error.message);
    return false;
  }
}

/**
 * Find a category by name (case-insensitive partial match)
 */
function findCategory(board, name) {
  return board.categories.find(c =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Find a timeframe by name (case-insensitive partial match)
 */
function findTimeframe(board, name) {
  return board.timeframes.find(t =>
    t.name.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Resolve a file path (relative to cwd or absolute)
 */
function resolvePath(filePath) {
  if (isAbsolute(filePath)) {
    return filePath;
  }
  return join(process.cwd(), filePath);
}

// ============================================================================
// COMMANDS
// ============================================================================

const commands = {
  /**
   * List all tasks grouped by category
   */
  async list(args, options) {
    const board = await getBoard();
    if (!board) return;

    // Group tasks by category
    const byCategory = {};
    board.categories.forEach(c => {
      byCategory[c.id] = { name: c.name, order: c.order, tasks: [] };
    });

    board.tasks.forEach(t => {
      if (byCategory[t.categoryId]) {
        byCategory[t.categoryId].tasks.push(t);
      }
    });

    // Sort categories by order and display
    const sortedCategories = Object.values(byCategory).sort((a, b) => a.order - b.order);

    sortedCategories.forEach(({ name, tasks }) => {
      if (tasks.length === 0) return;

      console.log(`\n=== ${name} (${tasks.length}) ===`);
      tasks.forEach(t => {
        const tf = board.timeframes.find(x => x.id === t.timeframeId)?.name || '?';
        const statusIcon = {
          not_started: '\u25CB', // ○
          in_progress: '\u25D0', // ◐
          completed: '\u25CF'    // ●
        }[t.status] || '?';
        const priorityFlag = t.priority === 'high' ? ' [HIGH]' : '';
        console.log(`  ${statusIcon} [${tf}] ${t.title}${priorityFlag}`);
      });
    });

    console.log(`\nTotal: ${board.tasks.length} tasks`);
  },

  /**
   * List all categories with task counts
   */
  async 'list-categories'(args, options) {
    const board = await getBoard();
    if (!board) return;

    console.log('\nCategories:');
    board.categories
      .sort((a, b) => a.order - b.order)
      .forEach(c => {
        const count = board.tasks.filter(t => t.categoryId === c.id).length;
        console.log(`  ${c.name} (${count} tasks)`);
      });
  },

  /**
   * List all timeframes with task counts
   */
  async 'list-timeframes'(args, options) {
    const board = await getBoard();
    if (!board) return;

    console.log('\nTimeframes:');
    board.timeframes
      .sort((a, b) => a.order - b.order)
      .forEach(t => {
        const count = board.tasks.filter(x => x.timeframeId === t.id).length;
        const hidden = t.hidden ? ' (hidden)' : '';
        console.log(`  ${t.name} (${count} tasks)${hidden}`);
      });
  },

  /**
   * Create a new category
   */
  async 'add-category'(args, options) {
    const name = args[0];
    if (!name) {
      console.error('Usage: add-category "Category Name"');
      return;
    }

    const board = await getBoard();
    if (!board) return;

    // Check if category already exists
    const existing = findCategory(board, name);
    if (existing && existing.name.toLowerCase() === name.toLowerCase()) {
      console.error(`Category "${name}" already exists`);
      return;
    }

    const maxOrder = Math.max(0, ...board.categories.map(c => c.order));
    const newCategory = {
      id: generateId(),
      name: name,
      order: maxOrder + 1
    };

    board.categories.push(newCategory);

    if (await saveBoard(board, options.dryRun)) {
      console.log(`${options.dryRun ? '[DRY RUN] Would create' : 'Created'} category: ${name}`);
    }
  },

  /**
   * Import tasks from a JSON file
   */
  async 'add-tasks'(args, options) {
    const file = args[0];
    if (!file) {
      console.error('Usage: add-tasks <file.json>');
      return;
    }

    const filePath = resolvePath(file);
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }

    // Parse JSON
    let taskDefs;
    try {
      const content = readFileSync(filePath, 'utf-8');
      taskDefs = JSON.parse(content);

      if (!Array.isArray(taskDefs)) {
        console.error('JSON must be an array of task objects');
        return;
      }
    } catch (e) {
      console.error('Invalid JSON:', e.message);
      return;
    }

    const board = await getBoard();
    if (!board) return;

    const now = new Date().toISOString();
    const newTasks = [];
    const errors = [];

    taskDefs.forEach((def, i) => {
      // Validate required fields
      if (!def.title) {
        errors.push(`Task ${i}: missing title`);
        return;
      }
      if (!def.category) {
        errors.push(`Task ${i}: missing category`);
        return;
      }
      if (!def.timeframe) {
        errors.push(`Task ${i}: missing timeframe`);
        return;
      }

      // Find category and timeframe
      const cat = findCategory(board, def.category);
      const tf = findTimeframe(board, def.timeframe);

      if (!cat) {
        errors.push(`Task ${i} "${def.title}": category "${def.category}" not found`);
        return;
      }
      if (!tf) {
        errors.push(`Task ${i} "${def.title}": timeframe "${def.timeframe}" not found`);
        return;
      }

      // Validate enum values (use module-level constants)
      const status = VALID_STATUSES.includes(def.status) ? def.status : 'not_started';
      const assignee = VALID_ASSIGNEES.includes(def.assignee) ? def.assignee : 'unassigned';
      const priority = VALID_PRIORITIES.includes(def.priority) ? def.priority : 'normal';

      // Build task object
      newTasks.push({
        id: generateId(),
        title: def.title,
        notes: def.notes || '',
        status,
        assignee,
        priority,
        categoryId: cat.id,
        timeframeId: tf.id,
        dueDate: def.dueDate || null,
        checklist: (def.checklist || []).map(item => ({
          id: generateId(),
          title: typeof item === 'string' ? item : item.title,
          completed: typeof item === 'string' ? false : (item.completed || false)
        })),
        createdAt: now,
        updatedAt: now
      });
    });

    // Report validation errors
    if (errors.length > 0) {
      console.error('Validation errors:');
      errors.forEach(e => console.error(`  - ${e}`));

      if (newTasks.length === 0) {
        console.error('\nNo valid tasks to add.');
        return;
      }
      console.log(`\nProceeding with ${newTasks.length} valid tasks...`);
    }

    // Add tasks and save
    board.tasks.push(...newTasks);

    if (await saveBoard(board, options.dryRun)) {
      console.log(`${options.dryRun ? '[DRY RUN] Would add' : 'Added'} ${newTasks.length} tasks`);
      newTasks.forEach(t => console.log(`  + ${t.title}`));
    }
  },

  /**
   * Move tasks matching a pattern to a different category
   */
  async 'move-tasks'(args, options) {
    const [pattern, categoryName] = args;
    if (!pattern || !categoryName) {
      console.error('Usage: move-tasks "pattern" "Category Name"');
      return;
    }

    const board = await getBoard();
    if (!board) return;

    // Find target category
    const cat = findCategory(board, categoryName);
    if (!cat) {
      console.error(`Category "${categoryName}" not found`);
      console.error('Available categories:');
      board.categories.forEach(c => console.error(`  - ${c.name}`));
      return;
    }

    // Find matching tasks
    const regex = new RegExp(pattern, 'i');
    const matches = board.tasks.filter(t => regex.test(t.title));

    if (matches.length === 0) {
      console.log(`No tasks match pattern "${pattern}"`);
      return;
    }

    console.log(`Found ${matches.length} tasks matching "${pattern}":`);
    matches.forEach(t => {
      const currentCat = board.categories.find(c => c.id === t.categoryId)?.name || '?';
      console.log(`  - ${t.title} (currently in "${currentCat}")`);
    });

    // Update tasks
    const now = new Date().toISOString();
    matches.forEach(t => {
      t.categoryId = cat.id;
      t.updatedAt = now;
    });

    if (await saveBoard(board, options.dryRun)) {
      console.log(`\n${options.dryRun ? '[DRY RUN] Would move' : 'Moved'} ${matches.length} tasks to "${cat.name}"`);
    }
  },

  /**
   * Delete a task by ID or title pattern
   */
  async 'delete-task'(args, options) {
    const pattern = args[0];
    if (!pattern) {
      console.error('Usage: delete-task <id|pattern>');
      return;
    }

    const board = await getBoard();
    if (!board) return;

    // Find task by ID or title
    const idx = board.tasks.findIndex(t =>
      t.id === pattern || t.title.toLowerCase().includes(pattern.toLowerCase())
    );

    if (idx === -1) {
      console.error(`No task found matching "${pattern}"`);
      return;
    }

    const task = board.tasks[idx];
    console.log(`Deleting: ${task.title}`);

    board.tasks.splice(idx, 1);

    if (await saveBoard(board, options.dryRun)) {
      console.log(`${options.dryRun ? '[DRY RUN] Would delete' : 'Deleted'} task`);
    }
  },

  /**
   * Update a specific field on a task
   */
  async 'update-task'(args, options) {
    const [pattern, field, ...valueParts] = args;
    const value = valueParts.join(' ');

    if (!pattern || !field || !value) {
      console.error('Usage: update-task <id|pattern> <field> <value>');
      console.error('Fields: title, notes, status, assignee, priority, timeframe, category');
      return;
    }

    const board = await getBoard();
    if (!board) return;

    // Find task
    const task = board.tasks.find(t =>
      t.id === pattern || t.title.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!task) {
      console.error(`No task found matching "${pattern}"`);
      return;
    }

    // Update the appropriate field
    const stringFields = ['title', 'notes', 'dueDate'];
    const enumFields = ['status', 'assignee', 'priority'];

    if (stringFields.includes(field)) {
      task[field] = value;
    } else if (enumFields.includes(field)) {
      const error = validateEnumField(field, value);
      if (error) {
        console.error(error);
        return;
      }
      task[field] = value;
    } else if (field === 'timeframe') {
      const tf = findTimeframe(board, value);
      if (!tf) {
        console.error(`Timeframe "${value}" not found`);
        return;
      }
      task.timeframeId = tf.id;
    } else if (field === 'category') {
      const cat = findCategory(board, value);
      if (!cat) {
        console.error(`Category "${value}" not found`);
        return;
      }
      task.categoryId = cat.id;
    } else {
      console.error(`Unknown field: ${field}`);
      console.error('Valid fields: title, notes, status, assignee, priority, timeframe, category');
      return;
    }

    task.updatedAt = new Date().toISOString();

    if (await saveBoard(board, options.dryRun)) {
      console.log(`${options.dryRun ? '[DRY RUN] Would update' : 'Updated'} "${task.title}": ${field} = ${value}`);
    }
  },

  /**
   * Bulk update a field for all tasks matching a pattern
   */
  async 'bulk-update'(args, options) {
    const [field, value, pattern] = args;

    if (!field || !value || !pattern) {
      console.error('Usage: bulk-update <field> <value> "pattern"');
      console.error('Example: bulk-update status completed "flower"');
      return;
    }

    const board = await getBoard();
    if (!board) return;

    // Find matching tasks
    const regex = new RegExp(pattern, 'i');
    const matches = board.tasks.filter(t => regex.test(t.title));

    if (matches.length === 0) {
      console.log(`No tasks match pattern "${pattern}"`);
      return;
    }

    console.log(`Found ${matches.length} tasks matching "${pattern}":`);
    matches.forEach(t => console.log(`  - ${t.title}`));

    // Validate enum fields before bulk update
    const enumFields = ['status', 'assignee', 'priority'];
    if (enumFields.includes(field)) {
      const error = validateEnumField(field, value);
      if (error) {
        console.error(error);
        return;
      }
    }

    // Update tasks
    const now = new Date().toISOString();
    matches.forEach(t => {
      t[field] = value;
      t.updatedAt = now;
    });

    if (await saveBoard(board, options.dryRun)) {
      console.log(`\n${options.dryRun ? '[DRY RUN] Would update' : 'Updated'} ${matches.length} tasks: ${field} = ${value}`);
    }
  },

  /**
   * Export the entire board to a JSON file
   */
  async 'export'(args, options) {
    const file = args[0] || 'board-export.json';

    const board = await getBoard();
    if (!board) return;

    const filePath = resolvePath(file);
    writeFileSync(filePath, JSON.stringify(board, null, 2));

    console.log(`Exported board to ${filePath}`);
    console.log(`  ${board.categories.length} categories`);
    console.log(`  ${board.timeframes.length} timeframes`);
    console.log(`  ${board.tasks.length} tasks`);
  },

  /**
   * Initialize a new board with default categories and timeframes
   */
  async 'init'(args, options) {
    // Check if board already exists
    const existingBoard = await getBoard();
    if (existingBoard) {
      console.error('Board already exists!');
      console.log(`  ${existingBoard.categories.length} categories`);
      console.log(`  ${existingBoard.timeframes.length} timeframes`);
      console.log(`  ${existingBoard.tasks.length} tasks`);
      console.log('\nUse other commands to modify the existing board.');
      return;
    }

    console.log('Creating new board...');

    const now = new Date().toISOString();

    // Default timeframes (with date metadata for auto-sync)
    const timeframes = [
      { id: generateId(), name: 'June-Aug 2025', order: 0, startDate: '2025-06-01', endDate: '2025-08-31' },
      { id: generateId(), name: 'Sept-Nov 2025', order: 1, startDate: '2025-09-01', endDate: '2025-11-30' },
      { id: generateId(), name: 'Dec 2025', order: 2, startDate: '2025-12-01', endDate: '2025-12-31' },
      { id: generateId(), name: 'Jan 2026', order: 3, startDate: '2026-01-01', endDate: '2026-01-31' },
      { id: generateId(), name: 'Feb 1-7', order: 4, startDate: '2026-02-01', endDate: '2026-02-07' },
      { id: generateId(), name: 'Feb 8-14', order: 5, startDate: '2026-02-08', endDate: '2026-02-14' },
      { id: generateId(), name: 'Feb 15-21', order: 6, startDate: '2026-02-15', endDate: '2026-02-21' },
      { id: generateId(), name: 'Feb 22-28', order: 7, startDate: '2026-02-22', endDate: '2026-02-28' },
      { id: generateId(), name: 'Mar 1-7', order: 8, startDate: '2026-03-01', endDate: '2026-03-07' },
      { id: generateId(), name: 'Mar 8-14', order: 9, startDate: '2026-03-08', endDate: '2026-03-14' },
      { id: generateId(), name: 'Mar 15-21', order: 10, startDate: '2026-03-15', endDate: '2026-03-21' },
      { id: generateId(), name: 'Mar 22-31', order: 11, startDate: '2026-03-22', endDate: '2026-03-31' },
      { id: generateId(), name: 'Apr 1-15', order: 12, startDate: '2026-04-01', endDate: '2026-04-15' },
      { id: generateId(), name: 'Apr 16-30', order: 13, startDate: '2026-04-16', endDate: '2026-04-30' },
      { id: generateId(), name: 'May 1-7', order: 14, startDate: '2026-05-01', endDate: '2026-05-07' },
      { id: generateId(), name: 'May 8', order: 15, startDate: '2026-05-08', endDate: '2026-05-08' },
      { id: generateId(), name: 'May 9', order: 16, startDate: '2026-05-09', endDate: '2026-05-09' },
      { id: generateId(), name: 'May 10', order: 17, startDate: '2026-05-10', endDate: '2026-05-10' },
      { id: generateId(), name: 'May 11', order: 18, startDate: '2026-05-11', endDate: '2026-05-11' },
      { id: generateId(), name: 'May 12', order: 19, startDate: '2026-05-12', endDate: '2026-05-12' },
      { id: generateId(), name: 'May 13', order: 20, startDate: '2026-05-13', endDate: '2026-05-13' },
      { id: generateId(), name: 'May 14', order: 21, startDate: '2026-05-14', endDate: '2026-05-14' },
      { id: generateId(), name: 'May 15', order: 22, startDate: '2026-05-15', endDate: '2026-05-15' },
      { id: generateId(), name: 'May 16', order: 23, startDate: '2026-05-16', endDate: '2026-05-16' },
      { id: generateId(), name: 'May 17', order: 24, startDate: '2026-05-17', endDate: '2026-05-17' },
      { id: generateId(), name: 'Post-Wedding', order: 25, startDate: '2026-05-18', endDate: '2026-12-31' },
    ];

    // Default categories
    const categories = [
      { id: generateId(), name: 'Venue', order: 0 },
      { id: generateId(), name: 'Food & Drink', order: 1 },
      { id: generateId(), name: 'Invitations & Postal', order: 2 },
      { id: generateId(), name: 'Housing & Room Assignments', order: 3 },
      { id: generateId(), name: 'Website', order: 4 },
      { id: generateId(), name: 'Outfits & Accessories', order: 5 },
      { id: generateId(), name: 'Wedding Party', order: 6 },
      { id: generateId(), name: 'Close Family', order: 7 },
      { id: generateId(), name: 'Welcome Dinner', order: 8 },
      { id: generateId(), name: 'Ceremony', order: 9 },
      { id: generateId(), name: 'Reception', order: 10 },
      { id: generateId(), name: 'Hair & Makeup', order: 11 },
      { id: generateId(), name: 'Photography', order: 12 },
      { id: generateId(), name: 'Entertainment', order: 13 },
      { id: generateId(), name: 'Decorations & Signage', order: 14 },
      { id: generateId(), name: 'Transportation', order: 15 },
      { id: generateId(), name: 'Travel & Shipping', order: 16 },
      { id: generateId(), name: 'Other / Admin', order: 17 },
    ];

    const board = {
      id: 'main',
      name: 'Wedding Planning',
      categories,
      timeframes,
      tasks: [],
      createdAt: now,
      updatedAt: now
    };

    if (options.dryRun) {
      console.log('[DRY RUN] Would create board with:');
      console.log(`  ${categories.length} categories`);
      console.log(`  ${timeframes.length} timeframes`);
      return;
    }

    try {
      await setDoc(doc(db, 'boards', 'main'), board);
      console.log('Board created successfully!');
      console.log(`  ${categories.length} categories`);
      console.log(`  ${timeframes.length} timeframes`);
      console.log('\nYou can now add tasks with: node firebase-tasks.mjs add-tasks <file.json>');
    } catch (error) {
      console.error('Failed to create board:', error.message);
    }
  },

  /**
   * Migrate timeframes to include date metadata (for auto-sync feature)
   */
  async 'migrate-dates'(args, options) {
    const board = await getBoard();
    if (!board) return;

    // Timeframe name -> date range mapping (same as LEGACY_TIMEFRAME_RANGES in timeframeUtils.ts)
    const TIMEFRAME_DATES = {
      'June-Aug 2025': { start: '2025-06-01', end: '2025-08-31' },
      'Sept-Nov 2025': { start: '2025-09-01', end: '2025-11-30' },
      'Dec 2025': { start: '2025-12-01', end: '2025-12-31' },
      'Jan 2026': { start: '2026-01-01', end: '2026-01-31' },
      'Feb 1-7': { start: '2026-02-01', end: '2026-02-07' },
      'Feb 8-14': { start: '2026-02-08', end: '2026-02-14' },
      'Feb 15-21': { start: '2026-02-15', end: '2026-02-21' },
      'Feb 22-28': { start: '2026-02-22', end: '2026-02-28' },
      'Mar 1-7': { start: '2026-03-01', end: '2026-03-07' },
      'Mar 8-14': { start: '2026-03-08', end: '2026-03-14' },
      'Mar 15-21': { start: '2026-03-15', end: '2026-03-21' },
      'Mar 22-31': { start: '2026-03-22', end: '2026-03-31' },
      'Apr 1-15': { start: '2026-04-01', end: '2026-04-15' },
      'Apr 16-30': { start: '2026-04-16', end: '2026-04-30' },
      'May 1-7': { start: '2026-05-01', end: '2026-05-07' },
      'May 8': { start: '2026-05-08', end: '2026-05-08' },
      'May 9': { start: '2026-05-09', end: '2026-05-09' },
      'May 10': { start: '2026-05-10', end: '2026-05-10' },
      'May 11': { start: '2026-05-11', end: '2026-05-11' },
      'May 12': { start: '2026-05-12', end: '2026-05-12' },
      'May 13': { start: '2026-05-13', end: '2026-05-13' },
      'May 14': { start: '2026-05-14', end: '2026-05-14' },
      'May 15': { start: '2026-05-15', end: '2026-05-15' },
      'May 16': { start: '2026-05-16', end: '2026-05-16' },
      'May 17': { start: '2026-05-17', end: '2026-05-17' },
      'Fri May 8': { start: '2026-05-08', end: '2026-05-08' },
      'Sat May 9': { start: '2026-05-09', end: '2026-05-09' },
      'Sun May 10': { start: '2026-05-10', end: '2026-05-10' },
      'Mon May 11': { start: '2026-05-11', end: '2026-05-11' },
      'Tue May 12': { start: '2026-05-12', end: '2026-05-12' },
      'Wed May 13': { start: '2026-05-13', end: '2026-05-13' },
      'Thu May 14': { start: '2026-05-14', end: '2026-05-14' },
      'Fri May 15': { start: '2026-05-15', end: '2026-05-15' },
      'Sat May 16': { start: '2026-05-16', end: '2026-05-16' },
      'Sun May 17': { start: '2026-05-17', end: '2026-05-17' },
      'Post-Wedding': { start: '2026-05-18', end: '2026-12-31' },
    };

    let updated = 0;
    let skipped = 0;
    const warnings = [];

    const updatedTimeframes = board.timeframes.map(tf => {
      // Skip if already has metadata
      if (tf.startDate && tf.endDate) {
        skipped++;
        return tf;
      }

      const dates = TIMEFRAME_DATES[tf.name];
      if (dates) {
        updated++;
        return {
          ...tf,
          startDate: dates.start,
          endDate: dates.end,
        };
      }

      warnings.push(`Could not find dates for "${tf.name}"`);
      return tf;
    });

    console.log(`\nTimeframe migration:`);
    console.log(`  Already migrated: ${skipped}`);
    console.log(`  To be updated: ${updated}`);
    if (warnings.length > 0) {
      console.log(`\nWarnings:`);
      warnings.forEach(w => console.log(`  - ${w}`));
    }

    if (updated === 0) {
      console.log('\nAll timeframes already have date metadata. Nothing to do.');
      return;
    }

    board.timeframes = updatedTimeframes;

    if (await saveBoard(board, options.dryRun)) {
      console.log(`\n${options.dryRun ? '[DRY RUN] Would update' : 'Updated'} ${updated} timeframes with date metadata.`);
    }
  },

  /**
   * Show help message
   */
  async help() {
    console.log(`
Wedding Planner Firebase CLI

COMMANDS:
  list                          List all tasks by category
  list-categories               List all categories
  list-timeframes               List all timeframes
  add-category "Name"           Create a new category
  add-tasks <file.json>         Import tasks from JSON file
  move-tasks "pattern" "Cat"    Move matching tasks to category
  delete-task <id|pattern>      Delete a task
  update-task <id> <field> <v>  Update a task field
  bulk-update <field> <v> "p"   Update field for matching tasks
  export [file.json]            Export board to JSON
  init                          Initialize a new board (if none exists)
  migrate-dates                 Add date metadata to existing timeframes
  help                          Show this help message

OPTIONS:
  --dry-run                     Preview changes without saving

TASK JSON FORMAT:
  [
    {
      "title": "Task name",
      "category": "Category Name",
      "timeframe": "Feb 15-21",
      "notes": "Optional details",
      "assignee": "both",
      "priority": "normal",
      "checklist": ["Step 1", "Step 2"]
    }
  ]

EXAMPLES:
  node firebase-tasks.mjs list
  node firebase-tasks.mjs list-categories
  node firebase-tasks.mjs add-category "Flowers" --dry-run
  node firebase-tasks.mjs add-tasks tasks.json
  node firebase-tasks.mjs move-tasks "flower" "Flowers"
  node firebase-tasks.mjs update-task "vows" status in_progress
  node firebase-tasks.mjs bulk-update status completed "research"
  node firebase-tasks.mjs export backup.json
    `);
  }
};

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run')
};

// Filter out option flags
const filteredArgs = args.filter(a => !a.startsWith('--'));
const command = filteredArgs[0] || 'help';
const commandArgs = filteredArgs.slice(1);

if (commands[command]) {
  commands[command](commandArgs, options)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Unexpected error:', err.message);
      process.exit(1);
    });
} else {
  console.error(`Unknown command: ${command}`);
  commands.help();
  process.exit(1);
}
