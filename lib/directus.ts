import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Schema, Topic } from './types';
import { safeDirectusCall, directusPool } from './integration-hardening';

// Re-export types for convenience
export * from './types';

// Directus client configuration
// Use NEXT_PUBLIC_ prefix for client-side access, fall back to server-side vars
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
const directusToken = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN;

if (!directusUrl || !directusToken) {
    throw new Error('DIRECTUS_URL or DIRECTUS_STATIC_TOKEN environment variable is not set. Please configure .env file.');
}

console.log('Directus Config:', {
    url: directusUrl,
    tokenLength: directusToken?.length,
    tokenStart: directusToken?.substring(0, 10)
});

// Create Directus client with required token
const directus = createDirectus<Schema>(directusUrl)
    .with(staticToken(directusToken))
    .with(rest());

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

export default directus;
