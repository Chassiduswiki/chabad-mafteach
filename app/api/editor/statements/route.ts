import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

/**
 * GET /api/editor/statements
 * Get all statements for a content block
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const blockId = searchParams.get('blockId') || searchParams.get('paragraphId'); // Support both new and legacy params

        const filter: any = {};
        if (blockId) {
            filter.block_id = { _eq: parseInt(blockId) };
        }

        const statements = await directus.request(readItems('statements', {
            filter,
            fields: ['*', {
                block_id: ['id'],
                document_id: ['id', 'title', 'slug' as any],
                statement_topics: ['id', 'relevance_score', 'is_primary', { topic_id: ['id', 'canonical_title', 'slug'] }]
            }],
            sort: ['order_key'],
            limit: 200
        })) as any[];

        return NextResponse.json({ statements });
    } catch (error) {
        console.error('Statements fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statements' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/editor/statements
 * Create a new statement
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();

        const { block_id, paragraph_id, text, order_key, appended_text, metadata } = body;
        const blockId = block_id || paragraph_id; // Support both new and legacy params

        if (!blockId || !text) {
            return NextResponse.json(
                { error: 'Block ID and text are required' },
                { status: 400 }
            );
        }

        // Generate order_key if not provided
        const finalOrderKey = order_key || await getNextOrderKey(parseInt(blockId));

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/statements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                block_id: parseInt(blockId),
                text,
                order_key: finalOrderKey,
                appended_text: appended_text || null,
                metadata: metadata || {}
            })
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ statement: data.data, success: true });
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Statement creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create statement' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get next order key for a block
 */
async function getNextOrderKey(blockId: number): Promise<number> {
    const directus = createClient();

    const existingStatements = await directus.request(readItems('statements', {
        filter: { block_id: { _eq: blockId } } as any,
        fields: ['order_key'],
        sort: ['-order_key'],
        limit: 1
    })) as any[];

    return existingStatements.length > 0 ? existingStatements[0].order_key + 1 : 1;
}
