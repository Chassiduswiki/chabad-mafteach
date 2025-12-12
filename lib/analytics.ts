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

// ==========================================
// BILINGUAL ANALYTICS - User Behavior Tracking
// ==========================================

/**
 * Track bilingual topic interactions
 */
export function trackBilingualTopicView(
    topicId: string,
    topicName: string,
    languageUsed: 'he' | 'en' | 'transliteration',
    translationAvailable: boolean
) {
    track('bilingual_topic_view', {
        topic_id: topicId,
        topic_name: topicName,
        language_used: languageUsed,
        translation_available: translationAvailable,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Track when users switch between languages for a topic
 */
export function trackLanguageSwitch(
    topicId: string,
    fromLanguage: 'he' | 'en' | 'transliteration',
    toLanguage: 'he' | 'en' | 'transliteration',
    reason: 'accessibility' | 'preference' | 'curiosity' | 'comparison' | 'user_initiated' = 'user_initiated'
) {
    track('language_switch', {
        topic_id: topicId,
        from_language: fromLanguage,
        to_language: toLanguage,
        reason,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Track Hebrew content engagement
 */
export function trackHebrewContentEngagement(
    contentType: 'topic_description' | 'paragraph' | 'statement' | 'citation',
    contentId: string,
    action: 'view' | 'read' | 'translate_request',
    timeSpent?: number
) {
    track('hebrew_content_engagement', {
        content_type: contentType,
        content_id: contentId,
        action,
        time_spent_seconds: timeSpent,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Track translation usage and effectiveness
 */
export function trackTranslationUsage(
    contentType: 'topic' | 'paragraph' | 'statement',
    contentId: string,
    translationSource: 'human_verified' | 'human_draft' | 'machine' | 'none',
    userSatisfaction?: 1 | 2 | 3 | 4 | 5
) {
    track('translation_usage', {
        content_type: contentType,
        content_id: contentId,
        translation_source: translationSource,
        user_satisfaction: userSatisfaction,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Track accessibility barriers and language issues
 */
export function trackAccessibilityBarrier(
    barrierType: 'hebrew_readability' | 'translation_missing' | 'ui_not_translated' | 'search_limitation',
    severity: 'low' | 'medium' | 'high' | 'blocking',
    pageContext: string,
    description?: string
) {
    track('accessibility_barrier', {
        barrier_type: barrierType,
        severity,
        page_context: pageContext,
        description,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Track user language preferences and settings
 */
export function trackLanguagePreference(
    preference: 'he' | 'en' | 'auto' | 'bilingual',
    context: 'global_setting' | 'topic_view' | 'content_view',
    trigger: 'user_choice' | 'auto_detection' | 'default'
) {
    track('language_preference', {
        preference,
        context,
        trigger,
        timestamp: new Date().toISOString(),
    });
}

// ==========================================
// USER FEEDBACK & SURVEY ANALYTICS
// ==========================================

/**
 * Track translation quality feedback
 */
export function trackTranslationFeedback(
    contentType: 'topic' | 'paragraph' | 'statement',
    contentId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    aspects: {
        accuracy?: 1 | 2 | 3 | 4 | 5;
        readability?: 1 | 2 | 3 | 4 | 5;
        completeness?: 1 | 2 | 3 | 4 | 5;
    },
    feedback?: string,
    suggestedImprovement?: string
) {
    track('translation_feedback', {
        content_type: contentType,
        content_id: contentId,
        overall_rating: rating,
        aspect_ratings: aspects,
        feedback,
        suggestedImprovement,
        timestamp: new Date().toISOString(),
    } as any);
}

/**
 * Track survey responses about translation priorities
 */
export function trackTranslationSurvey(
    surveyType: 'translation_priority' | 'language_preference' | 'accessibility_needs',
    responses: Record<string, any>,
    userContext?: {
        primaryLanguage?: 'he' | 'en';
        hebrewProficiency?: 'none' | 'basic' | 'intermediate' | 'advanced' | 'native';
        usagePurpose?: 'study' | 'research' | 'casual' | 'teaching';
    }
) {
    track('translation_survey_response', {
        survey_type: surveyType,
        responses,
        user_context: userContext,
        timestamp: new Date().toISOString(),
    } as any);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Detect if text contains Hebrew characters
 */
export function detectLanguage(text: string): 'he' | 'en' | 'mixed' {
    const hebrewChars = /[\u0590-\u05FF]/g;
    const englishChars = /[a-zA-Z]/g;

    const hebrewCount = (text.match(hebrewChars) || []).length;
    const englishCount = (text.match(englishChars) || []).length;

    if (hebrewCount > englishCount * 2) return 'he';
    if (englishCount > hebrewCount * 2) return 'en';
    return 'mixed';
}

/**
 * Calculate time spent on content
 */
export function getTimeSpent(startTime: number): number {
    return Math.round((Date.now() - startTime) / 1000);
}
