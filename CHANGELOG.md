# Changelog

All notable changes to the Wedding Planner app will be documented in this file.

## [Unreleased]

### Fixed
- **WeeklyView Sticky Header** - Day headers (SUN, MON, etc.) now stay pinned when scrolling
  - Added `sticky top-0 z-20` to thead, matching GridView behavior
  - Corner "Category" cell gets `z-30` to stay above both row/column headers
  - Changed day header backgrounds from transparent `bg-[#29564F]/10` to solid `bg-[#D0DAD6]` for "today"
- **Calendar View Drag-and-Drop** - Tasks can now be dragged between days in Month and Week views
  - MonthlyView: Drag task dots between day cells to reschedule
  - WeeklyView: Drag task cards between day columns (droppable ID includes categoryId for uniqueness)
  - Both views: DndContext, drag handles, visual feedback on drop targets
- **CLI Enum Validation** - `update-task` and `bulk-update` commands now validate status/assignee/priority values
  - Invalid values show error with valid options instead of corrupting data
  - Example: `update-task "test" status bogus` → `Invalid status "bogus". Valid values: not_started, in_progress, completed`
- **UI Crash on Invalid Enum Values** - Added defensive fallbacks in all components
  - New safe accessor helpers: `getStatusColors()`, `getAssigneeColors()`, `getStatusLabel()`, etc.
  - Tasks with corrupted enum values render with gray fallback instead of crashing
  - Affected: TaskCard, DailyView, WeeklyView, MonthlyView, UnscheduledSidebar, CSV export
- **Timeframe Auto-Sync Mismatch** - Due date → timeframe mapping now uses structured date metadata
  - Added optional `startDate`/`endDate` fields to Timeframe type (ISO 8601 strings)
  - `findTimeframeForDate()` checks metadata first, falls back to legacy name matching
  - `calculateTimeframeOrder()` uses midpoint between neighbors (avoids order collisions)
  - `createTimeframeForDate()` now includes date metadata on new timeframes
  - Auto-backfill on load: parses common name patterns ("Feb 15-21", "May 8", "Jan 2026")
- **Task Detail Panel Off-Screen on Small Windows** - Panel now visible without horizontal scrolling
  - Changed from document flow to fixed positioning (overlays content)
  - Panel anchors to viewport right edge at all screen sizes
  - Added `max-w-[calc(100vw-48px)]` to prevent panel exceeding viewport on very small screens
  - Added semi-transparent backdrop on screens < 1024px (click to close)
  - Affected files: `TaskDetailPanel.tsx`, `Board.tsx`

### Added
- **CLI `migrate-dates` Command** - Backfills date metadata to existing timeframes
  - Run `node scripts/firebase-tasks.mjs migrate-dates --dry-run` to preview
  - Run `node scripts/firebase-tasks.mjs migrate-dates` to apply
- `README.md` - Setup guide for new users (Firebase, Vercel deployment)
- `.env.example` - Added `VITE_APP_PASSWORD` field
- **Auto-sync Timeframe on Due Date Change**
  - When setting a due date, the task automatically moves to the matching timeframe column
  - No more double-dropdown workflow - single click to schedule tasks
  - If no matching timeframe exists, creates a new monthly timeframe (e.g., "Jul 2026")
  - New utility file: `src/lib/timeframeUtils.ts` with date-to-timeframe mapping

### Changed
- **CLI init command** - Now includes `startDate`/`endDate` on all timeframes
- **Timeframe type** - Added optional `startDate?: string` and `endDate?: string` fields
- `skills/weddingplannerskill.md` - Replaced with generic template (personal data removed)
- `src/lib/seedData.ts` - Replaced with generic example tasks (personal data removed)
- `scripts/set-intelligent-dates.mjs` - Added note that dates are examples to customize
- `.gitignore` - Added exclusions for personal files:
  - `*.personal.md`, `*.personal.ts`, `*.personal.json`
  - `for reference - wedding planning info/`
  - `*-export.json`, `issues/`

### Notes
- **GitHub push pending**: Production URL and specific dates still need generalization before public sharing
- Personal backups preserved locally as `*.personal.*` files (gitignored)

## [0.6.0] - 2026-02-02

