import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ documents: [], locations: [], topics: [] });
    }

    try {
        let docs: any[] = [];
        let topicsRaw: any[] = [];

        // Fetch documents with better search (title, author, content snippets)
        try {
            docs = await directus.request(
                readItems('documents', {
                    filter: {
                        _or: [
                            { title: { _icontains: query } },
                            { author: { _icontains: query } },
                            { category: { _icontains: query } },
                            { doc_type: { _icontains: query } }
                        ]
                    },
                    fields: ['id', 'title', 'doc_type', 'author', 'category'],
                    limit: 20, // Increase limit for better results
                    sort: ['title']
                })
            ) as any[];
        } catch (error) {
            console.warn('Search documents query failed (permissions or missing collection):', error);
            docs = [];
        }

        // Fetch topics with server-side filtering instead of client-side only
        try {
            const topicFilter: any = {};
            if (query.length > 0) {
                topicFilter._or = [
                    { canonical_title: { _icontains: query } },
                    { description: { _icontains: query } },
                    { topic_type: { _icontains: query } },
                    { slug: { _icontains: query } }
                ];
            }

            topicsRaw = await directus.request(
                readItems('topics', {
                    fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                    filter: topicFilter,
                    limit: query.length > 0 ? 50 : 10, // More results for searches, fewer for empty queries
                    sort: query.length > 0 ? [] : ['canonical_title'], // Sort by relevance when searching
                })
            ) as any[];
        } catch (error) {
            console.warn('Search topics query failed:', error);
            topicsRaw = [];
        }

        const documents = (docs || []).map((d) => ({
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

        return NextResponse.json({ documents, locations, topics });
    } catch (error) {
        return handleApiError(error);
    }
}
