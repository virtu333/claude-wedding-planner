# Wedding Planner v2 - Product Specification

## Overview
A lightweight, grid-based task manager for wedding planning. Feels as quick as a spreadsheet but allows richer detail when you click into tasks. Two people can use it simultaneously with changes syncing on refresh.

## Core Concept
- **Rows:** Categories (user-defined, unlimited)
- **Columns:** Timeframes (user-defined, customizable as planning progresses)
- **Cells:** Contain task cards at the intersection of category and timeframe
- **Detail Panel:** Click a task to see/edit full details (notes-first design)

---

## Main View: Category × Timeframe Grid

### Layout
```
┌──────────────┬─────────────┬─────────────┬─────────────┬─────────┐
│   Category   │  Dec 2025   │  Jan 2026   │  Feb 2026   │    +    │
├──────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│ ▼ Venue      │ [Task Card] │ [Task Card] │             │         │
│              │ [Task Card] │             │             │         │
├──────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│ ▼ Food &     │             │ [Task Card] │ [Task Card] │         │
│   Drink      │             │             │             │         │
├──────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│ + Add Category                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Columns (Timeframes)
- User can **add** new columns (+ button at right edge)
- User can **rename** columns (click header to edit inline)
- User can **reorder** columns (drag or arrow buttons)
- User can **delete** columns (with confirmation if tasks exist)
- Examples: "Dec 2025", "Jan 2026", "Week of 5/10", "Post-Wedding"

### Rows (Categories)
- User can **add** new categories (button at bottom)
- User can **rename** categories (click to edit or via modal)
- User can **delete** categories (with confirmation if tasks exist)
- User can **collapse/expand** categories (click chevron)
- Shows task count in parentheses: "Venue (8)"
- Examples: "Venue", "Food & Drink", "Invitations & Postal", "Housing & Room Assignments"

### Cells
- Contain zero or more task cards
- **Drag-and-drop** tasks between cells
- Click empty area to quick-add task to that cell

---

## Task Card (Compact View in Grid)

### Visual Elements
```
┌─────────────────────────────┐
│ ⋮⋮ ● Menu Choices           │  ← Drag handle, status dot, title
│    Both                     │  ← Assignee badge
│    Confirm with venue...    │  ← Notes preview (truncated)
└─────────────────────────────┘
```

- **Drag handle** (grip icon) - for drag-and-drop
- **Status dot** - gray (not started), blue (in progress), green (completed)
- **Title** - truncated if long
- **Assignee badge** - small pill if assigned: "Bride" (pink), "Groom" (blue), "Both" (purple), "Other" (gray)
- **Priority flag** - icon if high priority
- **Notes preview** - first line of notes, subtle/truncated
- **Subtask progress** - if subtasks exist, show "2/5" or progress indicator
- **Due date** - if set, show formatted date; red if overdue, yellow if due within 7 days

### Completed Tasks
- Grayed out visually
- Global toggle to hide all completed tasks

### Interactions
- **Double-click** → Open task detail panel
- **Click status dot** → Cycle through statuses
- **Drag** → Move to different cell

---

## Task Detail Panel (Slide-out, Right Side)

### Design Principle
**Notes-first, minimal chrome.** The detail panel should feel light, not like a complex form.

### Layout
```
┌─────────────────────────────────────┐
│ Venue                             ✕ │  ← Category (read-only) + close
│ ─────────────────────────────────── │
│ Menu Choices                        │  ← Title (click to edit)
│ ─────────────────────────────────── │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Confirm details with venue      │ │  ← Notes (large, prominent)
│ │ - Evaluate options              │ │
│ │ - Identify any gaps             │ │
│ │ - Send decisions to venue       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Status    [Not Started] [In Progress] [Completed] │
│ Assignee  [—] [Bride] [Groom] [Both] [Other]      │
│ Priority  [Normal] [High]                         │
│ Timeframe [April 2026 ▼]                          │
│ Due Date  [mm/dd/yyyy] [Clear]                    │
│                                     │
│ ▶ Checklist (0/0)                   │  ← Collapsed by default
│                                     │
│ [Delete Task]                       │  ← Bottom, requires confirmation
└─────────────────────────────────────┘
```

### Fields
| Field | Type | Notes |
|-------|------|-------|
| Title | Editable text | Click to edit inline |
| Notes | Large textarea | **Primary focus**, auto-saves |
| Status | Toggle buttons | Not Started / In Progress / Completed |
| Assignee | Toggle buttons | Not Assigned / Bride / Groom / Both / Other |
| Priority | Toggle buttons | Normal / High |
| Timeframe | Dropdown | List of existing timeframe columns |
| Due Date | Date picker | Optional, with clear button |
| Checklist | Expandable section | Hidden by default, click to expand |

### Checklist (Subtasks)
- Collapsed by default ("▶ Checklist (0/0)")
- Click to expand
- Add subtask with text input
- Toggle checkbox to complete
- Delete subtask with trash icon on hover
- Shows progress: "Checklist (3/5)"

---

## Top Bar / Header

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│ Wedding Planning    ● Synced    │ [Status ▼] [Assignee ▼] [☐ Hide completed] │ [+ Add Task] [+ Add Category] │
└──────────────────────────────────────────────────────────────────────┘
```

