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

        const result = await directus.request(readItems('content_blocks', {
            filter: { document_id: { _eq: parseInt(docId) } } as any,
            fields: ['id', 'order_key', 'content', 'block_type', 'metadata', 'document_id'] as any,
            sort: ['order_key'],
            limit: -1
        }));

        const blocksArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: blocksArray });
    } catch (error) {
        return handleApiError(error);
    }
}
