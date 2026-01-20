import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topic_id');

        if (!topicId) {
            return NextResponse.json({ error: 'topic_id required' }, { status: 400 });
        }

        // Get all statements for this topic
        const statements = await directus.request(readItems('statement_topics', {
            filter: { topic_id: { _eq: parseInt(topicId) } },
            fields: ['statement_id'],
            limit: -1
        }));

        const stmtIds = (Array.isArray(statements) ? statements : [statements]).map(s => s.statement_id);

        if (stmtIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get source links for these statements
        const result = await directus.request(readItems('source_links', {
            filter: { statement_id: { _in: stmtIds } },
            fields: ['id', 'statement_id', 'source_id', 'relationship_type', 'confidence_level', 'notes'],
            limit: -1
        }));

        const linksArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: linksArray });
    } catch (error) {
        return handleApiError(error);
    }
}
