/**
 * Bulk Task Loader for Wedding Planner
 *
 * USAGE:
 * 1. Open https://wedding-planner-lake.vercel.app in Chrome
 * 2. Open DevTools (F12) → Console tab
 * 3. Copy and paste this entire script
 * 4. Call: addTasks(vowTasks)  -- or your own task array
 * 5. Page will reload and tasks will sync to Firebase
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the current board from localStorage
 */
function getBoard() {
  const stored = localStorage.getItem('wedding-planner-board');
  if (!stored) {
    console.error('No board found in localStorage. Make sure you are on the wedding planner app.');
    return null;
  }
  return JSON.parse(stored);
}

/**
 * Find a category ID by name (case-insensitive partial match)
 */
function findCategoryId(board, name) {
  const category = board.categories.find(c =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );
  if (!category) {
    console.error(`Category not found: "${name}". Available: ${board.categories.map(c => c.name).join(', ')}`);
    return null;
  }
  return category.id;
}

/**
 * Find a timeframe ID by name (case-insensitive partial match)
 */
function findTimeframeId(board, name) {
  const timeframe = board.timeframes.find(t =>
    t.name.toLowerCase().includes(name.toLowerCase())
  );
  if (!timeframe) {
    console.error(`Timeframe not found: "${name}". Available: ${board.timeframes.map(t => t.name).join(', ')}`);
    return null;
  }
  return timeframe.id;
}

/**
 * Generate a simple unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Create a task object with all required fields
 */
function createTask(board, { title, category, timeframe, notes = '', assignee = 'unassigned', priority = 'normal', status = 'not_started', checklist = [] }) {
  const categoryId = findCategoryId(board, category);
  const timeframeId = findTimeframeId(board, timeframe);

  if (!categoryId || !timeframeId) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    notes,
    status,
    assignee,
    priority,
    categoryId,
    timeframeId,
    dueDate: null,
    checklist: checklist.map(item => ({
      id: generateId(),
      title: typeof item === 'string' ? item : item.title,
      completed: typeof item === 'string' ? false : (item.completed || false)
    })),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Add multiple tasks to the board
 * @param {Array} taskDefinitions - Array of task objects with: title, category, timeframe, notes, assignee, priority
 * @param {boolean} reload - Whether to reload page after adding (default: true)
 */
function addTasks(taskDefinitions, reload = true) {
  const board = getBoard();
  if (!board) return;

  console.log(`Adding ${taskDefinitions.length} tasks...`);

  const newTasks = [];
  for (const def of taskDefinitions) {
    const task = createTask(board, def);
    if (task) {
      newTasks.push(task);
      console.log(`  + ${task.title} → ${def.category} / ${def.timeframe}`);
    }
  }

  if (newTasks.length === 0) {
    console.error('No valid tasks to add.');
    return;
  }

  // Merge new tasks with existing
  board.tasks = [...board.tasks, ...newTasks];
  board.updatedAt = new Date().toISOString();

  // Save to localStorage
  localStorage.setItem('wedding-planner-board', JSON.stringify(board));

  console.log(`\nAdded ${newTasks.length} tasks successfully!`);

  if (reload) {
    console.log('Reloading page to sync with Firebase...');
    setTimeout(() => location.reload(), 500);
  } else {
    console.log('Skipped reload. Call location.reload() to sync with Firebase.');
  }
}

/**
 * List all categories and timeframes (useful for reference)
 */
function listOptions() {
  const board = getBoard();
  if (!board) return;

  console.log('\n=== CATEGORIES ===');
  board.categories.forEach(c => console.log(`  "${c.name}"`));

  console.log('\n=== TIMEFRAMES ===');
  board.timeframes.forEach(t => console.log(`  "${t.name}"`));
}

// =============================================================================
// VOW WRITING TASKS (Example)
// =============================================================================

const vowTasks = [
  {
    title: "Begin vow brainstorming",
    category: "Ceremony",
    timeframe: "Feb 8-14",
    notes: "Gather memories, themes, and what you want to express",
    assignee: "both",
    priority: "normal"
  },
  {
    title: "Complete vow outline",
    category: "Ceremony",
    timeframe: "Feb 22-28",
    notes: "Organize thoughts into a structure",
    assignee: "both",
    priority: "normal"
  },
  {
    title: "Write first draft of vows",
    category: "Ceremony",
    timeframe: "Mar 8-14",
    notes: "Get initial version on paper",
    assignee: "both",
    priority: "normal"
  },
  {
    title: "Revise and refine vow draft",
    category: "Ceremony",
    timeframe: "Mar 22-31",
    notes: "Polish language, check length and tone",
    assignee: "both",
    priority: "normal"
  },
  {
    title: "Finalize vows",
    category: "Ceremony",
    timeframe: "Apr 16-30",
    notes: "Complete final version, practice reading aloud",
    assignee: "both",
    priority: "normal"
  }
];

// =============================================================================
// QUICK REFERENCE
// =============================================================================

console.log(`
========================================
  Wedding Planner - Bulk Task Loader
========================================

COMMANDS:
  addTasks(vowTasks)     Add the 5 vow writing milestone tasks
  addTasks(myTasks)      Add your own array of tasks
  listOptions()          Show all category and timeframe names

TASK FORMAT:
  {
    title: "Task title",
    category: "Ceremony",        // Partial match OK
    timeframe: "Feb 8-14",       // Partial match OK
    notes: "Optional notes",
    assignee: "both",            // unassigned|bride|groom|both|other
    priority: "normal"           // normal|high
  }

EXAMPLE:
  const myTasks = [
    { title: "Book DJ", category: "Venue", timeframe: "Feb 15", assignee: "groom" },
    { title: "Order flowers", category: "Ceremony", timeframe: "Apr 1", assignee: "bride", priority: "high" }
  ];
  addTasks(myTasks);
`);
