/**
 * Analytics Utility for Chabad Mafteach
 * 
 * Helper functions for tracking custom events and performance metrics
 * using Vercel Analytics.
 */

import { track } from '@vercel/analytics';

/**
 * Track when a user views a topic
 */
export function trackTopicView(topicSlug: string, topicName: string) {
    track('topic_view', {
        slug: topicSlug,
        name: topicName,
    });
}

/**
 * Track search queries
 */
export function trackSearch(query: string, resultCount: number) {
    track('search', {
        query,
        results: resultCount,
    });
}

/**
 * Track Cmd+K command menu usage
 */
export function trackCommandMenu(action: 'open' | 'close' | 'navigate', target?: string) {
    track('command_menu', {
        action,
        target,
    });
}

/**
 * Track footnote popup interactions
 */
export function trackFootnotePopup(footnoteId: string, hasMatch: boolean, confidence?: number) {
    track('footnote_popup', {
        footnoteId,
        hasMatch,
        confidence,
    });
}

/**
 * Track citation views
 */
export function trackCitationView(citationId: number, sefer: string) {
    track('citation_view', {
        citationId,
        sefer,
    });
}

/**
 * Track HebrewBooks link clicks
 */
export function trackHebrewBooksClick(seferId: number, sefer: string) {
    track('hebrewbooks_click', {
        seferId,
        sefer,
    });
}

/**
 * Track view toggle (grid/list)
 */
export function trackViewToggle(view: 'grid' | 'list', page: string) {
    track('view_toggle', {
        view,
        page,
    });
}

/**
 * Track performance metrics manually
 */
export function trackPerformance(metric: string, value: number, unit: 'ms' | 'KB' | 'score') {
    track('performance', {
        metric,
        value,
        unit,
    });
}
