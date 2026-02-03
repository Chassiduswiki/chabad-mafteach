import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Topic } from './types';

// Directus client uses untyped schema for flexibility
// Collection-specific types are defined in ./types

// Re-export types for convenience
export * from './types';

// Directus client configuration
// Use NEXT_PUBLIC_ prefix for client-side access, fall back to server-side vars
const getDirectusUrl = () => {
    if (typeof window !== 'undefined') {
        // Ensure we return an absolute URL for the SDK
        return window.location.origin + '/api/directus-proxy';
    }
    // Server-side: use DIRECTUS_URL, fallback to NEXT_PUBLIC_ if available, then localhost
    const url = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    // Remove trailing slash if present to avoid double slashes when SDK appends paths
    return url.replace(/\/$/, '');
};

const getDirectusToken = () => process.env.DIRECTUS_STATIC_TOKEN;

const createClient = (authToken?: string) => {
    const directusUrl = getDirectusUrl();

    if (typeof window !== 'undefined') {
        // Client-side: no static token, just the URL to the proxy
        return createDirectus(directusUrl).with(rest());
    } else {
        // Server-side
        // Priority: 1. Provided authToken (Acting as specific user)
        //           2. Static Token (System Admin action)
        //           3. Public/Anonymous

        const tokenToUse = authToken || getDirectusToken();

        try {
            new URL(directusUrl);
        } catch {
            console.error('[Directus Client] Invalid Server URL:', directusUrl);
            const safeUrl = 'http://localhost:8055';
            return createDirectus(safeUrl).with(rest()).with(staticToken(tokenToUse || ''));
        }

        if (!tokenToUse && process.env.NODE_ENV === 'production') {
            console.warn('No authentication token available for server-side Directus client.');
        }

        return createDirectus(directusUrl)
            .with(rest())
            .with(staticToken(tokenToUse || ''));
    }
};

// Lazy-initialized singleton for module-level usage
let _directus: ReturnType<typeof createClient> | null = null;
const getDirectusSingleton = () => {
    if (!_directus) {
        _directus = createClient();
    }
    return _directus;
};

// Helper function to get all topics with standard retry logic if needed in the future
export const getAllTopics = async (): Promise<Topic[]> => {
    const directus = getDirectusSingleton();
    try {
        const result = await directus.request(readItems('topics', {
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
            limit: -1,
        }));
        return result as Topic[];
    } catch (error) {
        console.error('[Directus] Failed to fetch topics:', error);
        return []; // Return empty array as fallback
    }
};

// Helper to generate asset URLs
// We use the direct URL instead of the proxy because the proxy currently forces JSON parsing
export const getAssetUrl = (id: string) => {
    if (!id) return '';
    const url = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    return `${url.replace(/\/$/, '')}/assets/${id}`;
};

export { createClient, getDirectusSingleton as getDirectus };
