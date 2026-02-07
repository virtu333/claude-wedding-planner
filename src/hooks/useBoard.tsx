import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { Board, Task, Category, Timeframe, ChecklistItem } from '../lib/types';
import { generateId } from '../lib/utils';
import { findTimeframeForDate, createTimeframeForDate, backfillTimeframeDates } from '../lib/timeframeUtils';
import { subscribeToBoard, saveBoard, isFirebaseConfigured } from '../lib/firebase';
import { logError } from '../lib/errorHandler';
import { createSeedBoard } from '../lib/seedData';

// localStorage key
const STORAGE_KEY = 'wedding-planner-board';

// Debounce delay for Firebase saves (ms)
const FIREBASE_DEBOUNCE_MS = 300;

// Sync status type
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

// State interface
interface BoardState {
  board: Board | null;
  loading: boolean;
  syncStatus: SyncStatus;
  selectedTaskId: string | null;
}

// Action types
type BoardAction =
  | { type: 'SET_BOARD'; payload: Board | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'UPDATE_BOARD'; payload: Board };

// Context type
interface BoardContextType extends BoardState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, categoryId: string, timeframeId: string) => void;

  // Category actions
  addCategory: (name: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Timeframe actions
  addTimeframe: (name: string) => void;
  updateTimeframe: (id: string, updates: Partial<Timeframe>) => void;
  deleteTimeframe: (id: string) => void;
  reorderTimeframes: (timeframes: Timeframe[]) => void;

  // Checklist actions
  addChecklistItem: (taskId: string, title: string) => void;
  updateChecklistItem: (taskId: string, itemId: string, updates: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (taskId: string, itemId: string) => void;

  // UI actions
  selectTask: (taskId: string | null) => void;
}

// Create context
const BoardContext = createContext<BoardContextType | null>(null);

// Reducer
function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_BOARD':
      return { ...state, board: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_SELECTED_TASK':
      return { ...state, selectedTaskId: action.payload };
    case 'UPDATE_BOARD':
      return { ...state, board: action.payload };
    default:
      return state;
  }
}

// Create default board for first-time users with pre-populated wedding planning data
function createDefaultBoard(): Board {
  return createSeedBoard();
}

// Load board from localStorage with defensive defaults for all properties
function loadFromStorage(): Board | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects and ensure all required properties exist
    // Preserve date metadata on timeframes
    const timeframes = (parsed.timeframes || []).map((tf: Timeframe) => ({
      ...tf,
      name: tf.name || `Timeframe ${tf.order ?? 0}`,
      order: tf.order ?? 0,
      startDate: tf.startDate,
      endDate: tf.endDate,
    }));

    // Auto-backfill date metadata for timeframes that lack it
    const backfilledTimeframes = backfillTimeframeDates(timeframes);

    return {
      ...parsed,
      timeframes: backfilledTimeframes,
      // Ensure categories have required properties
      categories: (parsed.categories || []).map((cat: Category) => ({
        ...cat,
        name: cat.name || `Category ${cat.order ?? 0}`,
        order: cat.order ?? 0,
      })),
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      tasks: (parsed.tasks || []).map((task: Task) => ({
        ...task,
        checklist: task.checklist ?? [],
        notes: task.notes ?? '',
        status: task.status || 'not_started',
        assignee: task.assignee || 'unassigned',
        priority: task.priority || 'normal',
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })),
    };
  } catch (error) {
    logError('loadFromStorage', error);
    return null;
  }
}

// Save board to localStorage
function saveToStorage(board: Board): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (error) {
    logError('saveToStorage', error);
  }
}

