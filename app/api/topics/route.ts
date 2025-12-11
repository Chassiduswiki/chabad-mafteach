import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

// Add translation query
const TOPIC_FIELDS = ['id', 'canonical_title', 'canonical_title_en', 'canonical_title_transliteration', 'slug', 'topic_type', 'description', 'description_en'];

// Function to fetch topics with translations (now using native Directus fields)
async function fetchTopicsWithTranslations(filter: any = {}, limit?: number) {
    const query: any = {
        fields: TOPIC_FIELDS,
        sort: ['canonical_title']
    };

    if (filter && Object.keys(filter).length > 0) {
        query.filter = filter;
    }

    if (limit && limit !== -1) {
        query.limit = limit;
    }

    try {
        const topics = await directus.request(readItems('topics', query)) as any[];
        return topics;
    } catch (error) {
        console.warn('Failed to fetch topics:', error);
        return [];
    }
}

// Helper function to get display name (English translation > transliteration > Hebrew)
function getDisplayName(topic: any): string {
    const englishName = topic.canonical_title_en;
    const transliteration = topic.canonical_title_transliteration;
    const hebrewName = topic.canonical_title;

    // Priority: English > Transliteration > Hebrew
    return englishName || transliteration || hebrewName;
}

// Helper function to get display description (English preferred, Hebrew fallback)
function getDisplayDescription(topic: any): string {
    return topic.description_en || topic.description;
}
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

            const topics = await fetchTopicsWithTranslations({}, 50);

            const processedTopics = topics.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: getDisplayName(t), // English preferred, Hebrew fallback
                name_hebrew: t.canonical_title, // Hebrew is always the original
                category: t.topic_type,
                definition_short: getDisplayDescription(t), // English preferred, Hebrew fallback
            }));

            const featuredTopic = processedTopics.length > 0
                ? processedTopics[Math.floor(Math.random() * processedTopics.length)]
                : null;

            const recentTopics = processedTopics.slice(0, 5);

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
            const rawTopics = await fetchTopicsWithTranslations();

            const allTopics = rawTopics.map((t) => ({
                id: t.id,
                slug: t.slug,
                name: getDisplayName(t), // English preferred, Hebrew fallback
                name_hebrew: t.canonical_title, // Hebrew is the original
                category: t.topic_type,
                definition_short: getDisplayDescription(t), // English preferred, Hebrew fallback
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

        const rawTopics = await fetchTopicsWithTranslations(filter, limit);

        const topics = rawTopics.map((t) => ({
            id: t.id,
            slug: t.slug,
            name: getDisplayName(t), // English preferred, Hebrew fallback
            name_hebrew: t.canonical_title, // Hebrew is the original
            category: t.topic_type,
            definition_short: getDisplayDescription(t), // English preferred, Hebrew fallback
        }));

        return NextResponse.json({ topics });

    } catch (error) {
        return handleApiError(error);
    }
}
