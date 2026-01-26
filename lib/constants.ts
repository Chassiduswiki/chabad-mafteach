/**
 * Application-wide configuration constants
 * 
 * Centralizes magic numbers and hardcoded values for better maintainability.
 */

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const UI = {
    POPUP: {
        MAX_WIDTH_DESKTOP: 400,
        MAX_WIDTH_MOBILE: '90vw',
        OFFSET_Y: 10,
        ANIMATION_DURATION: 200,
    },
    TOAST: {
        DURATION: 3000,
    },
    THEME: {
        TRANSITION_DURATION: 300,
    },
    LAYOUT: {
        NAVBAR_HEIGHT: 56,
        MOBILE_BREAKPOINT: 640,
    }
} as const;

// =============================================================================
// API CONSTANTS
// =============================================================================

export const API = {
    LIMITS: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        MAX_BULK_LOAD: 500,
        FEATURED_TOPICS: 3,
        RECENT_SOURCES: 5,
        RECENT_TOPICS: 5,
        SEARCH_RESULTS: 20,
    },
    TIMEOUTS: {
        DEFAULT: 10000,
        LONG: 30000,
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000,
    }
} as const;

// =============================================================================
// CACHE TTL (Time To Live in milliseconds)
// =============================================================================

export const CACHE = {
    TTL: {
        DEFAULT: 5 * 60 * 1000,       // 5 minutes
        TOPICS: 10 * 60 * 1000,       // 10 minutes  
        DISCOVERY: 15 * 60 * 1000,    // 15 minutes
        DOCUMENTS: 30 * 60 * 1000,    // 30 minutes
        BRANDING: 60 * 1000,          // 1 minute
    },
    CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
} as const;

// =============================================================================
// RATE LIMITING & SECURITY
// =============================================================================

export const SECURITY = {
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,    // 15 minutes
        MAX_REQUESTS: 5,
    },
    ACCOUNT_LOCKOUT: {
        MAX_ATTEMPTS: 5,
        DURATION_MS: 30 * 60 * 1000,  // 30 minutes
    },
    JWT: {
        ACCESS_TOKEN_EXPIRY: '24h',
        REFRESH_TOKEN_EXPIRY: '7d',
    }
} as const;

// =============================================================================
// PERFORMANCE BUDGETS
// =============================================================================

export const PERFORMANCE = {
    TARGETS: {
        API_RESPONSE_MS: 500,
        PAGE_LOAD_MS: 3000,
        LCP_MS: 2500,
        TTI_MS: 3500,
    }
} as const;

// =============================================================================
// CONTENT TYPES
// =============================================================================

export const CONTENT = {
    TOPIC_TYPES: ['concept', 'person', 'place', 'event', 'mitzvah', 'sefirah'] as const,
    STATUSES: ['draft', 'in_review', 'published', 'archived'] as const,
    MAX_SHORT_DESCRIPTION: 200,
} as const;

export type TopicType = typeof CONTENT.TOPIC_TYPES[number];
export type ContentStatus = typeof CONTENT.STATUSES[number];

// =============================================================================
// ROUTES
// =============================================================================

export const ROUTES = {
    TOPICS: '/topics',
    SEFORIM: '/seforim',
    EXPLORE: '/explore',
    EDITOR: '/editor',
    ADMIN: '/admin',
    AUTH: '/auth/signin',
} as const;
