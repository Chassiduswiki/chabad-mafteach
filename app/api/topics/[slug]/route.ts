import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Fetch the topic by slug
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: slug }
            },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topic = topics[0];

        // Fetch related statements from statement_topics junction table
        let statementTopics: any[] = [];
        try {
            statementTopics = await directus.request(readItems('statement_topics', {
                filter: { topic_id: { _eq: topic.id } } as any,
                fields: ['*', { statement_id: ['id', 'text', 'order_key'] }] as any,
                sort: ['-relevance_score'] as any
            })) as any[];
        } catch (error) {
            console.warn('Failed to fetch statement_topics:', error);
        }

        return NextResponse.json({
            topic,
            citations: statementTopics // Map to citations for backward compatibility
        });
    } catch (error) {
        console.error('Topic fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic' },
            { status: 500 }
        );
    }
}
