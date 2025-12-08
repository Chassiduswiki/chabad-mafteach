import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        // First get the topic ID
        const topics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: slug } },
            fields: ['id'],
            limit: 1
        }));

        if (topics.length === 0) {
            return NextResponse.json({ sources: [] });
        }

        const topicId = topics[0].id;

        // Fetch statement_topics with expanded statement data
        let statementTopics: any[] = [];
        try {
            statementTopics = await directus.request(readItems('statement_topics', {
                filter: { topic_id: { _eq: topicId } } as any,
                fields: ['*', { statement_id: ['id', 'text', 'order_key'] }] as any,
                sort: ['-relevance_score'] as any
            })) as any[];
        } catch (error) {
            console.warn('Failed to fetch statement_topics:', error);
        }

        return NextResponse.json({ sources: statementTopics });
    } catch (error) {
        console.error('Failed to fetch topic sources:', error);
        return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
    }
}
