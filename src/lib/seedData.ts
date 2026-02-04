import type { Board, Category, Timeframe, Task } from './types';
import { generateId } from './utils';

// =============================================================================
// EXAMPLE SEED DATA
// This file contains generic example data for demonstration purposes.
// Customize the categories, timeframes, and tasks for your own wedding.
// =============================================================================

const timeframeIds = {
  // Example past timeframes
  early2025: generateId(),
  mid2025: generateId(),
  late2025: generateId(),

  // Example current planning (customize with your dates)
  month1: generateId(),
  month2: generateId(),
  month3: generateId(),

  // Wedding week (customize with your dates)
  weddingWeekMon: generateId(),
  weddingWeekTue: generateId(),
  weddingWeekWed: generateId(),
  weddingWeekThu: generateId(),
  weddingFri: generateId(),
  weddingSat: generateId(),
  weddingSun: generateId(),

  // Post-wedding
  postWedding: generateId(),
};

const categoryIds = {
  venue: generateId(),
  foodDrink: generateId(),
  invitations: generateId(),
  housing: generateId(),
  website: generateId(),
  outfits: generateId(),
  weddingParty: generateId(),
  family: generateId(),
  ceremony: generateId(),
  reception: generateId(),
  hairMakeup: generateId(),
  photography: generateId(),
  entertainment: generateId(),
  decorations: generateId(),
  transportation: generateId(),
  travel: generateId(),
  other: generateId(),
};

// =============================================================================
// TIMEFRAMES
// =============================================================================

const timeframes: Timeframe[] = [
  // Past
  { id: timeframeIds.early2025, name: 'Early 2025', order: 0 },
  { id: timeframeIds.mid2025, name: 'Mid 2025', order: 1 },
  { id: timeframeIds.late2025, name: 'Late 2025', order: 2 },

  // Current planning
  { id: timeframeIds.month1, name: 'Month 1', order: 3 },
  { id: timeframeIds.month2, name: 'Month 2', order: 4 },
  { id: timeframeIds.month3, name: 'Month 3', order: 5 },

  // Wedding week
  { id: timeframeIds.weddingWeekMon, name: 'Wedding Week Mon', order: 6 },
  { id: timeframeIds.weddingWeekTue, name: 'Wedding Week Tue', order: 7 },
  { id: timeframeIds.weddingWeekWed, name: 'Wedding Week Wed', order: 8 },
  { id: timeframeIds.weddingWeekThu, name: 'Wedding Week Thu', order: 9 },
  { id: timeframeIds.weddingFri, name: 'Wedding Fri', order: 10 },
  { id: timeframeIds.weddingSat, name: 'Wedding Sat', order: 11 },
  { id: timeframeIds.weddingSun, name: 'Wedding Sun', order: 12 },

  // Post-wedding
  { id: timeframeIds.postWedding, name: 'Post-Wedding', order: 13 },
];

// =============================================================================
// CATEGORIES
// =============================================================================

const categories: Category[] = [
  { id: categoryIds.venue, name: 'Venue', order: 0 },
  { id: categoryIds.foodDrink, name: 'Food & Drink', order: 1 },
  { id: categoryIds.invitations, name: 'Invitations', order: 2 },
  { id: categoryIds.housing, name: 'Guest Housing', order: 3 },
  { id: categoryIds.website, name: 'Website', order: 4 },
  { id: categoryIds.outfits, name: 'Outfits & Attire', order: 5 },
  { id: categoryIds.weddingParty, name: 'Wedding Party', order: 6 },
  { id: categoryIds.family, name: 'Family', order: 7 },
  { id: categoryIds.ceremony, name: 'Ceremony', order: 8 },
  { id: categoryIds.reception, name: 'Reception', order: 9 },
  { id: categoryIds.hairMakeup, name: 'Hair & Makeup', order: 10 },
  { id: categoryIds.photography, name: 'Photography', order: 11 },
  { id: categoryIds.entertainment, name: 'Entertainment', order: 12 },
  { id: categoryIds.decorations, name: 'Decorations', order: 13 },
  { id: categoryIds.transportation, name: 'Transportation', order: 14 },
  { id: categoryIds.travel, name: 'Travel', order: 15 },
  { id: categoryIds.other, name: 'Other / Admin', order: 16 },
];

// =============================================================================
// TASK HELPER
// =============================================================================

