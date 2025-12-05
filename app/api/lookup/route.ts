import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');

    if (!term) {
        return NextResponse.json({ error: 'Term is required' }, { status: 400 });
    }

    try {
        // Quick lookup - optimized for speed
        const topics = await directus.request(readItems('topics', {
            filter: {
                _or: [
                    { name: { _eq: term } },
                    { name: { _icontains: term } },
                    { name_hebrew: { _icontains: term } }
                ]
            },
            fields: ['id', 'name', 'name_hebrew', 'slug', 'definition_short'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return NextResponse.json({ found: false });
        }

        const topic = topics[0];

        return NextResponse.json({
            found: true,
            term: topic.name,
            hebrew: topic.name_hebrew,
            quickDefinition: topic.definition_short || '',
            fullDefinition: topic.definition_short || '',
            slug: topic.slug
        });
    } catch (error) {
        return handleApiError(error);
    }
}
