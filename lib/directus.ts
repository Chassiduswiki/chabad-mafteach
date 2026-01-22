import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Topic } from './types';
import { safeDirectusCall, directusPool } from './integration-hardening';

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

const createClient = () => {
    const directusUrl = getDirectusUrl();

    if (typeof window !== 'undefined') {
        // Client-side: no token, just the URL to the proxy
        try {
            // Verify it's a valid URL before passing to SDK
            new URL(directusUrl);
            return createDirectus(directusUrl).with(rest());
        } catch (e) {
            console.error('[Directus Client] Invalid Client URL:', directusUrl);
            // Fallback to absolute URL if proxy construction failed
            const fallback = window.location.origin + '/api/directus-proxy';
            return createDirectus(fallback).with(rest());
        }
    } else {
        // Server-side: use static token
        const directusToken = getDirectusToken();

        try {
            new URL(directusUrl);
        } catch (e) {
            console.error('[Directus Client] Invalid Server URL:', directusUrl);
            // Use a safe fallback
            const safeUrl = 'http://localhost:8055';
            return createDirectus(safeUrl).with(rest()).with(staticToken(directusToken || ''));
        }

        if (!directusToken && process.env.NODE_ENV === 'production') {
            console.warn('DIRECTUS_STATIC_TOKEN is not set for server-side operations in production.');
        }

        return createDirectus(directusUrl)
            .with(rest())
            .with(staticToken(directusToken || ''));
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

// Helper function to get all topics with retry logic and graceful degradation
export const getAllTopics = async (): Promise<Topic[]> => {
    const directus = getDirectusSingleton();
    const result = await safeDirectusCall(
        () => directusPool.acquire(() =>
            directus.request(readItems('topics', {
                fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                limit: -1,
            }))
        ),
        {
            retries: 3,
            timeout: 10000,
            fallback: [], // Return empty array if all retries fail
        }
    );
    return result as Topic[];
};

export { createClient, getDirectusSingleton as getDirectus };
