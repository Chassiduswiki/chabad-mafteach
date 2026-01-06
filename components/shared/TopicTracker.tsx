'use client';

import { useEffect } from 'react';

interface TopicTrackerProps {
    slug: string;
    name: string;
    topicId?: number;
}

/**
 * TopicTracker - Client component to track last visited topic and send analytics
 * Task 2.11: Enables "Continue Learning" feature on mobile homepage
 * Task 15c: Tracks topic views for popularity analytics
 * Stores topic slug and name in localStorage for 7 days
 * Sends view tracking to analytics API
 */
export function TopicTracker({ slug, name, topicId }: TopicTrackerProps) {
    useEffect(() => {
        // Only track on client side
        if (typeof window === 'undefined') return;

        try {
            // Store last visited topic for "Continue Learning" feature
            const data = {
                slug,
                name,
                topicId,
                timestamp: Date.now()
            };
            localStorage.setItem('chabad-mafteach:last-topic', JSON.stringify(data));

            // Track view analytics if we have a topic ID
            if (topicId) {
                const sessionId = localStorage.getItem('chabad-mafteach:session') ||
                    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                localStorage.setItem('chabad-mafteach:session', sessionId);

                // Send tracking data to analytics API
                fetch('/api/analytics/track-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topicId,
                        sessionId
                    }),
                }).catch(error => {
                    // Silently fail analytics tracking to avoid breaking UX
                    console.error('Analytics tracking failed:', error);
                });
            }
        } catch (error) {
            // Silently fail if localStorage is not available
            console.error('Failed to store last topic or track analytics', error);
        }
    }, [slug, name, topicId]);

    // This component doesn't render anything
    return null;
}
