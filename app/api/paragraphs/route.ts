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

        const result = await directus.request(readItems('paragraphs', {
            filter: { doc_id: { _eq: parseInt(docId) } },
            fields: ['id', 'order_key', 'text', 'status', 'metadata', 'doc_id'],
            sort: ['order_key'],
            limit: -1
        }));

        const parasArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: parasArray });
    } catch (error) {
        return handleApiError(error);
    }
}
