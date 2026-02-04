type ErrorContext = Record<string, unknown>;

/**
 * Centralized error logging utility.
 * Provides structured logging that can be extended to integrate
 * with monitoring services (Sentry, LogRocket, etc.) in the future.
 */
export function logError(
  operation: string,
  error: unknown,
  context?: ErrorContext
): void {
  const message = error instanceof Error ? error.message : String(error);

  // Structured logging (can integrate with monitoring later)
  console.error(`[${operation}]`, message, context ?? '');
}
