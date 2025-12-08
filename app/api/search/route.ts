import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ seforim: [], locations: [], topics: [] });
    }

    try {
        const [docs, topicsRaw] = await Promise.all([
            // Search seforim-style documents
            directus.request(readItems('documents', {
                filter: {
                    title: { _contains: query },
                },
                fields: ['id', 'title'],
                limit: 5,
            })),
            // Search topics using new schema fields
            directus.request(readItems('topics', {
                filter: {
                    _or: [
                        { canonical_title: { _contains: query } },
                        { description: { _contains: query } },
                    ],
                },
                fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                limit: 5,
            })),
        ]);

        const seforim = (docs as any[]).map((d) => ({
            id: d.id,
            name: d.title,
            slug: String(d.id),
        }));

        const topics = (topicsRaw as any[]).map((t) => ({
            id: t.id,
            name: t.canonical_title,
            name_hebrew: undefined,
            slug: t.slug,
            category: t.topic_type,
            definition_short: t.description,
        }));

        // locations are not implemented in the new schema yet
        const locations: any[] = [];

        return NextResponse.json({ seforim, locations, topics });
    } catch (error) {
        return handleApiError(error);
    }
}
