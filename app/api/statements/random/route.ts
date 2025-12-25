import { NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const dynamic = 'force-dynamic';

/**
 * GET /api/statements/random
 * Returns a random statement for the Zen Explore experience.
 * 
 * Response:
 * {
 *   id: number,
 *   text: string,
 *   translated_text?: string,
 *   source: {
 *     document_title: string,
 *     document_id: number,
 *     paragraph_order?: string
 *   }
 * }
 */
export async function GET() {
    try {
        const directus = createClient();

        // Get total count of statements
        const allStatements = await directus.request(readItems('statements', {
            fields: ['id'],
            limit: -1
        }));

        const total = Array.isArray(allStatements) ? allStatements.length : 0;

        if (total === 0) {
            return NextResponse.json({ error: 'No statements available' }, { status: 404 });
        }

        // Get a random offset
        const randomOffset = Math.floor(Math.random() * total);

        // Fetch one statement at that offset
        const statements = await directus.request(readItems('statements', {
            fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
            limit: 1,
            offset: randomOffset
        }));

        if (!statements || statements.length === 0) {
            return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
        }

        const statement = statements[0] as any;

        // Try to get the source document info
        let source = {
            document_title: 'Unknown Source',
            document_id: 0,
            paragraph_order: statement.order_key
        };

        if (statement.block_id) {
            try {
                // Get the content block
                const blocks = await directus.request(readItems('content_blocks' as any, {
                    filter: { id: { _eq: statement.block_id } },
                    fields: ['id', 'document_id', 'order_key'],
                    limit: 1
                }));

                if (blocks && blocks.length > 0) {
                    const block = blocks[0] as any;

                    // Get the document
                    if (block.document_id) {
                        const docs = await directus.request(readItems('documents', {
                            filter: { id: { _eq: block.document_id } },
                            fields: ['id', 'title'],
                            limit: 1
                        }));

                        if (docs && docs.length > 0) {
                            source = {
                                document_title: (docs[0] as any).title || 'Unknown Source',
                                document_id: block.document_id,
                                paragraph_order: block.order_key || statement.order_key
                            };
                        }
                    }
                }
            } catch (sourceError) {
                console.warn('Failed to fetch source info:', sourceError);
            }
        }

        return NextResponse.json({
            id: statement.id,
            text: statement.text,
            translated_text: statement.appended_text || null,
            source
        });

    } catch (error) {
        console.error('Error fetching random statement:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statement' },
            { status: 500 }
        );
    }
}
