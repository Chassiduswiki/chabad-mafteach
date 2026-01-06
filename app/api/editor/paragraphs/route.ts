import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

/**
 * GET /api/editor/paragraphs
 * Get all paragraphs with their statements
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const topicId = searchParams.get('topicId');

        const filter: any = {};
        if (topicId) {
            filter.topic_id = { _eq: parseInt(topicId) };
        }

        const paragraphs = await directus.request(readItems('paragraphs', {
            filter,
            fields: ['*'],
            sort: ['order_key'],
            limit: 100
        })) as any[];

        // Get statements for each paragraph
        const paragraphsWithStatements = await Promise.all(
            paragraphs.map(async (paragraph) => {
                try {
                    const statements = await directus.request(readItems('statements', {
                        filter: { paragraph_id: { _eq: paragraph.id } } as any,
                        fields: ['*', { document_id: ['title'] }],
                        sort: ['order_key']
                    })) as any[];

                    return {
                        ...paragraph,
                        statements
                    };
                } catch (error) {
                    console.error(`Failed to fetch statements for paragraph ${paragraph.id}:`, error);
                    return {
                        ...paragraph,
                        statements: []
                    };
                }
            })
        );

        return NextResponse.json({ paragraphs: paragraphsWithStatements });
    } catch (error) {
        console.error('Paragraphs fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch paragraphs' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/editor/paragraphs
 * Create a new paragraph
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();

        const { topic_id, text, order_key, document_id, metadata } = body;

        if (!topic_id || !text) {
            return NextResponse.json(
                { error: 'Topic ID and text are required' },
                { status: 400 }
            );
        }

        // Generate order_key if not provided
        const finalOrderKey = order_key || await getNextOrderKey(parseInt(topic_id));

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/paragraphs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic_id: parseInt(topic_id),
                text,
                order_key: finalOrderKey,
                document_id: document_id || null,
                metadata: metadata || {}
            })
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ paragraph: data.data, success: true });
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Paragraph creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create paragraph' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get next order key for a topic
 */
async function getNextOrderKey(topicId: number): Promise<number> {
    const directus = createClient();
    
    const existingParagraphs = await directus.request(readItems('paragraphs', {
        filter: { topic_id: { _eq: topicId } } as any,
        fields: ['order_key'],
        sort: ['-order_key'],
        limit: 1
    })) as any[];

    return existingParagraphs.length > 0 ? existingParagraphs[0].order_key + 1 : 1;
}
