# Architecture

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 19 | Industry standard, good ecosystem |
| Language | TypeScript | Type safety, better DX |
| Build Tool | Vite | Fast dev server, simple config |
| Styling | Tailwind CSS | Rapid styling, consistent design |
| Database | Firebase Firestore | Real-time sync, serverless |
| Drag & Drop | @dnd-kit/core | Modern, accessible, React-native |
| Icons | Lucide React | Clean, consistent icon set |
| Hosting | Vercel | Easy deployment, good DX |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                   │
│                    (Static Hosting)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      App.tsx                              │   │
│  │                   (BoardProvider)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐         │
│     ▼                        ▼                        ▼         │
│  ┌──────────┐         ┌───────────┐          ┌──────────────┐   │
│  │  Header  │         │   Board   │          │ TaskDetail   │   │
│  │(filters) │         │  (grid)   │          │   Panel      │   │
│  └──────────┘         └───────────┘          └──────────────┘   │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    ▼                   ▼                        │
│             ┌────────────┐      ┌───────────┐                   │
│             │CategoryRow │      │ TaskCard  │                   │
│             └────────────┘      └───────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    useBoard Hook                          │   │
│  │              (Central State Management)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     localStorage        │    │   Firebase Firestore    │
│   (Offline Fallback)    │    │    (Real-time Sync)     │
└─────────────────────────┘    └─────────────────────────┘
```

## State Management

### Approach: React Context + useReducer

Single source of truth for board state, provided via context.

```typescript
// Simplified structure
const BoardContext = createContext<BoardContextType | null>(null);

