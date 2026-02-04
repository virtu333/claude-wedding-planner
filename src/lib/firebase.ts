import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, type Unsubscribe, type Firestore } from 'firebase/firestore';
import type { Board, Timeframe } from './types';
import { logError } from './errorHandler';
import { backfillTimeframeDates } from './timeframeUtils';

// Required environment variables for Firebase
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/**
 * Check if all required Firebase config environment variables are set
 */
function checkFirebaseConfig(): boolean {
  return requiredEnvVars.every((key) => !!import.meta.env[key]);
}

// Check if Firebase is configured
export const isFirebaseConfigured = checkFirebaseConfig();

// Firebase configuration from environment variables (only used if configured)
const firebaseConfig = isFirebaseConfigured
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : null;

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured && firebaseConfig) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// Board document reference (single document approach)
const BOARD_COLLECTION = 'boards';
const BOARD_DOC_ID = 'main';

/**
 * Get the board document reference
 */
function getBoardRef() {
  if (!db) return null;
  return doc(db, BOARD_COLLECTION, BOARD_DOC_ID);
}

/**
 * Fetch the board from Firestore
 * Returns null if Firebase is not configured
 */
export async function getBoard(): Promise<Board | null> {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  try {
    const boardRef = getBoardRef();
    if (!boardRef) return null;

    const snapshot = await getDoc(boardRef);

    if (!snapshot.exists()) {
      return null;
    }

    return convertTimestamps(snapshot.data() as Board);
  } catch (error) {
    logError('getBoard', error);
    return null;
  }
}

/**
 * Save the board to Firestore
 * No-op if Firebase is not configured
 */
export async function saveBoard(board: Board): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const boardRef = getBoardRef();
    if (!boardRef) return;

    await setDoc(boardRef, board);
  } catch (error) {
    logError('saveBoard', error);
    throw error; // Re-throw so callers can handle
  }
}

/**
 * Subscribe to real-time board updates
 * Returns a no-op unsubscribe if Firebase is not configured
 */
export function subscribeToBoard(
  callback: (board: Board | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    // Return a no-op unsubscribe function
    return () => {};
  }

  const boardRef = getBoardRef();
  if (!boardRef) {
    return () => {};
  }

  return onSnapshot(
    boardRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(convertTimestamps(snapshot.data() as Board));
    },
    (error) => {
      logError('subscribeToBoard', error);
      onError?.(error);
    }
  );
}

/**
 * Convert Firestore timestamps to JavaScript Dates and ensure all required properties exist
 */
function convertTimestamps(board: Board): Board {
  // Ensure timeframes have required properties (preserve date metadata)
  const timeframes = (board.timeframes || []).map((tf: Timeframe) => ({
    ...tf,
    name: tf.name || `Timeframe ${tf.order ?? 0}`,
    order: tf.order ?? 0,
    // Preserve date metadata fields (strings, no conversion needed)
    startDate: tf.startDate,
    endDate: tf.endDate,
  }));

  // Auto-backfill date metadata for timeframes that lack it
  const backfilledTimeframes = backfillTimeframeDates(timeframes);

  return {
    ...board,
    timeframes: backfilledTimeframes,
    // Ensure categories have required properties
    categories: (board.categories || []).map((cat) => ({
      ...cat,
      name: cat.name || `Category ${cat.order ?? 0}`,
      order: cat.order ?? 0,
    })),
    createdAt: toDate(board.createdAt),
    updatedAt: toDate(board.updatedAt),
    tasks: (board.tasks || []).map((task) => ({
      ...task,
      checklist: task.checklist ?? [],
      notes: task.notes ?? '',
      status: task.status || 'not_started',
      assignee: task.assignee || 'unassigned',
      priority: task.priority || 'normal',
      createdAt: toDate(task.createdAt),
      updatedAt: toDate(task.updatedAt),
      dueDate: task.dueDate ? toDate(task.dueDate) : null,
    })),
  };
}

/**
 * Convert a value to a Date (handles Firestore Timestamps)
 */
function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  // Handle Firestore Timestamp
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Handle serialized date string
  if (typeof value === 'string') {
    return new Date(value);
  }
  return new Date();
}
