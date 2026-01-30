/**
 * Application Configuration
 * Centralized configuration for all hardcoded values
 */

export const SEARCH_CONFIG = {
  // Rate limiting
  RATE_LIMIT_PER_MINUTE: 100,
  SEARCH_RATE_LIMIT: 20, // per minute per IP
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  
  // Embedding service
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 512,
  MAX_TOKENS_PER_REQUEST: 8192,
  MAX_BATCH_SIZE: 10,
  BATCH_DELAY_MS: 6000, // 6 seconds between batches
  
  // Cache settings
  CACHE_TTL: {
    SEARCH: 5 * 60 * 1000, // 5 minutes
    EMBEDDINGS: 24 * 60 * 60 * 1000, // 24 hours
    SIMILAR_TOPICS: 10 * 60 * 1000, // 10 minutes
    SUGGESTIONS: 2 * 60 * 1000, // 2 minutes
    POPULAR: 30 * 60 * 1000, // 30 minutes
  },
  
  // Cache limits
  MAX_CACHE_SIZE: 1000, // maximum number of entries
  MAX_MEMORY_SIZE_MB: 50, // 50MB limit
  
  // Search settings
  DEFAULT_SEMANTIC_WEIGHT: 0.6,
  DEFAULT_DEBOUNCE_MS: 300,
  MAX_QUERY_LENGTH: 200,
  MIN_QUERY_LENGTH: 1,
  SEARCH_RESULTS_LIMIT: 20,
  
  // Similar topics
  SIMILAR_TOPICS_LIMIT: 3,
  SIMILARITY_THRESHOLD: 0.75,
  
  // Analytics
  MAX_METRICS: 1000, // maximum analytics entries
  ANALYTICS_RETENTION_MINUTES: 60,
  
  // Popular queries for cache warming
  POPULAR_QUERIES: [
    'bitul',
    'emunah', 
    'ratzon',
    'taanug',
    'humility',
    'faith',
    'will',
    'pleasure',
    'god',
    'torah',
    'mitzvot',
    'teshuvah'
  ],
  
  // API endpoints
  API_ENDPOINTS: {
    SEARCH: '/api/search',
    SEARCH_SEMANTIC: '/api/search/semantic',
    TOPICS: '/api/topics',
  },
  
  // UI settings
  LOADING_STATES: {
    MIN_DISPLAY_TIME: 500, // minimum time to show loading
    SKELETON_ITEMS: 3,
  },
  
  // Error handling
  ERROR_RETRIES: {
    DEFAULT: 3,
    SEARCH: 2,
    CACHE_WARMING: 1,
  },
  
  RETRY_DELAYS: {
    BASE: 1000, // 1 second
    MAX: 5000, // 5 seconds
  },
} as const;

export const UI_CONFIG = {
  // Colors and themes
  COLORS: {
    PRIMARY: 'hsl(var(--primary))',
    MUTED: 'hsl(var(--muted))',
    DESTRUCTIVE: 'hsl(var(--destructive))',
  },
  
  // Spacing
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
  },
  
  // Breakpoints
  BREAKPOINTS: {
    MOBILE: '640px',
    TABLET: '768px',
    DESKTOP: '1024px',
  },
  
  // Animations
  ANIMATIONS: {
    DURATION: {
      FAST: '150ms',
      NORMAL: '300ms',
      SLOW: '500ms',
    },
    EASING: {
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
} as const;

export const ENVIRONMENT_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Feature flags
  FEATURES: {
    SEMANTIC_SEARCH: process.env.ENABLE_SEMANTIC_SEARCH !== 'false',
    CACHE_WARMING: process.env.ENABLE_CACHE_WARMING !== 'false',
    ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
    ERROR_BOUNDARIES: process.env.ENABLE_ERROR_BOUNDARIES !== 'false',
  },
  
  // External services
  SERVICES: {
    SENTRY_DSN: process.env.SENTRY_DSN,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    DIRECTUS_URL: process.env.DIRECTUS_URL,
    DIRECTUS_STATIC_TOKEN: process.env.DIRECTUS_STATIC_TOKEN,
  },
} as const;

// Validation helpers
export function validateConfig(): void {
  const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'DIRECTUS_URL',
    'DIRECTUS_STATIC_TOKEN',
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate numeric ranges
  if (SEARCH_CONFIG.MAX_BATCH_SIZE < 1 || SEARCH_CONFIG.MAX_BATCH_SIZE > 50) {
    throw new Error('MAX_BATCH_SIZE must be between 1 and 50');
  }
  
  if (SEARCH_CONFIG.BATCH_DELAY_MS < 1000 || SEARCH_CONFIG.BATCH_DELAY_MS > 30000) {
    throw new Error('BATCH_DELAY_MS must be between 1000 and 30000');
  }
  
  if (SEARCH_CONFIG.DEFAULT_SEMANTIC_WEIGHT < 0 || SEARCH_CONFIG.DEFAULT_SEMANTIC_WEIGHT > 1) {
    throw new Error('DEFAULT_SEMANTIC_WEIGHT must be between 0 and 1');
  }
}

// Export configuration getter with validation
export function getConfig() {
  if (ENVIRONMENT_CONFIG.isDevelopment) {
    validateConfig();
  }
  
  return {
    SEARCH: SEARCH_CONFIG,
    UI: UI_CONFIG,
    ENV: ENVIRONMENT_CONFIG,
  };
}

// Type-safe configuration exports
export type SearchConfig = typeof SEARCH_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type EnvironmentConfig = typeof ENVIRONMENT_CONFIG;
