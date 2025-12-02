import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { Schema, Topic } from './types';
import { safe DirectusCall, directusPool } from './integration-hardening';

// Re-export types for convenience
export * from './types';

// Directus client configuration
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const directusToken = process.env.DIRECTUS_STATIC_TOKEN || 'chabad_research_static_token_2025';

console.log('Directus Config:', {
    url: directusUrl,
    tokenLength: directusToken?.length,
    tokenStart: directusToken?.substring(0, 10)
});

if (!directusToken) {
    console.error('Missing DIRECTUS_STATIC_TOKEN environment variable');
}

// Create Directus client
const directus = createDirectus<Schema>(directusUrl)
    .with(staticToken(directusToken || ''))
    .with(rest());

// Helper function to get all topics with retry logic and graceful degradation
export const getAllTopics = async (): Promise<Topic[]> => {
    return safeDirectusCall(
        () => directusPool.acquire(() =>
            directus.request(readItems('topics', {
                fields: ['id', 'name', 'slug', 'alternate_names'],
                limit: -1,
                filter: { is_published: { _eq: true } }
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

