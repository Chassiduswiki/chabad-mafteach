import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

/**
 * GET /api/editor/paragraphs
 * Get all content blocks for a topic's primary entry document
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const topicId = searchParams.get('topicId');

        if (!topicId) {
            return NextResponse.json({ paragraphs: [] });
        }

        // 1. Get documents linked to this topic (specifically 'entry' type for articles)
        const topicDocuments = await directus.request(readItems('documents', {
            filter: {
                topic: { _eq: parseInt(topicId) },
                doc_type: { _eq: 'entry' }
            } as any,
            fields: ['id', 'title'],
            limit: 1
        })) as any[];

        if (topicDocuments.length === 0) {
            // Fallback: look for ANY document linked to this topic if no 'entry' found
            const fallbackDocs = await directus.request(readItems('documents', {
                filter: { topic: { _eq: parseInt(topicId) } } as any,
                fields: ['id', 'title'],
                limit: 1
            })) as any[];

            if (fallbackDocs.length === 0) {
                return NextResponse.json({ paragraphs: [] });
            }
            topicDocuments.push(...fallbackDocs);
        }

        const docId = topicDocuments[0].id;

        // 2. Get content_blocks for this document
        const paragraphsData = await directus.request(readItems('content_blocks', {
            filter: { document_id: { _eq: docId } } as any,
            fields: ['*', { statements: ['*', { document_id: ['title'] }] }],
            sort: ['order_key'],
            limit: 100
        })) as any[];

        // Map content to text and statements for frontend compatibility
        const paragraphsWithStatements = paragraphsData.map(paragraph => ({
            ...paragraph,
            text: paragraph.content,
            statements: paragraph.statements || []
        }));

        return NextResponse.json({ paragraphs: paragraphsWithStatements });
    } catch (error) {
        console.error('Content blocks fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content blocks' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/editor/paragraphs
 * Create a new content block for a topic's primary document
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();

        const { topic_id, text, order_key, metadata, block_type = 'paragraph' } = body;

        if (!topic_id || !text) {
            return NextResponse.json(
                { error: 'Topic ID and text are required' },
                { status: 400 }
            );
        }

        // 1. Find the primary document for this topic
        const topicDocuments = await directus.request(readItems('documents', {
            filter: {
                topic: { _eq: parseInt(topic_id) },
                doc_type: { _eq: 'entry' }
            } as any,
            fields: ['id'],
            limit: 1
        })) as any[];

        let docId: number;
        if (topicDocuments.length === 0) {
            // If no document exists, we might need to create one or reject
            // For now, let's look for ANY document linked to the topic
            const fallbackDocs = await directus.request(readItems('documents', {
                filter: { topic: { _eq: parseInt(topic_id) } } as any,
                fields: ['id'],
                limit: 1
            })) as any[];

            if (fallbackDocs.length === 0) {
                // Auto-create a document for this topic
                const createDocResponse = await fetch(`${process.env.DIRECTUS_URL}/items/documents`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        topic: parseInt(topic_id),
                        title: `Entry for Topic ${topic_id}`,
                        doc_type: 'entry',
                        status: 'published'
                    })
                });

                if (createDocResponse.ok) {
                    const docData = await createDocResponse.json();
                    docId = docData.data.id;
                    console.log(`Auto-created document ${docId} for topic ${topic_id}`);
                } else {
                    return NextResponse.json(
                        { error: 'Failed to create document for topic. Cannot create content block.' },
                        { status: 500 }
                    );
                }
            } else {
                docId = fallbackDocs[0].id;
            }
        } else {
            docId = topicDocuments[0].id;
        }

        // 2. Generate order_key if not provided
        const finalOrderKey = order_key || await getNextOrderKey(docId);

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/content_blocks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                document_id: docId,
                content: text,
                order_key: finalOrderKey,
                block_type: block_type,
                metadata: metadata || {}
            })
        });

        if (response.ok) {
            const data = await response.json();
            const paragraph = {
                ...data.data,
                text: data.data.content,
                statements: []
            };
            return NextResponse.json({ paragraph, success: true });
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Content block creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create content block' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get next order key for a document
 */
async function getNextOrderKey(documentId: number): Promise<number> {
    const directus = createClient();

    const existingBlocks = await directus.request(readItems('content_blocks', {
        filter: { document_id: { _eq: documentId } } as any,
        fields: ['order_key'],
        sort: ['-order_key'],
        limit: 1
    })) as any[];

    return existingBlocks.length > 0 ? existingBlocks[0].order_key + 1 : 1;
}
