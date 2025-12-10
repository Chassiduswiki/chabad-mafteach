import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

// Input validation utilities
const validateLimit = (limit: string | null): number => {
    const parsed = parseInt(limit || '10', 10);
    return isNaN(parsed) || parsed < 1 || parsed > 100 ? 10 : parsed;
};

const validateMode = (mode: string | null): string | null => {
    const validModes = ['discovery', 'featured'];
    return mode && validModes.includes(mode) ? mode : null;
};

const validateCategory = (category: string | null): string | null => {
    const validCategories = ['avodah', 'emunah', 'theology', 'kabbalah', 'halacha', 'people', 'places', 'events'];
    return category && validCategories.includes(category) ? category : null;
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = validateMode(searchParams.get('mode'));
    const category = validateCategory(searchParams.get('category'));
    const limit = validateLimit(searchParams.get('limit'));

    try {
        // MODE: DISCOVERY (Composite data for homepage)
        if (mode === 'discovery') {
            // New schema: topics have canonical_title, topic_type, description.
            // We map them into the legacy Topic shape expected by the UI
            // (name, category, definition_short).

            let rawTopics: any[] = [];
            try {
                rawTopics = await directus.request(
                    readItems('topics', {
                        fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                        limit: 50,
                    })
                ) as any[];
            } catch (error) {
                console.warn('Failed to fetch topics for discovery:', error);
            }

            const topics = rawTopics.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.canonical_title,
                name_hebrew: null,
                category: t.topic_type,
                definition_short: t.description,
            }));

            const featuredTopic = topics.length > 0
                ? topics[Math.floor(Math.random() * topics.length)]
                : null;

            const recentTopics = topics.slice(0, 5);

            // We no longer have topic_citations / locations in the new schema,
            // so for now expose an empty recentSources array to keep the UI happy.
            const recentSources: any[] = [];

            return NextResponse.json({
                featuredTopic,
                recentSources,
                recentTopics,
            });
        }

        // MODE: FEATURED (Random topics with citation counts)
        if (mode === 'featured') {
            // Fetch all topics and map to legacy shape
            const rawTopics = await directus.request(
                readItems('topics', {
                    fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                    limit: -1,
                })
            ) as any[];

            const allTopics = rawTopics.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: t.canonical_title,
                name_hebrew: null,
                category: t.topic_type,
                definition_short: t.description,
            }));

            const shuffled = allTopics.sort(() => Math.random() - 0.5);
            const selectedTopics = shuffled.slice(0, limit || 3);

            // We no longer have topic_citations; expose citation_count = 0 for now.
            const topicsWithCounts = selectedTopics.map((topic) => ({
                ...topic,
                citation_count: 0,
            }));

            return NextResponse.json({ topics: topicsWithCounts });
        }

        // DEFAULT: List topics
        const filter: any = category ? { topic_type: { _eq: category } } : {};

        const rawTopics = await directus.request(readItems('topics', {
            filter,
            sort: ['canonical_title'],
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
            limit: limit === -1 ? undefined : limit
        }));

        const topics = (rawTopics as any[]).map((t) => ({
            id: t.id,
            slug: t.slug,
            name: t.canonical_title,
            name_hebrew: null,
            category: t.topic_type,
            definition_short: t.description,
        }));

        return NextResponse.json({ topics });

    } catch (error) {
        return handleApiError(error);
    }
}
