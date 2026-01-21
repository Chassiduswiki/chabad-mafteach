import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('doc_id');

        if (!docId) {
            return NextResponse.json({ error: 'doc_id required' }, { status: 400 });
        }

        // Get all content_blocks for this document first
        const contentBlocks = await directus.request(readItems('content_blocks', {
            filter: { document_id: { _eq: parseInt(docId) } },
            fields: ['id'],
            limit: -1
        }));

        const blockIds = (Array.isArray(contentBlocks) ? contentBlocks : [contentBlocks]).map(b => b.id);

        if (blockIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get all statements for these content_blocks
        const result = await directus.request(readItems('statements', {
            filter: { 
                block_id: { _in: blockIds } as any
            } as any,
            fields: ['id', 'text', 'importance_score', 'block_id', 'metadata', 'status'],
            sort: ['-importance_score'],
            limit: -1
        }));

        const stmtsArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: stmtsArray });
    } catch (error) {
        return handleApiError(error);
    }
}