// BoardProvider component
export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, {
    board: null,
    loading: true,
    syncStatus: 'syncing',
    selectedTaskId: null,
  });

  // Ref to track debounce timer for cleanup
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced Firebase save (only when Firebase is configured)
  const debouncedFirebaseSave = useCallback((board: Board) => {
    if (!isFirebaseConfigured) {
      // No Firebase - stay in offline mode, no need to sync
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
      saveBoard(board)
        .then(() => {
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
        })
        .catch((error) => {
          logError('saveToFirebase', error);
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
        });
    }, FIREBASE_DEBOUNCE_MS);
  }, []);

  // Helper to update board and persist
  const updateBoard = useCallback(
    (newBoard: Board) => {
      const boardWithTimestamp = {
        ...newBoard,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_BOARD', payload: boardWithTimestamp });
      saveToStorage(boardWithTimestamp);
      debouncedFirebaseSave(boardWithTimestamp);
    },
    [debouncedFirebaseSave]
  );

  // Initialize: subscribe to Firebase or fall back to localStorage
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isFirstLoad = true;

    // If Firebase is not configured, run in local-only mode
    if (!isFirebaseConfigured) {
      const localBoard = loadFromStorage();
      const board = localBoard || createDefaultBoard();
      dispatch({ type: 'SET_BOARD', payload: board });
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
      dispatch({ type: 'SET_LOADING', payload: false });
      saveToStorage(board);
      return;
    }

    const handleError = (error: Error) => {
      logError('subscribeToBoard', error);
      // Fall back to localStorage on error
      const localBoard = loadFromStorage();
      const board = localBoard || createDefaultBoard();
      dispatch({ type: 'SET_BOARD', payload: board });
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
      dispatch({ type: 'SET_LOADING', payload: false });
      saveToStorage(board);
    };

    try {
      unsubscribe = subscribeToBoard(
        (firebaseBoard) => {
          if (firebaseBoard) {
            dispatch({ type: 'SET_BOARD', payload: firebaseBoard });
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
            // Also save to localStorage as backup
            saveToStorage(firebaseBoard);
          } else if (isFirstLoad) {
            // No board in Firebase, check localStorage or create default
            const localBoard = loadFromStorage();
            const board = localBoard || createDefaultBoard();
            dispatch({ type: 'SET_BOARD', payload: board });
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
            // Save to both storages
            saveToStorage(board);
            saveBoard(board).catch((e) => logError('initialSaveBoard', e));
          }
          isFirstLoad = false;
          dispatch({ type: 'SET_LOADING', payload: false });
        },
        handleError
      );
    } catch (error) {
      logError('subscribeToBoard', error);
      // Fall back to localStorage
      const localBoard = loadFromStorage();
      const board = localBoard || createDefaultBoard();
      dispatch({ type: 'SET_BOARD', payload: board });
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
      dispatch({ type: 'SET_LOADING', payload: false });
      saveToStorage(board);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Task actions
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!state.board) return;

      const now = new Date();
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      updateBoard({
        ...state.board,
        tasks: [...state.board.tasks, newTask],
      });
    },
    [state.board, updateBoard]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      if (!state.board) return;

      const finalUpdates = { ...updates };
      let updatedTimeframes = state.board.timeframes;

      // Auto-sync timeframe when dueDate changes
      if ('dueDate' in updates && updates.dueDate) {
        const matchingTimeframeId = findTimeframeForDate(
          updates.dueDate,
          state.board.timeframes
        );

        if (matchingTimeframeId) {
          // Found existing timeframe - use it
          finalUpdates.timeframeId = matchingTimeframeId;
        } else {
          // No match - create a new monthly timeframe
          const newTimeframe = createTimeframeForDate(
            updates.dueDate,
            state.board.timeframes
          );
          updatedTimeframes = [...state.board.timeframes, newTimeframe];
          finalUpdates.timeframeId = newTimeframe.id;
        }
      }

      updateBoard({
        ...state.board,
        timeframes: updatedTimeframes,
        tasks: state.board.tasks.map((task) =>
          task.id === id ? { ...task, ...finalUpdates, updatedAt: new Date() } : task
        ),
      });
    },
    [state.board, updateBoard]
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        tasks: state.board.tasks.filter((task) => task.id !== id),
      });

      // Clear selection if deleted task was selected
      if (state.selectedTaskId === id) {
        dispatch({ type: 'SET_SELECTED_TASK', payload: null });
      }
    },
    [state.board, state.selectedTaskId, updateBoard]
  );

  const moveTask = useCallback(
    (taskId: string, categoryId: string, timeframeId: string) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        tasks: state.board.tasks.map((task) =>
          task.id === taskId
            ? { ...task, categoryId, timeframeId, updatedAt: new Date() }
            : task
        ),
      });
    },
    [state.board, updateBoard]
  );

  // Category actions
  const addCategory = useCallback(
    (name: string) => {
      if (!state.board) return;

      const maxOrder = Math.max(0, ...state.board.categories.map((c) => c.order));
      const newCategory: Category = {
        id: generateId(),
        name,
        order: maxOrder + 1,
      };

      updateBoard({
        ...state.board,
        categories: [...state.board.categories, newCategory],
      });
    },
    [state.board, updateBoard]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        categories: state.board.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
      });
    },
    [state.board, updateBoard]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        categories: state.board.categories.filter((cat) => cat.id !== id),
        // Also delete tasks in this category
        tasks: state.board.tasks.filter((task) => task.categoryId !== id),
      });
    },
    [state.board, updateBoard]
  );

  // Timeframe actions
  const addTimeframe = useCallback(
    (name: string) => {
      if (!state.board) return;

      const maxOrder = Math.max(0, ...state.board.timeframes.map((t) => t.order));
      const newTimeframe: Timeframe = {
        id: generateId(),
        name,
        order: maxOrder + 1,
      };

      updateBoard({
        ...state.board,
        timeframes: [...state.board.timeframes, newTimeframe],
      });
    },
    [state.board, updateBoard]
  );

  const updateTimeframe = useCallback(
    (id: string, updates: Partial<Timeframe>) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        timeframes: state.board.timeframes.map((tf) =>
          tf.id === id ? { ...tf, ...updates } : tf
        ),
      });
    },
    [state.board, updateBoard]
  );

  const deleteTimeframe = useCallback(
    (id: string) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        timeframes: state.board.timeframes.filter((tf) => tf.id !== id),
        // Also delete tasks in this timeframe
        tasks: state.board.tasks.filter((task) => task.timeframeId !== id),
      });
    },
    [state.board, updateBoard]
  );

  const reorderTimeframes = useCallback(
    (timeframes: Timeframe[]) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        timeframes,
      });
    },
    [state.board, updateBoard]
  );

  // Checklist actions
  const addChecklistItem = useCallback(
    (taskId: string, title: string) => {
      if (!state.board) return;

      const newItem: ChecklistItem = {
        id: generateId(),
        title,
        completed: false,
      };

      updateBoard({
        ...state.board,
        tasks: state.board.tasks.map((task) =>
          task.id === taskId
            ? { ...task, checklist: [...task.checklist, newItem], updatedAt: new Date() }
            : task
        ),
      });
    },
    [state.board, updateBoard]
  );

  const updateChecklistItem = useCallback(
    (taskId: string, itemId: string, updates: Partial<ChecklistItem>) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        tasks: state.board.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                checklist: task.checklist.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                ),
                updatedAt: new Date(),
              }
            : task
        ),
      });
    },
    [state.board, updateBoard]
  );

  const deleteChecklistItem = useCallback(
    (taskId: string, itemId: string) => {
      if (!state.board) return;

      updateBoard({
        ...state.board,
        tasks: state.board.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                checklist: task.checklist.filter((item) => item.id !== itemId),
                updatedAt: new Date(),
              }
            : task
        ),
      });
    },
    [state.board, updateBoard]
  );

  // UI actions
  const selectTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
  }, []);

  // Context value - memoized to avoid unnecessary re-renders of all consumers
  const contextValue: BoardContextType = useMemo(
    () => ({
      ...state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addCategory,
      updateCategory,
      deleteCategory,
      addTimeframe,
      updateTimeframe,
      deleteTimeframe,
      reorderTimeframes,
      addChecklistItem,
      updateChecklistItem,
      deleteChecklistItem,
      selectTask,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addCategory,
      updateCategory,
      deleteCategory,
      addTimeframe,
      updateTimeframe,
      deleteTimeframe,
      reorderTimeframes,
      addChecklistItem,
      updateChecklistItem,
      deleteChecklistItem,
      selectTask,
    ]
  );

  return <BoardContext.Provider value={contextValue}>{children}</BoardContext.Provider>;
}

// useBoard hook
export function useBoard(): BoardContextType {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
