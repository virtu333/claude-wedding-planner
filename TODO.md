# TODO - Implementation Plan

## Phase 0: Project Setup
- [x] Initialize Vite + React + TypeScript project
- [x] Install dependencies (tailwindcss, @dnd-kit/core, lucide-react, firebase)
- [x] Configure Tailwind CSS
- [x] Set up folder structure (components/, hooks/, lib/)
- [x] Create types.ts with all TypeScript interfaces
- [x] Create constants.ts (status colors, assignee colors, labels)
- [x] Create utils.ts (generateId, cn helper)
- [x] Set up Firebase configuration (firebase.ts)
- [x] Create initial .env.local template
- [x] Verify dev server runs

## Phase 1: Core Data Layer
- [x] Implement BoardProvider context
- [x] Implement useBoard hook with all actions
- [x] Add localStorage persistence
- [x] Add Firebase Firestore persistence
- [x] Add onSnapshot listener for real-time sync
- [x] Test data persistence (refresh, sync between tabs)
- [x] Add loading state handling
- [x] Add sync status indicator

## Phase 2: Basic Grid Layout
- [x] Create Header component (title, sync status only)
- [x] Create Board component (table structure)
- [x] Create CategoryRow component
- [x] Render categories as rows
- [x] Render timeframes as column headers
- [x] Style grid with Tailwind
- [x] Add horizontal scrolling for many columns
- [x] Test responsive behavior

## Phase 3: Timeframe Management
- [x] Add "+" button to add new timeframe column
- [x] Implement inline editing for timeframe names (click to edit)
- [x] Add delete timeframe button (with confirmation)
- [x] Implement timeframe reordering (arrow buttons or drag)
- [x] Persist timeframe changes

## Phase 4: Category Management
- [x] Add "Add Category" button
- [x] Create AddCategoryModal component
- [x] Implement category creation
- [x] Add collapse/expand toggle for categories
- [x] Show task count per category
- [x] Add category rename functionality
- [x] Add category delete (with confirmation)
- [x] Persist category changes

## Phase 5: Task Cards (Display)
- [x] Create TaskCard component
- [x] Display task title
- [x] Display status dot with correct color
- [x] Display assignee badge
- [x] Display priority flag (if high)
- [x] Display notes preview (first line, truncated)
- [x] Display due date (if set)
- [x] Style completed tasks (grayed out)
- [x] Render tasks in correct grid cells

## Phase 6: Task Detail Panel
- [x] Create TaskDetailPanel component (slide-out)
- [x] Implement open/close animation
- [x] Display category name (read-only)
- [x] Editable title field
- [x] Large notes textarea (prominent!)
- [x] Status toggle buttons
- [x] Assignee toggle buttons (including "Other")
- [x] Priority toggle buttons
- [x] Timeframe dropdown
- [x] Due date picker with clear button
- [x] Auto-save on change
- [x] Wire up double-click on TaskCard to open panel

## Phase 7: Task CRUD
- [x] Create AddTaskModal component
- [x] Add "+ Add Task" button to header
- [x] Add quick-add button in empty cells
- [x] Implement task creation
- [x] Implement task update (via detail panel) - done in Phase 6
- [x] Implement task delete (with confirmation) - done in Phase 6
- [x] Implement status cycling (click dot on card)

## Phase 8: Checklist/Subtasks
- [x] Add collapsible checklist section to TaskDetailPanel
- [x] Implement add subtask
- [x] Implement toggle subtask complete
- [x] Implement delete subtask
- [x] Show checklist progress on TaskCard (e.g., "2/5")
- [x] Persist checklist changes

## Phase 9: Drag and Drop
- [x] Set up DndContext in Board
- [x] Make TaskCard draggable
- [x] Create DroppableCell component
- [x] Implement onDragEnd handler
- [x] Update task categoryId/timeframeId on drop
- [x] Add visual feedback during drag (overlay, drop highlight)
- [x] Test drag between cells
- [x] Handle edge cases (drag to same cell, invalid drops)

