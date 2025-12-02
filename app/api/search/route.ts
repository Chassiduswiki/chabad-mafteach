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
            // @ts-ignore
            directus.request(readItems('seforim', {
                filter: {
                    _or: [
                        { title: { _contains: query } },
                        { title_hebrew: { _contains: query } },
                        { title_transliteration: { _contains: query } }
                    ]
                },
                fields: ['id', 'title', 'title_hebrew'],
                limit: 5
            })),
            // Search locations
            // @ts-ignore
            directus.request(readItems('locations', {
                filter: {
                    display_name: { _contains: query }
                },
                fields: ['id', 'display_name', 'sefer'],
                limit: 5
            })),
            // Search topics - comprehensive search across all content fields
            // @ts-ignore
            directus.request(readItems('topics', {
                filter: {
                    _or: [
                        { name: { _contains: query } },
                        { name_hebrew: { _contains: query } },
                        { name_transliteration: { _contains: query } },
                        { definition_short: { _contains: query } },
                        { overview: { _contains: query } },
                        { article: { _contains: query } },
                        { definition_positive: { _contains: query } },
                        { definition_negative: { _contains: query } },
                        { historical_context: { _contains: query } }
                    ]
                },
                fields: ['id', 'name', 'name_hebrew', 'name_transliteration', 'slug', 'definition_short', 'category'],
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
