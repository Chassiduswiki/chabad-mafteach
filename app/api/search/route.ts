import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ seforim: [], locations: [], topics: [] });
    }

    try {
        const [seforim, locations, topics] = await Promise.all([
            // Search seforim
            directus.request(readItems('seforim', {
                filter: {
                    _or: [
                        { title: { _contains: query } },
                        { author: { _contains: query } }
                    ]
                },
                fields: ['id', 'title', 'author'],
                limit: 5
            })),
            // Search locations
            directus.request(readItems('locations', {
                filter: {
                    display_name: { _contains: query }
                },
                fields: ['id', 'display_name', 'sefer'],
                limit: 5
            })),
            // Search topics
            directus.request(readItems('topics', {
                filter: {
                    _or: [
                        { name: { _contains: query } },
                        { definition_short: { _contains: query } },
                        { name_hebrew: { _contains: query } }
                    ]
                },
                fields: ['id', 'name', 'name_hebrew', 'slug', 'definition_short'],
                limit: 5
            }))
        ]);

        return NextResponse.json({ seforim, locations, topics });
    } catch (error) {
        console.error('Search error details:', error);
        // @ts-ignore
        if (error.errors) {
            // @ts-ignore
            console.error('Directus errors:', JSON.stringify(error.errors, null, 2));
        }
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