## Phase 10: Filtering
- [x] Add status filter dropdown to Header
- [x] Add assignee filter dropdown to Header
- [x] Add "Hide completed" toggle to Header
- [x] Implement filtering logic in Board
- [x] Show/hide tasks based on filters
- [x] Add "Clear filters" button (if any active)
- [x] Show "X of Y tasks" when filtered

## Phase 11: Polish & Edge Cases
- [x] Add loading spinner/skeleton while data loads
- [x] Handle Firebase offline gracefully
- [x] Add error boundaries
- [x] Confirm before deleting tasks/categories/timeframes with data
- [x] Keyboard accessibility (tab navigation, enter to submit)
- [x] Empty states (no categories, no tasks)
- [ ] Mobile-friendly tweaks (if time permits)

## Phase 12: Deployment
- [x] Create production build
- [x] Set up Vercel project
- [x] Configure environment variables in Vercel
- [x] Deploy to Vercel
- [x] Test production deployment
- [ ] Share URL with fiancée for testing

## Pre-Deployment Tasks
- [x] **Refine task due dates** - Intelligent date distribution applied (2026-02-02)
  - 15 hard deadline tasks set to exact dates (payments, RSVP, etc.)
  - Tasks spread across timeframes (not all on midpoint)
  - "Research" tasks early in week, "Finalize" tasks later
  - Script: `scripts/set-intelligent-dates.mjs`

## Bug Fixes (Post-v1)
- [x] **CLI Enum Validation** (2026-02-02) - `update-task`/`bulk-update` now validate enum values
- [x] **UI Defensive Coding** (2026-02-02) - Safe accessor helpers prevent crash on invalid enum values
- [x] **Timeframe Auto-Sync** (2026-02-02) - Date metadata replaces hardcoded name matching
  - Timeframe type now has optional `startDate`/`endDate` fields
  - Auto-backfill parses common name patterns on load
  - `migrate-dates` CLI command for existing boards

## Optional Enhancements (Post-v1)
- [x] **Calendar Views** (deployed 2026-02-02, v0.6.0)
  - Monthly/weekly/daily calendar views using existing `task.dueDate` field
  - View mode toggle in header: Grid | Month | Week | Day
  - Date navigation with prev/next/today buttons
  - Tasks without `dueDate` shown in "Unscheduled" sidebar
  - All existing filters (status, assignee, hideCompleted) work across views
  - Intelligent due dates: tasks spread across timeframes, hard deadline overrides
- [ ] **Bulk Task Import** - Import tasks from JSON file (see `scripts/bulk-add-tasks.js` for context)
- [ ] Search tasks by name
- [ ] Column resize (drag to resize)
- [ ] Row resize
- [ ] Task ordering within cells
- [ ] Keyboard shortcuts
- [ ] Undo/redo
- [x] Export to CSV (completed in v0.4.0)
- [ ] Dark mode
- [ ] Mobile responsive design

## Future Considerations (Post-v1 Optimization)

### Performance: Full Board Re-renders (LOW PRIORITY - No Action Needed)
**Status:** Investigated 2026-02-02 - Current architecture is appropriate for scale

The single-document approach causes full React re-renders on any change. Investigation found:
- Expected scale: 20-50 tasks, 17 categories, 14 timeframes
- Re-render time: ~20-40ms (imperceptible)
- Current optimization: `useMemo` on derived values in Board.tsx
- Not memoized: TaskCard, CategoryRow (intentional - render cost < memo cost at this scale)

**Monitor if:** Users report lag, render phase >50ms in DevTools, or tasks exceed 100.

**Potential optimizations if needed:**
- Refactor GridView to pass only category-relevant tasks (not entire array)
- React.memo on CategoryRow with custom comparator
- Partial Firebase updates (currently batched via 300ms debounce)

### Legacy Timeframe Dates (MEDIUM PRIORITY - Remove After Migration)
**Location:** `src/lib/timeframeUtils.ts` - LEGACY_TIMEFRAME_RANGES (lines 58-96)

Hardcoded wedding-specific date ranges for backwards compatibility. Migration logic exists:
- `backfillTimeframeDates()` called on every load (localStorage + Firebase)
- New timeframes auto-get ISO date metadata