### Elements
- **App title** - "Wedding Planning"
- **Sync indicator** - "● Synced" (green) or "● Local only" (gray)
- **Filters:**
  - Status dropdown: All / Not Started / In Progress / Completed
  - Assignee dropdown: All / Bride / Groom / Both / Other / Not Assigned
  - "Hide completed" checkbox
- **Actions:**
  - "+ Add Task" button → Opens add task modal
  - "+ Add Category" button → Opens add category modal

---

## Add Task Modal

Simple modal for quick task creation.

### Fields
- **Title** (required) - text input
- **Category** (required) - dropdown of existing categories
- **Timeframe** (required) - dropdown of existing timeframes
- **Status** - optional, defaults to "Not Started"

### Behavior
- After creation, optionally open the detail panel for the new task
- Or just close modal and show task in grid

---

## Data Model

### Board
```typescript
interface Board {
  id: string;
  name: string;
  categories: Category[];
  timeframes: Timeframe[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  order: number;
}
```

### Timeframe
```typescript
interface Timeframe {
  id: string;
  name: string;
  order: number;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  notes: string;
  status: 'not_started' | 'in_progress' | 'completed';
  assignee: 'unassigned' | 'bride' | 'groom' | 'both' | 'other';
  priority: 'normal' | 'high';
  categoryId: string;
  timeframeId: string;
  dueDate: Date | null;
  checklist: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ChecklistItem
```typescript
interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}
```

---

## Visual Design

### Colors

**Status:**
- Not Started: Gray (`bg-gray-200`, dot `bg-gray-400`)
- In Progress: Blue (`bg-blue-100`, dot `bg-blue-500`)
- Completed: Green (`bg-green-100`, dot `bg-green-500`)

**Assignee Badges:**
- Bride: Pink (`bg-pink-100 text-pink-700`)
- Groom: Blue (`bg-blue-100 text-blue-700`)
- Both: Purple (`bg-purple-100 text-purple-700`)
- Other: Gray (`bg-gray-100 text-gray-700`)

**Due Dates:**
- Overdue: Red border/badge
- Due within 7 days: Yellow/amber border/badge
- Normal: Gray text

**Completed Tasks:**
- Reduced opacity (opacity-50 or similar)
- Can be hidden via toggle

### Typography
- Clean, readable sans-serif (system fonts or Inter)
- Task titles: Medium weight
- Notes preview: Smaller, lighter color
- Badges: Small, uppercase or sentence case

### Spacing
- Comfortable padding in cells
- Clear visual separation between cards
- Adequate whitespace in detail panel

---

## Interactions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Open task detail | Double-click card | Slide-out panel opens |
| Cycle task status | Click status dot on card | Status changes |
| Move task | Drag card to different cell | Task moves, persists |
| Add task (quick) | Click "+" in empty cell | Modal with category/timeframe pre-filled |
| Add task (global) | Click "+ Add Task" in header | Modal opens |
| Edit timeframe name | Click column header | Inline edit mode |
| Add timeframe | Click "+" column | New column added |
| Delete timeframe | Click "×" on header | Confirmation if tasks exist |
| Collapse category | Click chevron | Row collapses |
| Filter tasks | Use dropdowns in header | Grid filters |
| Hide completed | Check toggle | Completed tasks hidden |

---

## Out of Scope for v1

These features are explicitly NOT included in v1:

- Real-time collaborative cursors (refresh-based sync is sufficient)
- File attachments on tasks
- Budget/cost tracking
- Email notifications or reminders
- Mobile-optimized responsive design (desktop-first)
- Import from Excel/CSV
- Export to PDF
- ~~Calendar view~~ *(implemented in v0.6.0)*
- User accounts/permissions (simple password gate only)
- Undo/redo
- Task ordering within cells (beyond natural order)
- Column/row resize (fixed widths for v1)
- Search (maybe add if time permits)

---

## Success Criteria

The app is successful if:

1. Both partners can access and edit the same board
2. Changes sync reliably (within a few seconds on refresh)
3. Adding tasks feels quick (< 3 clicks to create a task)
4. Viewing/editing task details feels lightweight, not overwhelming
5. The grid provides a clear overview of wedding planning status
6. Drag-and-drop works reliably for moving tasks
7. The app doesn't lose data
