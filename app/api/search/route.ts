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
        let docs: any[] = [];
        let topicsRaw: any[] = [];

        // Fetch documents, but gracefully handle permission errors (403)
        try {
            docs = await directus.request(
                readItems('documents', {
                    filter: {
                        title: { _contains: query },
                    },
                    fields: ['id', 'title', 'doc_type'],
                    limit: 5,
                })
            ) as any[];
        } catch (error) {
            console.warn('Search seforim query failed (permissions or missing collection):', error);
            docs = [];
        }

        // Fetch topics (fetch broader set and let client-side Fuse.js handle filtering)
        topicsRaw = await directus.request(
            readItems('topics', {
                fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                limit: 100, // Fetch more topics for better client-side filtering
            })
        ) as any[];

        const seforim = (docs || []).map((d) => ({
            id: d.id,
            title: d.title as string,
            doc_type: d.doc_type as string | undefined,
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