**When to remove:**
1. Verify all active boards have migrated (timeframes have startDate/endDate)
2. Add validation to reject boards with unmigrated timeframes
3. Delete LEGACY_TIMEFRAME_RANGES entirely (save ~40 lines)

**Target:** Q3 2026 or after confirming no legacy boards exist

### Missing useCallback (NO ACTION NEEDED)
**Location:** `src/components/TaskDetailPanel.tsx:85-89` - handleAddChecklistItem

Investigated and found FALSE POSITIVE:
- Handler is inline, not passed to memoized children
- ConfirmModal (only child) is not React.memo'd
- No performance impact; consistency is the only argument for adding useCallback

### Silent Returns in Board Actions (NICE-TO-HAVE)
**Status:** Investigated 2026-02-02 - Low risk, minor UX improvement possible

**Location:** `src/hooks/useBoard.tsx:275-538` - All 14 action functions

All board actions (`addTask`, `updateTask`, `deleteTask`, etc.) have defensive checks:
```typescript
if (!state.board) return;  // Silent return - no error feedback
```

**Why this is safe:**
- Board always initializes (Firebase → localStorage → seed data fallback)
- Firebase operations DO have proper error handling (`syncStatus: 'error'` shown in UI)
- Silent return only affects tiny window during initial load (milliseconds)

**If improved:** Add loading state that disables action buttons until board loads.

### Date Handling Organization (NO ACTION NEEDED)
**Status:** Investigated 2026-02-02 - Well-structured, no consolidation needed

**Files reviewed:**
- `src/lib/utils.ts` - 3 functions (task display: formatDate, isOverdue, isDueSoon)
- `src/lib/calendarUtils.ts` - 16 functions (calendar rendering, navigation, DnD)
- `src/lib/timeframeUtils.ts` - 7 functions (timeframe logic, ranges, migration)
- `src/components/TaskDetailPanel.tsx` - 2 functions (HTML input handling)

**Findings:**
- No true duplicates - apparent similarities are intentional specialization
- `formatDate()` → "Jan 5, 2026" (human display) vs `toISODateString()` → "2026-01-05" (storage)
- Separation by concern is correct design pattern
- Consolidation would increase complexity, not reduce it

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0: Setup | Complete | |
| Phase 1: Data Layer | Complete | |
| Phase 2: Grid Layout | Complete | |
| Phase 3: Timeframes | Complete | |
| Phase 4: Categories | Complete | |
| Phase 5: Task Cards | Complete | |
| Phase 6: Detail Panel | Complete | |
| Phase 7: Task CRUD | Complete | |
| Phase 8: Checklists | Complete | |
| Phase 9: Drag & Drop | Complete | |
| Phase 10: Filtering | Complete | |
| Phase 11: Polish | Complete | Mobile tweaks skipped |
| Phase 12: Deploy | Complete | https://wedding-planner-lake.vercel.app |

---

## Session Log

Use this section to track what was done in each Claude Code session:

### Session 1 - 2026-01-31
- [x] Phase 0 complete: Project setup
  - Created vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json
  - Created eslint.config.js
  - Created src/lib/types.ts with all TypeScript interfaces from PROJECT_SPEC.md
  - Created src/lib/constants.ts with status/assignee colors and labels
  - Created src/lib/utils.ts with generateId, cn, formatDate, isOverdue, isDueSoon
  - Created src/lib/firebase.ts with Firestore initialization and board operations
  - Created src/main.tsx, src/App.tsx, src/index.css, src/vite-env.d.ts
  - Created placeholder directories for components/ and hooks/
  - Verified npm install, npm run build, npm run lint, npm run dev all work

### Session 2 - 2026-01-31
- [x] Phase 1 complete: Core Data Layer
  - Created src/hooks/useBoard.tsx with BoardProvider context and useBoard hook
  - Implemented all CRUD actions: tasks, categories, timeframes, checklist items
  - Added localStorage persistence (immediate save)
  - Added Firebase Firestore persistence (debounced save)
  - Added onSnapshot listener for real-time sync
  - Added loading state and sync status indicator
  - Created default board with starter categories and timeframes
  - Created placeholder Header.tsx with sync status display
  - Created placeholder Board.tsx with basic grid display
  - Updated App.tsx to wrap with BoardProvider
  - Verified npm run build, npm run lint, npm run dev all work

