import { RefObject } from 'react';

export interface Position {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface PositionOptions {
    maxWidth?: number;
    maxHeight?: number;
    offset?: { x?: number; y?: number };
    padding?: number;
    preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    viewportPadding?: number;
}

/**
 * Calculates the optimal position for a popup to ensure it stays within the viewport.
 * 
 * @param triggerPosition The coordinates of the trigger event or element
 * @param popupDimensions The width and height of the popup element
 * @param options Configuration options for positioning
 * @returns The calculated top and left coordinates
 */
export function calculatePopupPosition(
    triggerPosition: Position,
    popupDimensions: Dimensions = { width: 320, height: 200 }, // Default fallback
    options: PositionOptions = {}
): { left: number; top: number; placement: string } {
    const {
        maxWidth = 320,
        maxHeight = 400,
        offset = { x: 0, y: 10 },
        viewportPadding = 16,
        preferredPlacement = 'auto'
    } = options;

    // Use provided dimensions or fallback to max values
    const width = popupDimensions.width || maxWidth;
    const height = popupDimensions.height || maxHeight;

    // Get viewport dimensions (safe check for SSR)
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    let left = triggerPosition.x + (offset.x || 0);
    let top = triggerPosition.y + (offset.y || 0);
    let placement = 'bottom';

    // Horizontal positioning (prevent overflow right)
    if (left + width > viewportWidth - viewportPadding) {
        left = viewportWidth - width - viewportPadding;
    }

    // Horizontal positioning (prevent overflow left)
    if (left < viewportPadding) {
        left = viewportPadding;
    }

    // Vertical positioning
    // If preferred placement is top, or if auto and bottom overflows
    const fitsBelow = top + height <= viewportHeight - viewportPadding;
    const fitsAbove = triggerPosition.y - height - (offset.y || 0) >= viewportPadding;

    if (preferredPlacement === 'top' || (!fitsBelow && fitsAbove)) {
        // Position above
        top = triggerPosition.y - height - (offset.y || 0);
        placement = 'top';
    } else {
        // Position below (default)
        placement = 'bottom';
    }

    return { left, top, placement };
}

/**
 * Hook-compatible helper to get dimensions from a ref
 */
export function getElementDimensions(ref: RefObject<HTMLElement>): Dimensions | null {
    if (!ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}
