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


    try {
        // Limit search to prevent performance issues
        const MAX_RESULTS_PER_TYPE = 15;

        // Execute all searches in parallel with proper error handling
        const [contentBlocksRes, statementsRes, topicsRes, seforimRes] = await Promise.allSettled([
            directus.request(
                readItems('content_blocks', {
                    search: normalizedQuery,
                    fields: ['id', 'order_key', 'content', 'page_number', 'chapter_number', 'halacha_number', 'document_id'],
                    limit: MAX_RESULTS_PER_TYPE,
                })
            ),
            directus.request(
                readItems('statements', {
                    search: normalizedQuery,
                    fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
                    limit: MAX_RESULTS_PER_TYPE,
                })
            ),
            directus.request(
                readItems('topics', {
                    search: normalizedQuery,
                    fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
                    limit: 20,
                })
            ),
            directus.request(
                readItems('documents', {
                    search: normalizedQuery,
                    fields: ['id', 'title', 'author', 'doc_type', 'original_lang', 'status', 'published_at', 'category'],
                    limit: 15,
                })
            )
        ]);

        // Process Content Blocks -> locations
        const locations = contentBlocksRes.status === 'fulfilled' 
            ? (contentBlocksRes.value as { id: string | number; content?: string; order_key?: string | number; document_id?: string | number; page_number?: string; chapter_number?: number; halacha_number?: number }[]).map((cb) => {
                const clean = cb.content?.replace(/<[^>]*>/g, '') || '';
                return {
                    id: `content-${cb.id}`,
                    title: `Content Block ${cb.order_key}`,
                    display_name: `Section ${cb.order_key}`,
                    content_preview: clean.substring(0, 150) + (clean.length > 150 ? '...' : ''),
                    url: `/seforim/${cb.document_id}`,
                    page_number: cb.page_number,
                    chapter_number: cb.chapter_number,
                    halacha_number: cb.halacha_number,
                    sefer: cb.document_id,
                };
            }) 
            : [];

        // Process Statements -> statements
        const statements = statementsRes.status === 'fulfilled'
            ? (statementsRes.value as { id: string | number; text?: string; appended_text?: string; order_key?: string | number; block_id?: string | number }[]).map((stmt) => {
                const cleanText = stmt.text?.replace(/<[^>]*>/g, '') || '';
                const cleanAppended = stmt.appended_text?.replace(/<[^>]*>/g, '') || '';
                return {
                    id: `statement-${stmt.id}`,
                    title: cleanText.substring(0, 80) + (cleanText.length > 80 ? '...' : ''),
                    content_preview: cleanAppended ? `Footnote: ${cleanAppended.substring(0, 100)}` : '',
                    url: `/seforim/${stmt.block_id}`,
                    block_id: stmt.block_id,
                };
            })
            : [];

        // Process Topics -> topics
        const topics = topicsRes.status === 'fulfilled'
            ? (topicsRes.value as { id: string | number; canonical_title: string; slug: string; topic_type?: string; description?: string }[]).map((t) => ({
                id: t.id,
                name: t.canonical_title,
                slug: t.slug,
                category: t.topic_type,
                definition_short: t.description,
                url: `/topics/${t.slug}`,
            }))
            : [];

        // Process Seforim -> seforim
        const seforim = seforimRes.status === 'fulfilled'
            ? (seforimRes.value as { id: string | number; title: string; author?: string; doc_type?: string; category?: string }[]).map((s) => ({
                id: s.id,
                title: s.title,
                author: s.author,
                doc_type: s.doc_type,
                category: s.category,
                url: `/seforim/${s.id}`,
            }))
            : [];

        const result = { 
            documents: seforim.filter(s => s.doc_type === 'sefer'), // Alias for backward compatibility
            locations, 
            topics, 
            statements, 
            seforim 
        };

        // Cache results for 5 minutes
        cache.set(cacheKey, result, 5 * 60 * 1000);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Search API Error:', error);
        return handleApiError(error);
    }
}

// Helper function to check if query looks numeric
