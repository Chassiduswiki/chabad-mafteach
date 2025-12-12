import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';

// Simple in-memory rate limiter for search endpoints
const searchRateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkSearchRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute for search (more lenient than auth)
  const maxRequests = 20; // Allow 20 searches per minute per IP

  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
  }

  const record = searchRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // First request or window expired
    searchRateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment counter
  record.count++;
  searchRateLimitStore.set(ip, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Cache key for search results
const getSearchCacheKey = (query: string) => `search:results:${query.toLowerCase().trim()}`;

export async function GET(request: NextRequest) {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const rateLimitResult = checkSearchRateLimit(ip);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many search requests. Please try again in a moment.',
          retryAfter: resetInSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ documents: [], locations: [], topics: [], statements: [], seforim: [] });
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

        // **[NEW]** Seforim search - add document/sefer search functionality
        const seforimPromise = (async () => {
            if (normalizedQuery.length > 0) {
                const seferFilter: any = {
                    _and: [
                        { status: { _eq: 'published' } },
                        {
                            _or: [
                                { title: { _icontains: normalizedQuery } },
                                { author: { _icontains: normalizedQuery } },
                                { doc_type: { _icontains: normalizedQuery } },
                                { original_lang: { _icontains: normalizedQuery } },
                                { category: { _icontains: normalizedQuery } }
                            ]
                        }
                    ]
                };

                return await directus.request(
                    readItems('documents', {
                        fields: ['id', 'title', 'author', 'doc_type', 'original_lang', 'status', 'published_at', 'category'],
                        filter: seferFilter,
                        limit: Math.min(MAX_RESULTS_PER_TYPE, 20), // Limit seforim results
                        sort: ['title']
                    })
                ) as any[];
            }
            return [];
        })();

        // Wait for all searches to complete
        const seforimRaw = await seforimPromise;
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

        // **[NEW]** Format seforim results
        const seforim = (seforimRaw as any[]).map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            author: s.author,
            doc_type: s.doc_type,
            language: s.language,
            publish_year: s.publish_year,
            slug: s.slug,
        }));

        const result = { documents, locations, topics, statements, seforim };

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