### Session 3 - 2026-01-31
- [x] Phase 2 complete: Basic Grid Layout
  - Created src/components/CategoryRow.tsx component
  - Refactored Board.tsx to use CategoryRow component
  - Removed stats bar from Board (not in spec)
  - Added sticky header row for column names
  - Added sticky category column for horizontal scroll
  - Improved table structure with proper widths (180px columns)
  - Added placeholder column for "+ timeframe" button (Phase 3)
  - Added placeholder row for "+ category" button (Phase 4)
  - Tasks display as simple cards with completed state styling
  - Empty cells display "—" placeholder
  - Verified npm run build, npm run lint all pass

### Session 4 - 2026-01-31
- [x] Phase 3 complete: Timeframe Management
  - Created src/components/TimeframeHeader.tsx with edit/delete/reorder functionality
  - Created src/components/AddTimeframeButton.tsx with "+" button
  - Inline editing: click name to edit, Enter to save, Escape to cancel
  - Arrow buttons (←/→) for reordering timeframes
  - Delete with confirmation if tasks exist in timeframe
  - Auto-generates suggested name for new timeframe based on last one
- [x] Phase 4 complete: Category Management
  - Created src/components/AddCategoryButton.tsx for adding categories
  - Updated CategoryRow.tsx with collapse/expand, rename, delete
  - Chevron toggle (▶/▼) for collapse/expand categories
  - Inline editing for category names
  - Delete with confirmation if tasks exist in category
  - Task count display per category
- [x] Updated Board.tsx to use all new components
- [x] Updated ARCHITECTURE.md: React 18 → React 19
- [x] Verified npm run build, npm run lint all pass

### Session 5 - 2026-01-31
- [x] Phase 5 complete: Task Cards (Display)
  - Created src/components/TaskCard.tsx with rich task display
  - Status dot with color coding (gray/blue/green)
  - Assignee badge with color (Bride/Groom/Both/Other)
  - Priority flag (amber) for high priority tasks
  - Notes preview (first line, truncated)
  - Due date with overdue (red) and due soon (amber) styling
  - Checklist progress indicator (e.g., "2/5")
  - Completed tasks grayed out with opacity
  - Grip icon for visual drag handle (DnD in Phase 9)
  - Updated CategoryRow.tsx to use TaskCard component
- [x] Verified npm run build, npm run lint all pass

### Session 6 - 2026-01-31
- [x] Phase 6 complete: Task Detail Panel
  - Created src/components/TaskDetailPanel.tsx (slide-out panel)
  - Notes-first design with large textarea at top
  - Editable title with inline styling
  - Toggle buttons for status (Not Started/In Progress/Completed)
  - Toggle buttons for assignee (—/Bride/Groom/Both/Other)
  - Toggle buttons for priority (Normal/High)
  - Timeframe dropdown with all available timeframes
  - Due date picker with Clear button
  - Auto-save on every field change
  - Delete task with confirmation
  - ESC key closes panel
  - Checklist section placeholder (Phase 8)
  - Updated TaskCard.tsx with onDoubleClick prop
  - Updated CategoryRow.tsx to pass onTaskSelect callback
  - Updated Board.tsx with selectedTaskId state and panel rendering
- [x] Verified npm run build, npm run lint all pass

### Session 7 - 2026-02-01
- [x] Phase 7 complete: Task CRUD
  - Created src/components/AddTaskModal.tsx with form for creating tasks
  - Added "+ Add Task" button to Header component
  - Added quick-add "+" button in empty grid cells
  - Modal has title (required), category and timeframe dropdowns
  - Quick-add pre-fills category and timeframe from clicked cell
  - ESC key closes modal, backdrop click closes modal
  - Implemented status cycling on TaskCard status dot click
  - Click status dot to cycle: not_started → in_progress → completed → not_started
  - Status dot has hover ring for visual feedback
  - Refactored to move Header rendering into Board component
  - Used inner AddTaskForm component for clean state reset on modal open
- [x] Verified npm run build, npm run lint all pass