function createTask(
  title: string,
  categoryId: string,
  timeframeId: string,
  options: {
    notes?: string;
    priority?: 'normal' | 'high';
    assignee?: 'unassigned' | 'bride' | 'groom' | 'both' | 'other';
    status?: 'not_started' | 'in_progress' | 'completed';
    dueDate?: Date | null;
    checklist?: { title: string; completed: boolean }[];
  } = {}
): Task {
  const now = new Date();
  return {
    id: generateId(),
    title,
    categoryId,
    timeframeId,
    notes: options.notes || '',
    priority: options.priority || 'normal',
    assignee: options.assignee || 'both',
    status: options.status || 'not_started',
    dueDate: options.dueDate || null,
    checklist: (options.checklist || []).map(item => ({
      id: generateId(),
      title: item.title,
      completed: item.completed,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// EXAMPLE TASKS
// These are generic examples - customize for your wedding!
// =============================================================================

const tasks: Task[] = [
  // Venue
  createTask('Book venue', categoryIds.venue, timeframeIds.early2025, {
    status: 'completed',
    notes: 'Venue booked and deposit paid',
  }),
  createTask('Schedule venue walkthrough', categoryIds.venue, timeframeIds.month1, {
    priority: 'high',
  }),
  createTask('Confirm catering details', categoryIds.venue, timeframeIds.month2, {
    checklist: [
      { title: 'Review menu options', completed: false },
      { title: 'Confirm headcount', completed: false },
      { title: 'Discuss dietary restrictions', completed: false },
    ],
  }),

  // Food & Drink
  createTask('Research catering options', categoryIds.foodDrink, timeframeIds.early2025, {
    status: 'completed',
  }),
  createTask('Plan bar menu', categoryIds.foodDrink, timeframeIds.month2, {
    notes: 'Decide on signature cocktails',
  }),
  createTask('Order wedding cake', categoryIds.foodDrink, timeframeIds.month3, {
    priority: 'high',
  }),

  // Invitations
  createTask('Create guest list', categoryIds.invitations, timeframeIds.early2025, {
    status: 'completed',
  }),
  createTask('Send save-the-dates', categoryIds.invitations, timeframeIds.mid2025, {
    status: 'completed',
  }),
  createTask('Send invitations', categoryIds.invitations, timeframeIds.late2025, {
    status: 'completed',
  }),
  createTask('Track RSVPs', categoryIds.invitations, timeframeIds.month1, {
    checklist: [
      { title: 'Review responses weekly', completed: false },
      { title: 'Follow up with non-responders', completed: false },
    ],
  }),

  // Outfits
  createTask('Shop for wedding dress', categoryIds.outfits, timeframeIds.early2025, {
    assignee: 'bride',
    status: 'completed',
  }),
  createTask('Order suit/tux', categoryIds.outfits, timeframeIds.mid2025, {
    assignee: 'groom',
    status: 'completed',
  }),
  createTask('Schedule dress alterations', categoryIds.outfits, timeframeIds.month1, {
    assignee: 'bride',
  }),
  createTask('Pick up wedding bands', categoryIds.outfits, timeframeIds.month3, {
    priority: 'high',
  }),

  // Ceremony
  createTask('Book officiant', categoryIds.ceremony, timeframeIds.early2025, {
    status: 'completed',
  }),
  createTask('Write vows', categoryIds.ceremony, timeframeIds.month2, {
    checklist: [
      { title: 'Draft first version', completed: false },
      { title: 'Revise and polish', completed: false },
      { title: 'Practice reading aloud', completed: false },
    ],
  }),
  createTask('Choose ceremony music', categoryIds.ceremony, timeframeIds.month2, {
    notes: 'Processional, recessional, and any special songs',
  }),
  createTask('Rehearsal', categoryIds.ceremony, timeframeIds.weddingFri, {
    priority: 'high',
  }),
  createTask('CEREMONY', categoryIds.ceremony, timeframeIds.weddingSat, {
    priority: 'high',
  }),

  // Reception
  createTask('Create seating chart', categoryIds.reception, timeframeIds.month3, {
    priority: 'high',
  }),
  createTask('Choose first dance song', categoryIds.reception, timeframeIds.month1, {
  }),
  createTask('RECEPTION', categoryIds.reception, timeframeIds.weddingSat, {
    priority: 'high',
  }),

  // Photography
  createTask('Book photographer', categoryIds.photography, timeframeIds.early2025, {
    status: 'completed',
  }),
  createTask('Create shot list', categoryIds.photography, timeframeIds.month2, {
    checklist: [
      { title: 'Family groupings', completed: false },
      { title: 'Wedding party photos', completed: false },
      { title: 'Must-have moments', completed: false },
    ],
  }),

  // Hair & Makeup
  createTask('Book hair and makeup artist', categoryIds.hairMakeup, timeframeIds.month1, {
    assignee: 'bride',
    priority: 'high',
  }),
  createTask('Schedule trial', categoryIds.hairMakeup, timeframeIds.month2, {
    assignee: 'bride',
  }),

  // Transportation
  createTask('Arrange guest transportation', categoryIds.transportation, timeframeIds.month2, {
  }),

  // Travel
  createTask('Book flights', categoryIds.travel, timeframeIds.month1, {
    notes: 'If destination wedding or traveling from out of town',
  }),
  createTask('Book honeymoon', categoryIds.travel, timeframeIds.month2, {
  }),

  // Other
  createTask('Get marriage license', categoryIds.other, timeframeIds.month3, {
    priority: 'high',
  }),
  createTask('Prepare emergency kit', categoryIds.other, timeframeIds.weddingWeekThu, {
    checklist: [
      { title: 'Sewing kit', completed: false },
      { title: 'Pain relievers', completed: false },
      { title: 'Stain remover', completed: false },
      { title: 'Safety pins', completed: false },
    ],
  }),
  createTask('Send thank you cards', categoryIds.other, timeframeIds.postWedding, {
    notes: 'Within 2-3 months of wedding',
  }),
];

// =============================================================================
// EXPORT
// =============================================================================

export function createSeedBoard(): Board {
  const now = new Date();

  return {
    id: 'main',
    name: 'Wedding Planning',
    categories,
    timeframes,
    tasks,
    createdAt: now,
    updatedAt: now,
  };
}
