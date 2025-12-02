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

        // Fetch topic_citations with expanded location and sefer
        const citations = await directus.request(readItems('topic_citations', {
            filter: { topic: { _eq: topicId } },
            // @ts-ignore - Directus SDK doesn't properly type nested field expansion
            fields: [
                'id',
                'citation_role',
                'importance',
                'quoted_text',
                'quoted_text_english',
                'context_note',
                'page_reference',
                'sort_order',
                'location.id',
                'location.reference_text',
                'location.reference_hebrew',
                'location.full_path',
                'location.sefer.id',
                'location.sefer.title',
                'location.sefer.title_hebrew',
                'location.sefer.author'
            ] as any,
            sort: ['sort_order', 'importance']
        }));

        return NextResponse.json({ sources: citations });
    } catch (error) {
        console.error('Failed to fetch topic sources:', error);
        return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
    }
}
