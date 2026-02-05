import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768; // Matches Tailwind's md: breakpoint

/**
 * Hook to detect if the viewport is mobile-sized.
 * Uses useSyncExternalStore for efficient viewport change detection.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    // Subscribe to viewport changes
    (callback) => {
      const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    },
    // Get current value (client)
    () => window.innerWidth < MOBILE_BREAKPOINT,
    // Get server snapshot (SSR)
    () => false
  );
}
