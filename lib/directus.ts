import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Schema, Topic } from './types';
import { safeDirectusCall, directusPool } from './integration-hardening';

// Re-export types for convenience
export * from './types';

// Directus client configuration
// Use NEXT_PUBLIC_ prefix for client-side access, fall back to server-side vars
const getDirectusUrl = () => {
    if (typeof window !== 'undefined') {
        return '/api/directus-proxy';  // Use proxy for client-side requests
    }
    return process.env.DIRECTUS_URL; // Use direct URL for server-side requests
};

// SECURITY: Only use the server-side static token. Never expose admin tokens to the client.
const getDirectusToken = () => process.env.DIRECTUS_STATIC_TOKEN;

const createClient = () => {
    const directusUrl = getDirectusUrl();
    const directusToken = getDirectusToken();

    // Validate URL
    if (!directusUrl) {
        throw new Error('DIRECTUS_URL environment variable is not set.');
    }

    // If we're on the client and trying to use a token that doesn't exist, we should probably warn or allow public access if intended.
    // However, this specific client is configured with staticToken(), which implies privileged access.

    if (typeof window !== 'undefined' && !directusToken) {
        // We are on the client and have no token.
        // Return a client without a token (public access only) for client-side requests via proxy
        return createDirectus<Schema>(directusUrl).with(rest());
    }

    if (!directusToken) {
        throw new Error('DIRECTUS_STATIC_TOKEN is not set. This token is required for server-side operations.');
    }

    return createDirectus<Schema>(directusUrl)
        .with(staticToken(directusToken))
        .with(rest());
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
    return safeDirectusCall(
        () => directusPool.acquire(() =>
            directus.request(readItems('topics', {
                fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                limit: -1,
            })) as Promise<Topic[]>
        ),
        {
            retries: 3,
            timeout: 10000,
            fallback: [], // Return empty array if all retries fail
        }
    );
};

export { createClient };
