'use client';

import { useEffect } from 'react';

interface TopicTrackerProps {
    slug: string;
    name: string;
}

/**
 * TopicTracker - Client component to track last visited topic
 * Task 2.11: Enables "Continue Learning" feature on mobile homepage
 * Stores topic slug and name in localStorage for 7 days
 */
export function TopicTracker({ slug, name }: TopicTrackerProps) {
    useEffect(() => {
        // Only track on client side
        if (typeof window === 'undefined') return;

        try {
            const data = {
                slug,
                name,
                timestamp: Date.now()
            };
            localStorage.setItem('chabad-mafteach:last-topic', JSON.stringify(data));
        } catch (error) {
            // Silently fail if localStorage is not available
            console.error('Failed to store last topic', error);
        }
    }, [slug, name]);

    // This component doesn't render anything
    return null;
}