interface BoardContextType {
  board: Board | null;
  loading: boolean;
  isOnline: boolean;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addCategory: (name: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  addTimeframe: (name: string) => void;
  updateTimeframe: (id: string, updates: Partial<Timeframe>) => void;
  deleteTimeframe: (id: string) => void;
  reorderTimeframe: (id: string, newOrder: number) => void;
  
  moveTask: (taskId: string, newCategoryId: string, newTimeframeId: string) => void;
}
```

### Data Flow

1. **Initialization:**
   - Check for Firebase config
   - If available: Subscribe to Firestore document
   - If not: Load from localStorage

2. **User Action:**
   - Component calls action (e.g., `updateTask`)
   - Action updates local state immediately (optimistic)
   - Effect persists to localStorage AND Firestore

3. **Sync from Firebase:**
   - `onSnapshot` listener receives update
   - State updates if remote data is newer
   - UI re-renders

4. **Offline Handling:**
   - If Firebase unavailable, localStorage is primary
   - Sync indicator shows "Local only"

## Firebase Data Structure

Single document approach for simplicity:

```
firestore/
└── boards/
    └── {boardId}/
        ├── name: string
        ├── categories: Category[]
        ├── timeframes: Timeframe[]
        ├── tasks: Task[]
        ├── createdAt: Timestamp
        └── updatedAt: Timestamp
```

### Why Single Document?

- Simpler queries (one read/write)
- Atomic updates
- Easier offline sync
- Wedding planner data is small enough (<1MB limit is fine)

### Trade-offs

- No partial updates (entire board saved each time)
- Potential for conflicts with simultaneous edits
- Accepted for v1; can split into subcollections later if needed

## Component Responsibilities

### App.tsx
- Wraps app in BoardProvider
- Simple routing if needed (currently single page)

### Header.tsx
- App title and sync status
- Filter controls (status, assignee, hide completed)
- Add Task / Add Category buttons

### Board.tsx
- Main grid layout (table)
- Manages DnD context
- Renders category rows and timeframe columns
- Handles column header interactions (add/edit/delete timeframes)

### CategoryRow.tsx
- Single category row
- Collapse/expand toggle
- Category name (editable)
- Contains DroppableCells for each timeframe

### DroppableCell.tsx
- Wrapper for table cells
- Registers as DnD drop target via @dnd-kit useDroppable
- ID format: "categoryId:timeframeId" (parsed on drop)
- Visual feedback: blue highlight when dragging over

### TaskCard.tsx
- Compact card in grid
- Displays status, assignee, priority indicators
- Draggable
- Double-click to open detail

### TaskDetailPanel.tsx
- Slide-out panel (right side)
- Notes-first layout
- All task fields editable
- Checklist management
- Delete task

### AddTaskModal.tsx
- Simple modal for quick task creation
- Category and timeframe dropdowns
- Minimal fields

### AddCategoryButton.tsx
- Inline button row at bottom of table
- Expands to text input on click

### ErrorBoundary.tsx
- React class component error boundary
- Catches render errors, shows recovery UI
- Wraps entire app in App.tsx

### ConfirmModal.tsx
- Reusable confirmation dialog component
- Replaces native `confirm()` for accessible, styled dialogs
- Used by TaskDetailPanel, CategoryRow, TimeframeHeader for delete confirmations

## File Structure

```
src/
├── components/
│   ├── Board.tsx
│   ├── Header.tsx
│   ├── CategoryRow.tsx
│   ├── TimeframeHeader.tsx
│   ├── AddCategoryButton.tsx
│   ├── AddTimeframeButton.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetailPanel.tsx
│   ├── AddTaskModal.tsx
│   ├── DroppableCell.tsx
│   ├── ErrorBoundary.tsx
│   ├── ConfirmModal.tsx
│   ├── PasswordGate.tsx
│   ├── BottomSheet.tsx       # Mobile bottom sheet container
│   ├── FilterModal.tsx       # Mobile filter controls
│   ├── views/               # View mode components
│   │   ├── GridView.tsx
│   │   ├── CalendarContainer.tsx
│   │   ├── MonthlyView.tsx
│   │   ├── WeeklyView.tsx
│   │   ├── DailyView.tsx
│   │   ├── MobileListView.tsx # Mobile timeframe accordion
│   │   └── UnscheduledSidebar.tsx
│   └── calendar/
│       └── CalendarNavigation.tsx
├── hooks/
│   ├── useBoard.tsx          # Context provider + hook
│   └── useIsMobile.ts        # Viewport detection (<768px)
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── constants.ts          # Status/assignee colors, labels
│   ├── utils.ts              # generateId, cn, etc.
│   ├── firebase.ts           # Firebase init & operations
│   ├── calendarUtils.ts      # Date helpers for calendar views
│   ├── timeframeUtils.ts     # Date-to-timeframe mapping (auto-sync)
│   └── errorHandler.ts       # Centralized error logging
├── App.tsx
├── main.tsx
└── index.css                 # Tailwind imports
```

## Key Libraries

### @dnd-kit/core

Chosen over react-beautiful-dnd because:
- Still actively maintained
- Better accessibility
- More flexible API
- Smaller bundle

Usage pattern:
```tsx
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={tasks}>
    {tasks.map(task => (
      <TaskCard key={task.id} task={task} />
    ))}
  </SortableContext>
</DndContext>
```

### Tailwind CSS

Utility-first styling. Key patterns:
- Use `cn()` utility for conditional classes
- Consistent spacing scale
- Color palette defined in config

## Error Handling

### React Error Boundary
- ErrorBoundary.tsx wraps entire app
- Catches render errors, shows "Try Again" button
- Prevents white screen of death

### Firebase Errors
- Catch and log via errorHandler.ts
- Fall back to localStorage
- Show sync indicator as "Local only"

### User Errors
- Validation before save
- Clear error messages in UI
- Prevent data loss (confirm before delete)

## Mobile Architecture

### Viewport Detection
- `useIsMobile` hook uses `useSyncExternalStore` with `matchMedia`
- Breakpoint: 768px (matches Tailwind's `md:`)
- Reactively updates when viewport crosses threshold

### View Modes
- ViewMode type: `'grid' | 'monthly' | 'weekly' | 'daily' | 'list'`
- Auto-switches to `'list'` on mobile (first load, no saved preference)
- Preference persisted to localStorage (`wedding-planner-view-mode`)
- Manual override available via view toggle

### Mobile Components
- **MobileListView**: Timeframe accordions with task lists
- **BottomSheet**: Slide-up container with swipe-to-close
- **FilterModal**: Bottom sheet filter controls
- **Header**: Responsive layout (`isMobile` prop)
- **TaskDetailPanel**: `variant` prop (`'panel'` | `'sheet'`)

### Touch Optimizations
- 56px minimum row height (Apple HIG touch target)
- Large status dot tap targets (40x40px)
- Swipe gestures for bottom sheet close
- iOS safe area padding (`.safe-bottom` class)

## Performance Considerations

### Current Approach (v1)
- Keep it simple
- Entire board re-renders on change (acceptable for small data)
- No virtualization (wedding data is small)

### Future Optimizations (if needed)
- Memoize components with React.memo
- Split Firestore into subcollections for partial updates
- Virtualize grid for very long category lists

## Testing Strategy (Future)

Not implemented for v1, but planned:
- Unit tests for utility functions
- Integration tests for useBoard hook
- E2E tests for critical flows (add task, move task, sync)
