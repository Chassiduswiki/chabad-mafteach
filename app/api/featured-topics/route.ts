import { NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems, aggregate } from '@directus/sdk';

/**
 * GET /api/featured-topics
 * Returns 3 random published topics with citation counts
 * Task 2.13: Replace marketing cards with real topic content
 */
export async function GET() {
    try {
        // Fetch all published topics
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let topics: any[] = [];
        try {
            topics = await directus.request(
                readItems('topics' as any, {
                    filter: { is_published: { _eq: true } },
                    fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
                    limit: -1, // Get all to randomize
                } as any)
            ) as any[];
        } catch (error) {
            console.warn('Failed to fetch topics:', error);
            return NextResponse.json({ topics: [] });
        }

        // Shuffle and take 3 random topics
        const shuffled = topics.sort(() => Math.random() - 0.5);
        const selectedTopics = shuffled.slice(0, 3);

        // Fetch citation count for each topic
        const topicsWithCounts = await Promise.all(
            selectedTopics.map(async (topic) => {
                let citationCount = 0;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const result = await directus.request(
                        aggregate('topic_citations' as any, {
                            aggregate: { count: '*' },
                            query: {
                                filter: { topic: { _eq: topic.id } }
                            }
                        } as any)
                    ) as any;

                    citationCount = result?.[0]?.count || 0;
                } catch (error) {
                    console.warn(`Failed to fetch citation count for topic ${topic.id}:`, error);
                }

                return {
                    ...topic,
                    citation_count: citationCount
                };
            })
        );

        return NextResponse.json({
            topics: topicsWithCounts,
        });
    } catch (error) {
        console.error('Failed to fetch featured topics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured topics', topics: [] },
            { status: 500 }
        );
    }
}
