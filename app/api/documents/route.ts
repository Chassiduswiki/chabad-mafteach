import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const docType = (searchParams.get('doc_type') || 'sefer') as 'entry' | 'sefer';

        const result = await directus.request(readItems('documents', {
            filter: { doc_type: { _eq: docType } },
            fields: ['id', 'title', 'doc_type'],
            limit: -1
        }));

        const docsArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json(docsArray);
    } catch (error) {
        return handleApiError(error);
    }
}