### Session 8 - 2026-02-01
- [x] Code Review fixes: Error handling & state management
  - Created src/lib/errorHandler.ts with centralized `logError()` function
  - Updated src/lib/firebase.ts:
    - Added env var validation before Firebase init (helpful error if missing)
    - Added try-catch to `getBoard()` and `saveBoard()`
    - Added error callback parameter to `subscribeToBoard()`
  - Updated src/hooks/useBoard.tsx:
    - Replaced 5 `console.error` calls with `logError()`
    - Fixed debounce timer cleanup using useRef (prevents memory leak)
    - Passes error callback to `subscribeToBoard()`
  - Updated src/components/Board.tsx:
    - Removed duplicate `selectedTaskId` useState (uses context now)
    - Added useMemo for sorted categories and timeframes
- [x] Verified npm run build passes, npm run lint has only 1 pre-existing warning

### Session 9 - 2026-02-01
- [x] Bug fixes from code review
  - **Firebase Optional Mode**: App no longer crashes without Firebase env vars
    - src/lib/firebase.ts: Made initialization conditional, exports `isFirebaseConfigured`
    - src/hooks/useBoard.tsx: Skips Firebase when not configured, stays in offline mode
  - **Date Timezone Fix**: Due dates no longer shift by timezone
    - src/components/TaskDetailPanel.tsx: Fixed `formatDateForInput()` to use local date parts
  - **Inline Edit Staleness**: Edit fields now show current value
    - src/components/CategoryRow.tsx: Reset editValue on edit click
    - src/components/TimeframeHeader.tsx: Reset editValue on edit click
  - **Add Task Empty State**: Button disabled when no categories/timeframes
    - src/components/Header.tsx: Added `canAddTask` check with tooltip
  - Documentation cleanup:
    - .env.example: Removed password var, noted Firebase optional
    - CLAUDE.md: Removed password references
    - ARCHITECTURE.md: Clarified DroppableCell.tsx is Phase 9
- [x] Verified npm run build passes

### Session 10 - 2026-02-01
- [x] Phase 8 complete: Checklists/Subtasks
  - Updated src/components/TaskDetailPanel.tsx:
    - Added useState for isChecklistExpanded and newItemTitle
    - Added ChevronRight, ChevronDown, Trash2 icons from lucide-react
    - Added addChecklistItem, updateChecklistItem, deleteChecklistItem from useBoard
    - Replaced placeholder with expandable checklist section
    - Click header to expand/collapse (ChevronRight/ChevronDown icons)
    - Checkbox to toggle item completion (strike-through when done)
    - Trash icon on hover to delete items
    - Text input at bottom to add new items (Enter to submit)
  - TaskCard already showed checklist progress ("2/5") from Phase 5
  - Checklist CRUD actions already existed in useBoard from Phase 1
- [x] Verified npm run build passes

### Session 11 - 2026-02-01
- [x] Phase 9 complete: Drag and Drop
  - Created src/components/DroppableCell.tsx:
    - Uses @dnd-kit/core useDroppable hook
    - ID format: "categoryId:timeframeId" for parsing on drop
    - Visual feedback: bg-blue-50 + border-blue-300 when isOver
  - Updated src/components/TaskCard.tsx:
    - Added useDraggable hook from @dnd-kit/core
    - Grip handle wrapper with listeners/attributes
    - Transform applied during drag (CSS.Translate)
    - Reduced opacity when isDragging
  - Updated src/components/Board.tsx:
    - Added DndContext wrapper with closestCenter collision detection
    - Added DragOverlay for smooth drag preview
    - handleDragStart/handleDragEnd callbacks
    - Parses "categoryId:timeframeId" from drop target ID
    - Calls moveTask(taskId, categoryId, timeframeId) on drop
    - Same-cell drops are no-ops
  - Updated src/components/CategoryRow.tsx:
    - Replaced <td> with DroppableCell component
    - Added smaller quick-add button to cells with tasks
- [x] Verified npm run build passes

