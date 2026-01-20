import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topic_id');
        const docType = (searchParams.get('doc_type') || 'sefer') as 'entry' | 'sefer';

        const filter: any = { doc_type: { _eq: docType } };
        if (topicId) {
            filter.topic = { _eq: parseInt(topicId) };
        }

        const result = await directus.request(readItems('documents', {
            filter,
            fields: ['id', 'title', 'doc_type', 'topic', 'status', 'metadata'],
            limit: -1
        }));

        const docsArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: docsArray });
    } catch (error) {
        return handleApiError(error);
    }
}
