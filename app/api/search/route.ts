import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';

// Cache key for search results
const getSearchCacheKey = (query: string) => `search:results:${query.toLowerCase().trim()}`;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ documents: [], locations: [], topics: [], statements: [] });
    }

    // Normalize query for caching
    const normalizedQuery = query.toLowerCase().trim();

    // Check cache first (cache search results for 5 minutes)
    const cacheKey = getSearchCacheKey(normalizedQuery);
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
        return NextResponse.json(cachedResult);
    }

    try {
        let docs: any[] = [];
        let topicsRaw: any[] = [];

        // Limit search to prevent performance issues
        const MAX_RESULTS_PER_TYPE = 15;
        const SEARCH_TIMEOUT = 10000; // 10 second timeout

        // Use Promise.race to prevent long-running queries
        const searchPromise = (async () => {
            // Fetch content blocks and statements in parallel for better performance
            const [contentBlocksResult, statementsResult] = await Promise.allSettled([
                // Content blocks search - optimized query
                directus.request(
                    readItems('content_blocks', {
                        filter: {
                            _and: [
                                { status: { _eq: 'published' } }, // Only search published content
                                {
                                    _or: [
                                        { content: { _icontains: normalizedQuery } },
                                        // Only search numeric fields if query is numeric
                                        ...(isNumericQuery(normalizedQuery) ? [
                                            { page_number: { _eq: normalizedQuery } }, // page_number is string
                                            { chapter_number: { _eq: parseInt(normalizedQuery) } },
                                            { halacha_number: { _eq: parseInt(normalizedQuery) } }
                                        ] : [])
                                    ].filter(Boolean)
                                }
                            ]
                        },
                        fields: ['id', 'order_key', 'content', 'page_number', 'chapter_number', 'halacha_number', 'document_id'],
                        limit: MAX_RESULTS_PER_TYPE,
                        sort: ['order_key']
                    })
                ),

                // Statements search - optimized query
                directus.request(
                    readItems('statements', {
                        filter: {
                            _and: [
                                { status: { _eq: 'published' } },
                                { is_deleted: { _neq: true } },
                                { text: { _icontains: normalizedQuery } }
                            ]
                        },
                        fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
                        limit: MAX_RESULTS_PER_TYPE,
                        sort: ['order_key']
                    })
                )
            ]);

            // Process content blocks results
            if (contentBlocksResult.status === 'fulfilled') {
                const contentBlocks = contentBlocksResult.value as any[];
                const contentBlockResults = contentBlocks.map((cb: any) => ({
                    id: `content-${cb.id}`,
                    title: `Content Block ${cb.order_key}`,
                    content_preview: cb.content?.substring(0, 150) + (cb.content?.length > 150 ? '...' : ''),
                    page_number: cb.page_number,
                    chapter_number: cb.chapter_number,
                    halacha_number: cb.halacha_number,
                    document_id: cb.document_id,
                    type: 'content_block'
                }));
                docs = docs.concat(contentBlockResults);
            }

            // Process statements results
            if (statementsResult.status === 'fulfilled') {
                const statements = statementsResult.value as any[];
                const statementResults = statements.map((stmt: any) => ({
                    id: `statement-${stmt.id}`,
                    title: stmt.text?.substring(0, 80) + (stmt.text?.length > 80 ? '...' : ''),
                    content_preview: stmt.appended_text ? `Footnote: ${stmt.appended_text.substring(0, 100)}` : '',
                    block_id: stmt.block_id,
                    type: 'statement'
                }));
                docs = docs.concat(statementResults);
            }
        })();

        // Topics search - separate query to avoid blocking
        const topicsPromise = (async () => {
            if (normalizedQuery.length > 0) {
                const topicFilter: any = {
                    _or: [
                        { canonical_title: { _icontains: normalizedQuery } },
                        { description: { _icontains: normalizedQuery } },
                        { topic_type: { _icontains: normalizedQuery } },
                        { slug: { _icontains: normalizedQuery } }
                    ]
                };

                topicsRaw = await directus.request(
                    readItems('topics', {
                        fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                        filter: topicFilter,
                        limit: normalizedQuery.length > 0 ? 50 : 10,
                    })
                ) as any[];
            }
        })();

        // Wait for both searches to complete
        await Promise.all([searchPromise, topicsPromise]);

        // Format response
        const documents = docs.filter(d => d.type === 'document' || !d.type).map((d) => ({
            id: d.id,
            title: d.title as string,
            doc_type: d.doc_type as string | undefined,
        }));

        const locations = docs.filter(d => d.type === 'content_block').map((d) => ({
            id: d.id,
            title: d.title as string,
            display_name: d.title as string,
            content_preview: d.content_preview as string,
            page_number: d.page_number as string,
            chapter_number: d.chapter_number as number,
            halacha_number: d.halacha_number as number,
            sefer: d.document_id as number,
        }));

        const statements = docs.filter(d => d.type === 'statement').map((d) => ({
            id: d.id,
            title: d.title as string,
            content_preview: d.content_preview as string,
            block_id: d.block_id as number,
        }));

        const topics = (topicsRaw as any[]).map((t) => ({
            id: t.id,
            name: t.canonical_title,
            name_hebrew: undefined,
            slug: t.slug,
            category: t.topic_type,
            definition_short: t.description,
        }));

        const result = { documents, locations, topics, statements };

        // Cache results for 5 minutes
        cache.set(cacheKey, result, 5 * 60 * 1000);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// Helper function to check if query looks numeric
function isNumericQuery(query: string): boolean {
    return /^\d+$/.test(query.trim());
}
