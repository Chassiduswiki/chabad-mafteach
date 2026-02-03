'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

/**
 * Hook for responsive design - detects if a media query matches
 * Uses useSyncExternalStore for proper SSR handling
 *
 * @param query - CSS media query string (e.g., '(min-width: 1024px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
    // Use useSyncExternalStore for safe hydration
    const subscribe = (callback: () => void) => {
        if (typeof window === 'undefined') return () => {};

        const mediaQuery = window.matchMedia(query);

        // Add listener (use modern API with fallback)
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', callback);
        } else {
            mediaQuery.addListener(callback);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', callback);
            } else {
                mediaQuery.removeListener(callback);
            }
        };
    };

    const getSnapshot = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    };

    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Common breakpoints as convenience hooks
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
    return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)');
}

export default useMediaQuery;
