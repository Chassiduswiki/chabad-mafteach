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

        // Get source_links for this topic
        const links = await directus.request(readItems('source_links', {
            filter: { 
                statement_id: {
                    _in: {
                        _table: 'statements',
                        _on: {
                            statement_topics: {
                                topic_id: { _eq: parseInt(topicId) }
                            }
                        }
                    }
                }
            },
            fields: ['source_id'],
            limit: -1
        }));

        const sourceIds = (Array.isArray(links) ? links : [links])
            .map(l => l.source_id)
            .filter((id, idx, arr) => arr.indexOf(id) === idx)
            .filter((id): id is number => id !== undefined); // unique and filter undefined

        if (sourceIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get sources
        const result = await directus.request(readItems('sources', {
            filter: { id: { _in: sourceIds } } as any,
            fields: ['id', 'title', 'external_system', 'external_url', 'metadata'],
            limit: -1
        }));

        const sourcesArray = Array.isArray(result) ? result : result ? [result] : [];

        return NextResponse.json({ data: sourcesArray });
    } catch (error) {
        return handleApiError(error);
    }
}
