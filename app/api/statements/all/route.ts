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

        // Get all paragraphs for this document first
        const paragraphs = await directus.request(readItems('paragraphs', {
            filter: { doc_id: { _eq: parseInt(docId) } },
            fields: ['id'],
            limit: -1
        }));

        const paraIds = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map(p => p.id);

        if (paraIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get all statements for these paragraphs
        const result = await directus.request(readItems('statements', {
            filter: { 
                paragraph_id: { _in: paraIds } as any
            } as any,
            fields: ['id', 'text', 'importance_score', 'paragraph_id', 'metadata', 'status'],
            sort: ['-importance_score'],
            limit: -1
        }));

        const stmtsArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: stmtsArray });
    } catch (error) {
        return handleApiError(error);
    }
}
