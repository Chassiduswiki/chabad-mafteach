import { NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * GET /api/featured
 * Returns featured content for homepage discovery
 */
export async function GET() {
    try {
        // Fetch published topics for featured and recent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topics = await directus.request(
            readItems('topics' as any, {
                filter: { is_published: { _eq: true } },
                fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
                limit: 10,
            } as any)
        ) as any[];

        // Pick a random topic as "featured"
        const featuredTopic = topics.length > 0
            ? topics[Math.floor(Math.random() * topics.length)]
            : null;

        // Fetch recent citations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recentSources = await directus.request(
            readItems('topic_citations' as any, {
                fields: ['id', 'excerpt', 'location', 'topic'],
                deep: {
                    location: { _fields: ['display_name', 'sefer'] },
                    topic: { _fields: ['name', 'slug'] }
                },
                limit: 5,
            } as any)
        ) as any[];

        // Get recently updated topics  
        const recentTopics = topics.slice(0, 5);

        return NextResponse.json({
            featuredTopic,
            recentSources,
            recentTopics,
        });
    } catch (error) {
        console.error('Failed to fetch featured content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured content' },
            { status: 500 }
        );
    }
}
