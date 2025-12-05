import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems, aggregate } from '@directus/sdk';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode'); // 'featured' | 'discovery' | null (default list)
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        // MODE: DISCOVERY (Composite data for homepage)
        if (mode === 'discovery') {
            // 1. Fetch published topics
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let topics: any[] = [];
            try {
                topics = await directus.request(
                    readItems('topics' as any, {
                        filter: { is_published: { _eq: true } },
                        fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
                        limit: 50, // Fetch enough to randomize
                    } as any)
                ) as any[];
            } catch (error) {
                console.warn('Failed to fetch topics for discovery:', error);
            }

            // 2. Pick random featured topic
            const featuredTopic = topics.length > 0
                ? topics[Math.floor(Math.random() * topics.length)]
                : null;

            // 3. Get recently updated topics
            const recentTopics = topics.slice(0, 5);

            // 4. Fetch recent citations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let recentSources: any[] = [];
            try {
                recentSources = await directus.request(
                    readItems('topic_citations' as any, {
                        fields: ['id', 'excerpt', 'location', 'topic'],
                        deep: {
                            location: { _fields: ['display_name', 'sefer'] },
                            topic: { _fields: ['name', 'slug'] }
                        },
                        limit: 5,
                        sort: ['-date_created']
                    } as any)
                ) as any[];
            } catch (error) {
                console.warn('Failed to fetch recent sources:', error);
            }

            return NextResponse.json({
                featuredTopic,
                recentSources,
                recentTopics,
            });
        }

        // MODE: FEATURED (Random topics with citation counts)
        if (mode === 'featured') {
            // 1. Fetch all published topics
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const topics = await directus.request(
                readItems('topics' as any, {
                    filter: { is_published: { _eq: true } },
                    fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
                    limit: -1,
                } as any)
            ) as any[];

            // 2. Shuffle and take N
            const shuffled = topics.sort(() => Math.random() - 0.5);
            const selectedTopics = shuffled.slice(0, limit || 3);

            // 3. Fetch citation counts
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
                    } catch (e) {
                        console.warn(`Failed count for topic ${topic.id}`, e);
                    }
                    return { ...topic, citation_count: citationCount };
                })
            );

            return NextResponse.json({ topics: topicsWithCounts });
        }

        // DEFAULT: List topics
        const filter = category ? { category: { _eq: category as any } } : {};

        const topics = await directus.request(readItems('topics', {
            filter,
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
            limit: limit === -1 ? undefined : limit
        }));

        return NextResponse.json({ topics });

    } catch (error) {
        console.error('Topics fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }
}
