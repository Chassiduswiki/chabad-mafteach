import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';
import { isHebrew } from '@/lib/utils/search';

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

    // Generate variants for better discovery (Hebrew <-> English)
    const variants = [normalizedQuery];

    // For each collection, we'll build a filter that matches ANY of the variants
    const buildVariantFilter = (fields: string[]) => {
        const queryVariants = [normalizedQuery];
        // Add basic transliterations if not Hebrew
        if (!isHebrew(normalizedQuery)) {
            if (normalizedQuery === 'tanya') queryVariants.push('ליקוטי אמרים', 'תניא');
            if (normalizedQuery === 'perek') queryVariants.push('פרק');
        }

        return {
            _or: queryVariants.flatMap(v =>
                fields.map(f => ({ [f]: { _icontains: v } }))
            )
        };
    };

    try {
        let docs: any[] = [];
        let topicsRaw: any[] = [];

        // Limit search to prevent performance issues
        const MAX_RESULTS_PER_TYPE = 15;

        // Use Promise.all for all searches
        const searchPromise = (async () => {
            const variantFilter = buildVariantFilter(['content']);

            const [contentBlocksResult, statementsResult] = await Promise.allSettled([
                // Content blocks search
                directus.request(
                    readItems('content_blocks', {
                        filter: {
                            _and: [
                                {
                                    _or: [
                                        variantFilter,
                                        ...(isNumericQuery(normalizedQuery) ? [
                                            { page_number: { _eq: normalizedQuery as any } },
                                            { chapter_number: { _eq: parseInt(normalizedQuery) as any } },
                                            { halacha_number: { _eq: parseInt(normalizedQuery) as any } }
                                        ] : [])
                                    ]
                                }
                            ]
                        } as any,
                        fields: ['id', 'order_key', 'content', 'page_number', 'chapter_number', 'halacha_number', 'document_id'],
                        limit: MAX_RESULTS_PER_TYPE,
                        sort: ['order_key']
                    })
                ),

                // Statements search
                directus.request(
                    readItems('statements', {
                        filter: {
                            _and: [
                                { _or: [{ status: { _eq: 'published' } }, { status: { _eq: 'draft' } }] },
                                { is_deleted: { _neq: true } },
                                buildVariantFilter(['text'])
                            ]
                        } as any,
                        fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
                        limit: MAX_RESULTS_PER_TYPE,
                        sort: ['order_key']
                    })
                )
            ]);

            // Process results
            if (contentBlocksResult.status === 'fulfilled') {
                const results = (contentBlocksResult.value as any[]).map(cb => {
                    const clean = cb.content?.replace(/<[^>]*>/g, '') || '';
                    return {
                        id: `content-${cb.id}`,
                        title: `Content Block ${cb.order_key}`,
                        content_preview: clean.substring(0, 150) + (clean.length > 150 ? '...' : ''),
                        url: `/seforim/${cb.document_id}`,
                        type: 'content_block'
                    };
                });
                docs = docs.concat(results);
            }

            if (statementsResult.status === 'fulfilled') {
                const results = (statementsResult.value as any[]).map(stmt => {
                    const cleanText = stmt.text?.replace(/<[^>]*>/g, '') || '';
                    const cleanAppended = stmt.appended_text?.replace(/<[^>]*>/g, '') || '';
                    return {
                        id: `statement-${stmt.id}`,
                        title: cleanText.substring(0, 80) + (cleanText.length > 80 ? '...' : ''),
                        content_preview: cleanAppended ? `Footnote: ${cleanAppended.substring(0, 100)}` : '',
                        url: `/seforim/${stmt.block_id}`,
                        type: 'statement'
                    };
                });
                docs = docs.concat(results);
            }
        })();

        const topicsPromise = (async () => {
            if (normalizedQuery.length > 1) {
                const topicFilter = buildVariantFilter(['canonical_title', 'slug', 'description', 'topic_type']);
                topicsRaw = await directus.request(
                    readItems('topics', {
                        fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                        filter: topicFilter as any,
                        limit: 20,
                    })
                ) as any[];
            }
        })();

        const seforimPromise = (async () => {
            const seferFilter = {
                _and: [
                    { _or: [{ status: { _eq: 'published' } }, { status: { _eq: 'draft' } }] },
                    buildVariantFilter(['title', 'doc_type', 'original_lang'])
                ]
            };

            return await directus.request(
                readItems('documents', {
                    fields: ['id', 'title', 'author', 'doc_type', 'original_lang', 'status', 'published_at', 'category'],
                    filter: seferFilter as any,
                    limit: 15,
                    sort: ['title']
                })
            ) as any[];
        })();

        await Promise.all([searchPromise, topicsPromise, seforimPromise]);
        const seforimRaw = await seforimPromise;

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
            url: d.url,
            page_number: d.page_number as string,
            chapter_number: d.chapter_number as number,
            halacha_number: d.halacha_number as number,
            sefer: d.document_id as number,
        }));

        const statements = docs.filter(d => d.type === 'statement').map((d) => ({
            id: d.id,
            title: d.title as string,
            content_preview: d.content_preview as string,
            url: d.url,
            block_id: d.block_id as number,
        }));

        const topics = (topicsRaw as any[]).map((t) => ({
            id: t.id,
            name: t.canonical_title,
            name_hebrew: undefined,
            slug: t.slug,
            category: t.topic_type,
            definition_short: t.description,
            url: `/topics/${t.slug}`,
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
            slug: s.id.toString(), // Documents don't have slugs currently, fallback to ID
            url: `/seforim/${s.id}`,
        }));

        const result = { documents, locations, topics, statements, seforim };

        // Cache results for 5 minutes
        cache.set(cacheKey, result, 5 * 60 * 1000);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Search API Error:', error);
        return handleApiError(error);
    }
}

// Helper function to check if query looks numeric
function isNumericQuery(query: string): boolean {
    return /^\d+$/.test(query.trim());
}