### Added
- **Calendar Views Feature** - Alternative views alongside the grid
  - View mode toggle in header: Grid | Month | Week | Day
  - Monthly view: Calendar grid showing tasks as colored dots with "+N more" overflow
  - Weekly view: 7-day columns with scrollable task lists per day
  - Daily view: Single day with full task cards and details
  - Uses existing `task.dueDate` field for calendar positioning
  - Unscheduled sidebar: Tasks without dueDate shown in collapsible panel
  - Date navigation: Prev/next buttons + Today button
  - Click day in monthly view to drill down to daily view
  - All existing filters (status, assignee, hide completed) work across views
  - Click task to open TaskDetailPanel (same as grid view)
- New files:
  - `src/lib/calendarUtils.ts` - Date helper functions
  - `src/components/views/GridView.tsx` - Extracted grid from Board.tsx
  - `src/components/views/CalendarContainer.tsx` - Layout wrapper
  - `src/components/views/MonthlyView.tsx` - Month calendar grid
  - `src/components/views/WeeklyView.tsx` - Week columns
  - `src/components/views/DailyView.tsx` - Day detail list
  - `src/components/views/UnscheduledSidebar.tsx` - Tasks without dates
  - `src/components/calendar/CalendarNavigation.tsx` - Date navigation
- **Music & Dance Category** - New category with 53 tasks covering:
  - Song selection: first dance, processional, recessional, grand entrance, parent dances, last dance
  - Equipment: speaker/amp acquisition, karaoke setup
  - Playlists: reception requests, Friday dinner, campfire, Saturday morning, karaoke list
  - DJ coordination: planning call, final song selections, equipment confirmation
  - Wedding weekend: setup, sound check, execution
- Moved 17 existing music-related tasks from Reception, Ceremony, Venue, Welcome Dinner
- Added 37 new music/dance tasks with appropriate timeframes (Feb-May 2026)
- **Firebase CLI for Task Management** (`scripts/firebase-tasks.mjs`)
  - Direct Firestore access bypasses browser/localStorage sync issues
  - Commands: `list`, `list-categories`, `list-timeframes`, `add-category`, `add-tasks`, `move-tasks`, `delete-task`, `update-task`, `bulk-update`, `export`, `init`
  - `--dry-run` flag to preview changes without saving
  - Robust .env parsing (handles quoted values, `=` in values)
  - JSON validation with clear error messages
  - Loads from `.env` first, falls back to `.env.local`
- **Due Date Generator Script** (`scripts/set-due-dates.mjs`)
  - Auto-sets task due dates based on timeframe names
  - Parses various formats: "Feb 1-7" → Feb 4, "Fri May 8" → May 8, "Jan 2026" → Jan 15
  - `--dry-run` flag to preview changes
  - Uses `.env.local` for Firebase credentials
- **Intelligent Due Date Script** (`scripts/set-intelligent-dates.mjs`)
  - Spreads tasks across timeframes (not all on midpoint)
  - 15 hard deadline overrides for known dates (payments, RSVP, etc.)
  - Task type detection: "Research" tasks early, "Finalize" tasks late
  - Even workload distribution across days
  - `--dry-run` flag to preview changes
- **Claude Task Management Workflow** (in `skills/weddingplannerskill.md`)
  - Firebase CLI command reference
  - Task proposal workflow instructions
  - Timeframe quick reference with deadlines
  - Assignee conventions and priority guidelines
  - Task JSON format documentation

### Changed
- **Calendar View Enhancements** - Based on user feedback
  - Monthly view: High-priority tasks now float to top within each day cell
  - Weekly view: Restructured to show category rows × day columns (like grid view)
  - Weekly view: Empty category rows hidden (only shows categories with tasks that week)
  - Daily view: Tasks grouped by category with section headers
  - Daily view: Categories without tasks for that day are hidden
- Skill file updated with CLI workflow documentation (~80 lines added)
- **Task Refinements** (2026-02-02)
  - Decorations research: Replaced single tasks with recurring series (3 rounds every 2 weeks) + purchase batches
  - Added venue coordination tasks (parking, catering questions, etc.)
  - Added Saturday morning activity captain tasks (identify + confirm)
  - Added toast/speaker management tasks (identify, ask, share guidelines)
  - Added "Share readings with confirmed readers" task
  - Added venue detail meeting review task
  - Added "Identify cleanup helpers for Sunday" task
  - Moved "Thank you cards - Design" to March (was Jan)
  - Moved various venue tasks to appropriate dates based on deadlines
  - Updated accommodation task with parallel booking note

