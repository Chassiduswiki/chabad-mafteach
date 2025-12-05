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
    }
} as const;

export const API = {
    LIMITS: {
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

export const ROUTES = {
    TOPICS: '/topics',
    SEFORIM: '/seforim',
    EXPLORE: '/explore',
} as const;
