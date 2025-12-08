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
                    { canonical_title: { _eq: term } },
                    { canonical_title: { _icontains: term } },
                    { slug: { _icontains: term } }
                ]
            },
            fields: ['id', 'canonical_title', 'slug', 'description'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return NextResponse.json({ found: false });
        }

        const topic = topics[0];

        return NextResponse.json({
            found: true,
            term: topic.canonical_title,
            hebrew: undefined, // Not available in new schema
            quickDefinition: topic.description || '',
            fullDefinition: topic.description || '',
            slug: topic.slug
        });
    } catch (error) {
        return handleApiError(error);
    }
}
