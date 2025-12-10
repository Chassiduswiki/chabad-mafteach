import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Schema, Topic } from './types';
import { safeDirectusCall, directusPool } from './integration-hardening';

// Re-export types for convenience
export * from './types';

// Directus client configuration
// Use NEXT_PUBLIC_ prefix for client-side access, fall back to server-side vars
// Directus client configuration
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
// SECURITY: Only use the server-side static token. Never expose admin tokens to the client.
const directusToken = process.env.DIRECTUS_STATIC_TOKEN;

if (!directusUrl) {
    throw new Error('DIRECTUS_URL environment variable is not set.');
}

// In client-side bundles, directusToken will be undefined if it's not prefixed with NEXT_PUBLIC_.
// We allow this file to be imported in client components (for types), but the client instance 
// creation should be safe or throw if actually used.

const createClient = () => {
    // If we're on the client and trying to use a token that doesn't exist, we should probably warn or allow public access if intended.
    // However, this specific client is configured with staticToken(), which implies privileged access.

    if (typeof window !== 'undefined' && !directusToken) {
        // We are on the client and have no token.
        // Return a client without a token (public access only) or throw?
        // Given the previous code enforced a token, we should probably handle this carefully.
        // But the user's specific complaint is about EXPOSING the token.
        // So we just remove the NEXT_PUBLIC_ check.

        // Return a public-only client if no token is available (e.g. client-side)
        return createDirectus<Schema>(directusUrl).with(rest());
    }

    if (!directusToken) {
        throw new Error('DIRECTUS_STATIC_TOKEN is not set. This token is required for server-side operations.');
    }

    return createDirectus<Schema>(directusUrl)
        .with(staticToken(directusToken))
        .with(rest());
};

const directus = createClient();

// Helper function to get all topics with retry logic and graceful degradation
export const getAllTopics = async (): Promise<Topic[]> => {
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
