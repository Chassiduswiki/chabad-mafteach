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

        // Fetch related sources from topic_citations junction table
        const citations = await directus.request(readItems('topic_citations', {
            filter: { topic: { _eq: topic.id } },
            // @ts-ignore
            fields: [
                '*',
                'location.id',
                'location.reference_text',
                'location.reference_hebrew',
                'location.full_path',
                'location.sefer.id',
                'location.sefer.title',
                'location.sefer.title_hebrew',
                'location.sefer.author'
            ] as any,
            sort: ['-importance', 'sort_order'] // Foundational sources first
        }));

        return NextResponse.json({
            topic,
            citations // Rich semantic data with citation_role, importance, etc.
        });
    } catch (error) {
        console.error('Topic fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic' },
            { status: 500 }
        );
    }
}