---

## [0.5.1] - 2026-02-02

### Added
- **Bulk Task Loader Script** (scripts/bulk-add-tasks.js)
  - Console utility for adding multiple tasks at once
  - Helper functions: `addTasks()`, `listOptions()`, `createTask()`
  - Maps friendly category/timeframe names to actual UUIDs
  - Includes example `vowTasks` array for wedding vow milestones
  - Note: Only works in local-only mode; Firebase sync overwrites localStorage on page load
  - Future: In-app import UI planned (see TODO.md)
- **Password Gate** (src/components/PasswordGate.tsx)
  - Simple shared password protection via VITE_APP_PASSWORD env var
  - No user profiles - just one shared password for the couple
  - Session persists until browser closes (uses sessionStorage)
  - If env var is empty/missing, app loads normally without gate
- **Phase 12: Deployment to Vercel**
  - Production URL: https://wedding-planner-lake.vercel.app
  - Firebase Firestore configured for real-time sync
  - Environment variables configured in Vercel dashboard
  - vercel.json added for SPA routing configuration
- **ConfirmModal Component** (src/components/ConfirmModal.tsx)
  - Reusable confirmation dialog replacing native `confirm()` calls
  - Keyboard accessible: ESC to cancel, focus management
  - ARIA attributes for screen readers (`role="alertdialog"`, `aria-modal`)
  - Danger/warning style variants using wedding color palette

### Changed
- **Faster Initial Load** - Reduced seed data from ~1,600 tasks to ~90 (5 per category)
  - New users still get representative sample across all categories
  - Significantly faster initial render and Firebase sync
- **Drag and Drop UX Improvements**
  - Reduced activation distance from 8px to 5px for faster drag response
  - Changed collision detection from `closestCenter` to `pointerWithin` for intuitive drop zones
  - Enlarged drag handle hit area with padding and hover feedback
- TaskDetailPanel, CategoryRow, TimeframeHeader now use ConfirmModal for delete confirmations
- `clearFilters` in Board.tsx wrapped in `useCallback` for performance
- Debounce delay extracted to `FIREBASE_DEBOUNCE_MS` constant in useBoard.tsx

### Fixed
- **Firebase Sync Not Working in Production** - Tasks now sync across browsers/devices
  - Root cause: Firebase env vars were not configured in Vercel dashboard
  - `.env.local` is gitignored, so Vercel deployments had no Firebase config
  - App was silently running in "Local only" mode (localStorage per browser)
- **Password Gate Not Showing in Production** - Password prompt now appears as expected
  - Root cause: `VITE_APP_PASSWORD` env var missing from Vercel + Vite tree-shaking
  - When env var was undefined at build time, bundler removed "dead" password form code
  - Fix required: adding env var to Vercel AND forcing fresh build (cleared build cache)
- **App Crash on Missing Checklist** - App no longer crashes if task.checklist is undefined
  - TaskCard.tsx: Changed `task.checklist.length` to `(task.checklist?.length ?? 0)`
  - utils.ts: `getChecklistProgress()` now handles undefined checklist input
- **Data Corruption on Load** - Added defensive defaults when loading from Firebase/localStorage
  - firebase.ts: `convertTimestamps()` now ensures all required properties exist
  - useBoard.tsx: `loadFromStorage()` now ensures all required properties exist
  - Timeframes/categories get fallback names if missing
  - Tasks get default values for checklist, notes, status, assignee, priority
- **Task Detail Panel Layout** - Grid no longer hidden when panel opens
  - Panel now appears on right side (per spec) instead of replacing grid
  - Changed layout from vertical `flex-col` to horizontal `flex` container
  - Grid takes remaining space, panel has fixed 384px width
- **Drag and Drop Not Working** - Tasks can now be dragged between cells
  - Added missing `sensors` configuration to DndContext (@dnd-kit requirement)
  - Added `PointerSensor` with distance activation constraint

