# Claude Code Project Instructions

## Project Overview
Wedding Planner v2 - A lightweight, collaborative wedding planning tool with a category × timeframe grid layout. React/TypeScript SPA with Firebase Firestore for real-time sync, deployed on Vercel.

**Production URL:** https://wedding-planner-lake.vercel.app

## Key Documentation Files
- `PROJECT_SPEC.md` - Complete product specification (read this first!)
- `ARCHITECTURE.md` - Technical architecture and decisions
- `TODO.md` - Phased implementation plan with checkboxes
- `CHANGELOG.md` - Track all changes made

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Database:** Firebase Firestore (real-time sync)
- **Drag & Drop:** @dnd-kit/core
- **Icons:** Lucide React
- **Hosting:** Vercel

## Project Structure (Current)
```
scripts/
├── firebase-tasks.mjs         # Firebase CLI for bulk task management
├── set-due-dates.mjs          # Basic due date generator (timeframe midpoints)
├── set-intelligent-dates.mjs  # Smart date distribution + hard deadline overrides
└── bulk-add-tasks.js          # Browser console task loader (deprecated)

skills/
└── weddingplannerskill.md     # Wedding context + CLI workflow instructions

src/
├── components/
│   ├── Board.tsx              # Main layout, view switching, modals
│   ├── CategoryRow.tsx        # Single category row (collapse/edit/delete/quick-add)
│   ├── TimeframeHeader.tsx    # Timeframe column header (edit/reorder/delete)
│   ├── AddTimeframeButton.tsx # "+" button to add timeframe columns
│   ├── AddCategoryButton.tsx  # "+ Add Category" button row
│   ├── Header.tsx             # Top bar: sync status, filters, view toggle, Add Task
│   ├── TaskCard.tsx           # Draggable task card with status cycling
│   ├── TaskDetailPanel.tsx    # Slide-out detail panel (notes-first)
│   ├── AddTaskModal.tsx       # Modal for creating new tasks
│   ├── DroppableCell.tsx      # DnD drop target wrapper for grid cells
│   ├── ErrorBoundary.tsx      # React error boundary with recovery UI
│   ├── ConfirmModal.tsx       # Reusable confirmation dialog component
│   ├── PasswordGate.tsx       # Simple password protection wrapper
│   ├── BottomSheet.tsx        # Mobile bottom sheet container (swipe-to-close)
│   ├── FilterModal.tsx        # Mobile filter controls (bottom sheet style)
│   ├── views/                 # View mode components
│   │   ├── GridView.tsx       # Original category × timeframe grid
│   │   ├── CalendarContainer.tsx # Layout wrapper for calendar views
│   │   ├── MonthlyView.tsx    # Month calendar with task dots
│   │   ├── WeeklyView.tsx     # 7-day columns, category rows
│   │   ├── DailyView.tsx      # Single day task list by category
│   │   ├── MobileListView.tsx # Timeframe accordion list for mobile
│   │   └── UnscheduledSidebar.tsx # Tasks without dueDate
│   └── calendar/
│       └── CalendarNavigation.tsx # Prev/next/today buttons
├── hooks/
│   ├── useBoard.tsx           # BoardProvider context + useBoard hook
│   └── useIsMobile.ts         # Viewport detection hook (<768px)
├── lib/
│   ├── types.ts               # TypeScript types (includes ViewMode)
│   ├── constants.ts           # Status/assignee colors and labels
│   ├── firebase.ts            # Firebase config & operations (with env validation)
│   ├── calendarUtils.ts       # Date helpers for calendar views
│   ├── timeframeUtils.ts      # Date-to-timeframe mapping for auto-sync
│   ├── errorHandler.ts        # Centralized error logging
│   └── utils.ts               # generateId, cn, formatDate, etc.
├── App.tsx
├── main.tsx
└── index.css

vercel.json              # Vercel deployment config (SPA routing)
```

## Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npx vercel --prod    # Deploy to Vercel
```

## Firebase CLI (Task Management)
```bash
node scripts/firebase-tasks.mjs list              # List all tasks by category
node scripts/firebase-tasks.mjs list-categories   # Show categories
node scripts/firebase-tasks.mjs list-timeframes   # Show timeframes
node scripts/firebase-tasks.mjs add-category "X"  # Create category
node scripts/firebase-tasks.mjs add-tasks f.json  # Import tasks from JSON
node scripts/firebase-tasks.mjs move-tasks "p" "C" # Move matching tasks
node scripts/firebase-tasks.mjs update-task "p" field value  # Update single task
node scripts/firebase-tasks.mjs bulk-update field value "p"  # Update matching tasks
node scripts/firebase-tasks.mjs export backup.json # Export board
node scripts/firebase-tasks.mjs migrate-dates     # Add date metadata to timeframes
```
Add `--dry-run` to preview changes. See `skills/weddingplannerskill.md` for full docs.

**Note:** `update-task` and `bulk-update` validate enum fields (status/assignee/priority) and reject invalid values.

## Environment Variables
Create `.env.local` with Firebase config (optional - app works without Firebase in local-only mode):
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# Optional: Simple password protection (leave empty to disable)
VITE_APP_PASSWORD=your_shared_password
```

## Key Design Decisions
1. **Notes-first task detail** - When opening a task, notes are prominent at top, other fields secondary
2. **Drag-and-drop for task movement** - Cards can be dragged between cells
3. **Timeframes as columns** - User-defined, can add/rename/reorder/delete
4. **Categories as rows** - User-defined, collapsible
5. **Simple status model** - Not Started / In Progress / Completed
6. **Assignee model** - Not Assigned / Bride / Groom / Both / Other
7. **Completed tasks** - Grayed out with toggle to hide globally
8. **Auto-sync due date → timeframe** - Setting due date auto-moves task to matching timeframe column

## Working Guidelines
1. **Read PROJECT_SPEC.md** before implementing any feature
2. **Update TODO.md** as tasks are completed
3. **Log changes in CHANGELOG.md** with dates
4. **Test locally** before deploying
5. **Keep components focused** - Single responsibility
6. **Prefer simplicity** - Don't over-engineer

## Firebase Notes
- Firebase is optional - app runs in local-only mode if env vars are missing
- Single document approach: entire board state in one Firestore document
- Real-time sync via `onSnapshot` listener
- localStorage as offline fallback
- Simple password gate via VITE_APP_PASSWORD (client-side, casual privacy only)

## Common Pitfalls to Avoid
- Don't make the task detail panel too complex (keep it light!)
- Don't add features not in PROJECT_SPEC.md without discussion
- Test drag-and-drop thoroughly - it's easy to break
- Remember to handle loading and error states