### Session 12 - 2026-02-01
- [x] Phase 10 complete: Filtering
  - Updated src/components/Header.tsx:
    - Added status filter dropdown (All / Not Started / In Progress / Completed)
    - Added assignee filter dropdown (All / Not Assigned / Bride / Groom / Both / Other)
    - Added "Hide completed" checkbox toggle
    - Added "Clear filters" link (visible when filters active)
    - Added "X of Y tasks" count (visible when filtering)
    - New props: filters, onFiltersChange, taskCount
  - Updated src/components/Board.tsx:
    - Added FilterState import from types
    - Added filters useState with default values
    - Added filteredTasks useMemo for efficient filtering
    - Pass filteredTasks to CategoryRow (instead of board.tasks)
    - Pass filter props to Header component
- [x] Verified npm run build passes

### Session 13 - 2026-02-01
- [x] Phase 11 complete: Polish & Edge Cases
  - Created src/components/ErrorBoundary.tsx:
    - Class component with getDerivedStateFromError and componentDidCatch
    - Shows error message with "Try Again" button for recovery
    - Wraps entire app in App.tsx
  - Updated src/components/Board.tsx:
    - Added animated loading spinner (replaces plain text)
    - Added styled error state when board fails to load
    - Added empty board welcome message (no categories/timeframes)
    - Added "no filter results" banner with clear filters button
    - Fixed flex layout for proper message display
  - Updated keyboard accessibility (aria-labels):
    - src/components/TimeframeHeader.tsx: ←, →, ✕ buttons
    - src/components/CategoryRow.tsx: collapse, delete, quick-add buttons
    - src/components/TaskCard.tsx: status dot is now proper button with keyboard support
    - src/components/TaskDetailPanel.tsx: close button, delete checklist item
    - src/components/Header.tsx: filter dropdowns
  - Skipped: Mobile-friendly tweaks (lower priority for v1)
- [x] Verified npm run build passes

### Session 14 - 2026-02-02
- [x] Phase 12 complete: Deployment
  - Created vercel.json for SPA routing configuration
  - Set up Firebase project (wedding-planner-2-638d3)
  - Created .env.local with Firebase credentials
  - Configured Vercel environment variables for production
  - Deployed to Vercel: https://wedding-planner-lake.vercel.app
  - Verified Firebase sync working in production

### Session 15 - 2026-02-02
- [x] Bug fix: App crash on missing checklist property
  - TaskCard.tsx: Defensive check `(task.checklist?.length ?? 0)`
  - utils.ts: `getChecklistProgress()` handles undefined input
- [x] Bug fix: Data corruption on load from Firebase/localStorage
  - firebase.ts: `convertTimestamps()` ensures all properties exist
  - useBoard.tsx: `loadFromStorage()` ensures all properties exist
  - Added fallback defaults for timeframes, categories, and task fields
- [x] Deployed fixes to Vercel
- [x] User cleared localStorage to reset corrupted data
- [x] Verified app loads correctly with seed data

### Session 16 - 2026-02-02
- [x] Calendar Views Feature Implementation
  - Created src/lib/calendarUtils.ts with date helper functions
  - Added ViewMode type to src/lib/types.ts
  - Extracted grid into src/components/views/GridView.tsx
  - Created src/components/views/CalendarContainer.tsx (layout wrapper)
  - Created src/components/views/MonthlyView.tsx (month grid with task dots)
  - Created src/components/views/WeeklyView.tsx (7-day columns)
  - Created src/components/views/DailyView.tsx (single day detail)
  - Created src/components/views/UnscheduledSidebar.tsx (tasks without dueDate)
  - Created src/components/calendar/CalendarNavigation.tsx (prev/next/today)
  - Updated src/components/Header.tsx with view mode toggle buttons
  - Updated src/components/Board.tsx with viewMode state and CalendarContainer
  - All existing filters work across views
  - Click task to open TaskDetailPanel (same as grid)
- [x] Calendar Views Enhancements
  - Monthly view: High-priority tasks float to top in day cells
  - Weekly view: Category rows × day columns (like grid layout)
  - Weekly view: Hide empty category rows
  - Daily view: Tasks grouped by category with section headers
- [x] Set auto-generated due dates based on timeframes (for testing)
  - Created scripts/set-due-dates.mjs utility
  - Maps timeframe names to specific dates (e.g., "Feb 1-7" → Feb 4)
- [x] Verified npm run build passes
- [x] Local testing complete