### Security
- **CSV Formula Injection Fix** - CSV export now sanitizes formula injection chars
  - Prefixes values starting with `=`, `+`, `-`, `@`, tab, or CR with single quote
  - Prevents formula execution when opening exported CSV in Excel/Sheets
- Removed hardcoded credentials from seedData.ts

## [0.5.0] - 2026-02-01

### Added
- **Hide/Show Timeframe Columns**
  - Hide button (eye-off icon) in timeframe header hover menu
  - Hidden columns indicator showing "X hidden" with restore button
  - Click "X hidden" to show all hidden columns at once
  - Hidden state persists across sessions (saved with board data)
  - Tasks in hidden columns are preserved, only view is hidden

### Fixed
- **Horizontal Scroll** - Grid now scrolls horizontally to show all timeframe columns
  - Fixed `overflow-hidden` on parent containers blocking scroll
  - Changed to `min-h-0` / `min-w-0` to allow flex containers to scroll
  - Category column stays sticky (pinned left) while scrolling horizontally
  - Header row stays sticky (pinned top) while scrolling vertically
- **Category Column Transparency** - Sticky column now has solid background
  - Changed from translucent `bg-[#637569]/5` to solid `bg-[#E8EDEB]`
  - Category header uses solid `bg-[#DFE5E2]`
  - Prevents content showing through when scrolling horizontally
- **Scroll Container Height** - Fixed scrollbar and sticky header issues
  - Changed App.tsx from `min-h-screen` to `h-screen` to constrain to viewport
  - Horizontal scrollbar now visible at viewport bottom (not content bottom)
  - Sticky header row stays pinned when scrolling vertically
- **Timeframe Header Transparency** - Header row now has solid backgrounds
  - TimeframeHeader: `bg-[#637569]/10` → `bg-[#DFE5E2]`
  - AddTimeframeButton: `bg-[#637569]/5` → `bg-[#E8EDEB]`
  - Prevents content showing through sticky header when scrolling vertically

### Changed
- Timeframe type now includes optional `hidden?: boolean` field
- Board.tsx uses `visibleTimeframes` for rendering, `sortedTimeframes` for data
- CategoryRow accepts `hiddenColumnCount` prop for proper colspan calculations

## [0.4.0] - 2026-02-01

### Added
- **Export to CSV Feature**
  - Export button in Header next to Add Task button
  - Downloads all tasks as CSV file with columns: Title, Category, Timeframe, Status, Assignee, Priority, Due Date, Notes, Checklist
  - Proper escaping for commas, quotes, and newlines in values
  - File named `wedding-planner-YYYY-MM-DD.csv`
  - `exportBoardToCSV()` utility function in utils.ts

