import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems, createItem, deleteItem } from '@directus/sdk';

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

        // Fetch from unified source_links table (topic-level bibliography entries)
        const topicSources = await directus.request(readItems('source_links' as any, {
            filter: { 
                _and: [
                    { topic_id: { _eq: topicId } },
                    { statement_id: { _null: true } }
                ]
            } as any,
            fields: [
                'id',
                'relationship_type',
                'page_number',
                'verse_reference',
                'section_reference',
                'notes',
                {
                    source_id: [
                        'id',
                        'title',
                        'publication_year',
                        'external_url',
                        'external_system',
                        'citation_text',
                        {
                            author_id: ['id', 'canonical_name']
                        }
                    ]
                }
            ] as any,
            sort: ['id'] as any
        })) as any[];

        // Transform to a cleaner format
        const sources = topicSources.map(ts => ({
            id: ts.source_id?.id,
            title: ts.source_id?.title,
            author_id: ts.source_id?.author_id?.id,
            author: ts.source_id?.author_id?.canonical_name,
            publication_year: ts.source_id?.publication_year,
            external_url: ts.source_id?.external_url,
            external_system: ts.source_id?.external_system,
            citation_text: ts.source_id?.citation_text,
            // Link metadata
            link_id: ts.id,
            relationship_type: ts.relationship_type,
            page_number: ts.page_number,
            verse_reference: ts.verse_reference,
            section_reference: ts.section_reference,
            notes: ts.notes,
            is_primary: ts.notes?.includes('Primary')
        })).filter(s => s.id); // Filter out any with missing source data

        return NextResponse.json({ sources });
    } catch (error) {
        console.error('Failed to fetch topic sources:', error);
        return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const body = await request.json();
        const { source_id, relationship_type, page_number, verse_reference, section_reference, notes } = body;

        if (!source_id) {
            return NextResponse.json({ error: 'source_id is required' }, { status: 400 });
        }

        // Get the topic ID
        const topics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: slug } },
            fields: ['id'],
            limit: 1
        }));

        if (topics.length === 0) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        const topicId = topics[0].id;

        // Check if link already exists (topic-level bibliography)
        const existing = await directus.request(readItems('source_links' as any, {
            filter: {
                _and: [
                    { topic_id: { _eq: topicId } },
                    { source_id: { _eq: source_id } },
                    { statement_id: { _null: true } }
                ]
            } as any,
            limit: 1
        }));

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Source already linked to this topic' }, { status: 409 });
        }

        // Create the link in unified source_links table
        const link = await directus.request(createItem('source_links' as any, {
            topic_id: topicId,
            source_id,
            statement_id: null, // Topic-level bibliography (not statement-level citation)
            relationship_type: relationship_type || 'references',
            page_number: page_number || null,
            verse_reference: verse_reference || null,
            section_reference: section_reference || null,
            notes: notes || null
        }));

        return NextResponse.json({ success: true, link });
    } catch (error) {
        console.error('Failed to link source:', error);
        return NextResponse.json({ error: 'Failed to link source' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const { searchParams } = new URL(request.url);
        const linkId = searchParams.get('link_id');
        const sourceId = searchParams.get('source_id');

        if (!linkId && !sourceId) {
            return NextResponse.json({ error: 'link_id or source_id is required' }, { status: 400 });
        }

        if (linkId) {
            // Delete by link ID directly from source_links
            await directus.request(deleteItem('source_links' as any, parseInt(linkId)));
        } else if (sourceId) {
            // Find and delete by topic + source combination
            const topics = await directus.request(readItems('topics', {
                filter: { slug: { _eq: slug } },
                fields: ['id'],
                limit: 1
            }));

            if (topics.length === 0) {
                return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
            }

            const links = await directus.request(readItems('source_links' as any, {
                filter: {
                    _and: [
                        { topic_id: { _eq: topics[0].id } },
                        { source_id: { _eq: parseInt(sourceId) } },
                        { statement_id: { _null: true } }
                    ]
                } as any,
                fields: ['id'],
                limit: 1
            }));

            if (links.length === 0) {
                return NextResponse.json({ error: 'Link not found' }, { status: 404 });
            }

            await directus.request(deleteItem('source_links' as any, links[0].id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to unlink source:', error);
        return NextResponse.json({ error: 'Failed to unlink source' }, { status: 500 });
    }
}