### Changed
- **Visual Refresh with Wedding Color Palette**
  - Dark Green (#29564F): Primary buttons, header title, completed status
  - Eucalyptus (#637569): Grid headers, category backgrounds, secondary elements
  - Cedar Rose (#AF7A76): Bride assignee color
  - Paprika (#9E4C26): In-progress status, groom assignee (now Eucalyptus)
  - Terracotta (#9A3F3C): High priority flag, due soon dates
  - Burgundy (#861930): Overdue dates, delete buttons, errors
- Updated all components to use new color palette:
  - Header.tsx: Title, buttons, sync status, form focus states
  - Board.tsx: Grid header, loading spinner
  - TaskCard.tsx: Status dots, priority flag, due date colors
  - TaskDetailPanel.tsx: Status/assignee/priority toggles, form focus states
  - TimeframeHeader.tsx, CategoryRow.tsx: Header backgrounds, hover states
  - AddTaskModal.tsx, AddTimeframeButton.tsx, AddCategoryButton.tsx: Button colors
  - DroppableCell.tsx: Drag-over highlight color
  - ErrorBoundary.tsx: Try Again button color
- CSS custom properties added to index.css for palette consistency

### Fixed
- ErrorBoundary now uses centralized `logError()` instead of `console.error`
- Added missing `aria-label` to close button in AddTaskModal
- AddTimeframeButton plus button now uses `aria-label` instead of `title` attribute

## [0.3.0] - 2026-02-01

### Added
- **Phase 11: Polish & Edge Cases Complete**
- ErrorBoundary component (src/components/ErrorBoundary.tsx)
  - Catches render errors and shows recovery UI
  - "Try Again" button resets error state
  - Wraps entire app in App.tsx
- Loading spinner in Board component
  - Animated CSS spinner replaces plain "Loading..." text
  - Styled error state when board fails to load
- Empty state handling
  - Welcome message when no categories/timeframes exist
  - "No tasks match filters" banner with clear button
- Keyboard accessibility improvements
  - All icon buttons now have aria-labels
  - Status dot in TaskCard is now a proper button element
  - Keyboard support (Enter/Space) for status cycling
  - Filter dropdowns have aria-labels
  - Collapse buttons have aria-expanded state

### Changed
- Board.tsx loading/error states now use centered flex layout with spinner
- TaskCard status indicator changed from div to button element
- Main content area uses flex-col to accommodate banner messages

### Fixed
- Status dot now properly focusable and keyboard-accessible
- Screen readers can now announce button purposes

## [0.2.0] - 2026-02-01

### Added
- **Phase 10: Filtering Complete**
- Filter controls in Header (src/components/Header.tsx)
  - Status dropdown: All Statuses / Not Started / In Progress / Completed
  - Assignee dropdown: All Assignees / Not Assigned / Bride / Groom / Both / Other
  - "Hide completed" checkbox toggle
  - "Clear filters" link (shown only when filters are active)
  - Task count display "X of Y tasks" (shown only when filtering)
- Filter state management in Board (src/components/Board.tsx)
  - Local `filters` state with `FilterState` type
  - `filteredTasks` useMemo for efficient filtering
  - Filters combine with AND logic (all conditions must match)
- CategoryRow now receives pre-filtered tasks

### Changed
- Header component now accepts `filters`, `onFiltersChange`, and `taskCount` props
- Board passes filteredTasks to CategoryRow instead of all tasks

## [0.1.1] - 2026-02-01

### Added
- **Phase 9: Drag and Drop Complete**
- DroppableCell component (src/components/DroppableCell.tsx)
  - Wraps table cells with @dnd-kit useDroppable hook
  - ID format: "categoryId:timeframeId" for drop target identification
  - Visual feedback: light blue background when dragging over
- TaskCard drag support (src/components/TaskCard.tsx)
  - useDraggable hook from @dnd-kit/core
  - Grip handle activates drag (prevents accidental drags)
  - Reduced opacity while dragging
  - Transform applied for smooth drag animation
- Board DndContext integration (src/components/Board.tsx)
  - DndContext wrapper with closestCenter collision detection
  - DragOverlay shows card preview following cursor
  - handleDragStart/handleDragEnd manage drag state
  - moveTask action called on successful drop
- CategoryRow uses DroppableCell for each cell
  - Enables dropping tasks into any non-collapsed cell

### Changed
- TaskCard grip icon now wrapped in div with drag listeners
- Added quick-add button to cells with existing tasks (smaller variant)

## [0.1.0] - 2026-02-01

### Added
- **Phase 8: Checklists/Subtasks Complete**
- Interactive checklist section in TaskDetailPanel (src/components/TaskDetailPanel.tsx)
  - Collapsible section with ChevronRight/ChevronDown toggle
  - Shows progress count in header (e.g., "Checklist (2/5)")
  - Each item has checkbox to toggle completion
  - Completed items shown with strike-through styling
  - Delete button (trash icon) appears on hover for each item
  - Text input at bottom to add new items (press Enter to submit)
  - Auto-saves all changes via existing useBoard actions

## [0.0.9] - 2026-02-01

### Fixed
- **Firebase Optional Mode** - App no longer crashes when Firebase env vars are missing
  - Firebase initialization is now conditional based on config availability
  - App gracefully falls back to local-only mode using localStorage
  - Sync status shows "Local only" when Firebase is not configured
- **Date Timezone Bug** - Due dates no longer shift when saved
  - Fixed `formatDateForInput()` to use local date components instead of `toISOString()` (which converts to UTC)
  - Dates now round-trip correctly regardless of user's timezone
- **Inline Edit Staleness** - Category/timeframe edit fields now show current value
  - `editValue` is now reset to current name when entering edit mode
  - Fixes issue where stale value appeared if name was changed externally (e.g., from another tab)
- **Add Task Button Empty State** - Button now disabled when no categories/timeframes exist
  - Prevents opening modal with empty dropdowns
  - Shows helpful tooltip explaining the requirement

### Changed
- Documentation cleanup
  - Removed password gate references from `.env.example` and `CLAUDE.md` (feature not implemented)
  - Clarified in `ARCHITECTURE.md` that DroppableCell.tsx is planned for Phase 9
  - Updated env var documentation to note Firebase is optional

## [0.0.8] - 2026-02-01

### Added
- **Code Review Fixes: Error Handling & State Management**
- Centralized error handler module (src/lib/errorHandler.ts)
  - `logError()` function for structured error logging
  - Supports operation context and optional metadata
  - Prepared for future monitoring service integration

### Changed
- Firebase module improvements (src/lib/firebase.ts)
  - Added environment variable validation before Firebase initialization
  - Helpful error message when Firebase config is missing
  - Added try-catch error handling to `getBoard()` and `saveBoard()`
  - `subscribeToBoard()` now accepts optional error callback
  - All errors now logged through centralized `logError()`
- useBoard hook improvements (src/hooks/useBoard.tsx)
  - Replaced raw `console.error` calls with `logError()`
  - Fixed debounce timer cleanup on unmount using useRef
  - Passes error callback to `subscribeToBoard()` for proper error handling
- Board component cleanup (src/components/Board.tsx)
  - Removed duplicate `selectedTaskId` useState (now uses context state)
  - Uses `selectedTaskId` and `selectTask` from useBoard context
  - Added useMemo for sorted categories and timeframes

### Fixed
- Memory leak: debounce timer now properly cleared on component unmount
- Potential "state update on unmounted component" warning eliminated

## [0.0.7] - 2026-02-01

### Added
- **Phase 7: Task CRUD Complete**
- AddTaskModal component (src/components/AddTaskModal.tsx)
  - Modal dialog for creating new tasks
  - Title input field (required)
  - Category dropdown (pre-filled from quick-add or first available)
  - Timeframe dropdown (pre-filled from quick-add or first available)
  - ESC key closes modal
  - Backdrop click closes modal
  - Uses inner AddTaskForm component for clean state reset
- "+ Add Task" button in Header
- Quick-add button (+) in empty grid cells
  - Pre-fills category and timeframe from clicked cell
- Status cycling on TaskCard
  - Click status dot to cycle: not_started → in_progress → completed
  - Visual hover ring feedback on status dot

### Changed
- Header component now accepts onAddTask prop
- Header now rendered inside Board component (moved from App.tsx)
- TaskCard accepts onStatusCycle prop for status dot click
- CategoryRow accepts onQuickAdd and onStatusCycle props
- Board component manages modal state and quick-add targets

## [0.0.6] - 2026-01-31

### Added
- **Phase 6: Task Detail Panel Complete**
- TaskDetailPanel component (src/components/TaskDetailPanel.tsx)
  - Slide-out panel from right side (384px width)
  - Category name displayed as read-only header
  - Editable title with inline styling
  - Large prominent notes textarea (notes-first design)
  - Status toggle buttons with color coding
  - Assignee toggle buttons (—/Bride/Groom/Both/Other)
  - Priority toggle buttons (Normal/High)
  - Timeframe dropdown to move tasks between columns
  - Due date picker with Clear button
  - Auto-save on every field change (no save button)
  - Delete task button with confirmation dialog
  - ESC key to close panel
  - Checklist section placeholder for Phase 8

### Changed
- TaskCard component now accepts onDoubleClick prop
- CategoryRow passes onTaskSelect callback to TaskCard
- Board component manages selectedTaskId state and renders panel

## [0.0.5] - 2026-01-31

### Added
- **Phase 5: Task Cards (Display) Complete**
- TaskCard component (src/components/TaskCard.tsx)
  - Status dot with color coding (gray/blue/green for not started/in progress/completed)
  - Assignee badge with color (pink Bride, blue Groom, purple Both, gray Other)
  - Priority flag (amber) for high priority tasks
  - Notes preview showing first line, truncated
  - Due date display with conditional styling (red if overdue, amber if due within 7 days)
  - Checklist progress indicator (e.g., "2/5")
  - Grip icon for visual drag handle (actual DnD coming in Phase 9)
  - Completed tasks styled with reduced opacity

### Changed
- CategoryRow component now uses TaskCard instead of inline task rendering

## [0.0.4] - 2026-01-31

### Added
- **Phase 3: Timeframe Management Complete**
- TimeframeHeader component (src/components/TimeframeHeader.tsx)
  - Inline editing: click name to edit, Enter saves, Escape cancels
  - Hover reveals action buttons (← → ✕)
  - Arrow buttons to reorder columns (disabled at edges)
  - Delete with confirmation if tasks exist in timeframe
- AddTimeframeButton component (src/components/AddTimeframeButton.tsx)
  - "+" button in last column header
  - Auto-suggests next month name based on last timeframe
  - Inline input for new timeframe name
- **Phase 4: Category Management Complete**
- AddCategoryButton component (src/components/AddCategoryButton.tsx)
  - "+ Add Category" button row at bottom of table
  - Inline input for new category name
- Enhanced CategoryRow component
  - Chevron toggle (▶/▼) for collapse/expand
  - Collapsed state shows "collapsed" text spanning all columns
  - Inline editing for category names
  - Delete button on hover with confirmation
  - Task count display
- Updated Board component
  - Integrated TimeframeHeader for column headers
  - Integrated AddTimeframeButton for adding timeframes
  - Integrated AddCategoryButton for adding categories
  - Local collapse state tracking for categories
  - Timeframe reordering via order swapping

### Changed
- ARCHITECTURE.md: Updated React version from 18 to 19

## [0.0.3] - 2026-01-31

### Added
- **Phase 2: Basic Grid Layout Complete**
- CategoryRow component
  - Extracted from Board.tsx into dedicated component
  - Displays category name with task count: "Venue (3)"
  - Renders cells for each timeframe
  - Sticky first column stays visible during horizontal scroll
- Improved Board component layout
  - Removed stats bar (not in spec)
  - Sticky header row for timeframe column names
  - Sticky category column with z-index layering
  - Fixed column widths (180px min for proper display)
  - Placeholder column for Phase 3 timeframe add button
  - Placeholder row for Phase 4 category add button
- Task display in cells
  - Simple card styling with rounded borders
  - Completed tasks shown with gray background and muted text
  - Empty cells show "—" placeholder
  - Hover effects on task cards

## [0.0.2] - 2026-01-31

### Added
- **Phase 1: Core Data Layer Complete**
- Central state management system
  - useBoard.tsx: BoardProvider context + useBoard hook
  - Full CRUD operations for tasks, categories, timeframes
  - Checklist item management
- Dual persistence layer
  - localStorage for offline-first experience
  - Firebase Firestore with debounced saves (300ms)
  - onSnapshot listener for real-time sync
- Default board creation for first-time users
  - Starter categories: Venue, Catering, General
  - Auto-generated timeframes: current month + 3 months ahead
- Sync status tracking: synced, syncing, offline, error
- Placeholder components
  - Header.tsx: Title and sync status indicator
  - Board.tsx: Basic grid layout with category rows and timeframe columns

## [0.0.1] - 2026-01-31

### Added
- **Phase 0: Project Setup Complete**
- Vite 7 + React 19 + TypeScript configuration
  - vite.config.ts with React and Tailwind plugins
  - tsconfig.json, tsconfig.app.json, tsconfig.node.json
  - eslint.config.js with React hooks and refresh rules
- Source directory structure
  - src/components/ (placeholder)
  - src/hooks/ (placeholder)
  - src/lib/ (types, constants, utils, firebase)
- Core library files
  - types.ts: Board, Category, Timeframe, Task, ChecklistItem interfaces
  - constants.ts: STATUS_COLORS, ASSIGNEE_COLORS, labels
  - utils.ts: generateId, cn, formatDate, isOverdue, isDueSoon
  - firebase.ts: Firestore init, getBoard, saveBoard, subscribeToBoard
- Entry files
  - main.tsx: React 19 createRoot
  - App.tsx: Placeholder component
  - index.css: Tailwind v4 import
  - vite-env.d.ts: Vite types
  - index.html: HTML entry point

---

## Format

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features

### Security
- Security-related changes
