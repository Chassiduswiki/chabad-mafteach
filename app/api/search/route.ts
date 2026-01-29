import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';
import { isHebrew } from '@/lib/utils/search';
import { generateEmbedding } from '@/lib/vector/embedding-service';
import { searchTopicsByVector, searchStatementsByVector } from '@/lib/vector/pgvector-client';
import { calculateHybridScore, normalizeScores } from '@/lib/vector/similarity-search';
import type { HybridSearchResult } from '@/lib/vector/types';

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
const getSearchCacheKey = (query: string, mode?: string, weight?: number) => {
    const base = query.toLowerCase().trim();
    return `search:results:${base}:${mode || 'keyword'}:${weight || 0.6}`;
};

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
    const mode = searchParams.get('mode') || 'keyword'; // 'keyword', 'semantic', or 'hybrid'
    const semanticWeight = parseFloat(searchParams.get('semantic_weight') || '0.6');

    if (!query) {
        return NextResponse.json({ documents: [], locations: [], topics: [], statements: [], seforim: [] });
    }

    // Normalize query for caching
    const normalizedQuery = query.toLowerCase().trim();

    // Check cache first (cache search results for 5 minutes)
    const cacheKey = getSearchCacheKey(normalizedQuery, mode, semanticWeight);
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
        return NextResponse.json(cachedResult);
    }


    try {
        // Limit search to prevent performance issues
        const MAX_RESULTS_PER_TYPE = 15;

        // For semantic-only mode, skip keyword search
        if (mode === 'semantic') {
            try {
                const embeddingResponse = await generateEmbedding({ text: normalizedQuery });
                const queryEmbedding = embeddingResponse.embedding;

                const [semanticTopics, semanticStatements] = await Promise.all([
                    searchTopicsByVector(queryEmbedding, { threshold: 0.7, limit: 20 }),
                    searchStatementsByVector(queryEmbedding, { threshold: 0.7, limit: MAX_RESULTS_PER_TYPE }),
                ]);

                const topics = semanticTopics.map((t) => ({
                    id: t.id,
                    name: t.title,
                    slug: t.url.split('/').pop() || '',
                    category: t.metadata?.category,
                    definition_short: t.content_preview,
                    url: t.url,
                    similarity: t.similarity,
                    is_semantic_match: true,
                }));

                const statements = semanticStatements.map((s) => ({
                    id: s.id,
                    title: s.title,
                    content_preview: s.content_preview,
                    url: s.url,
                    similarity: s.similarity,
                    is_semantic_match: true,
                }));

                const result = {
                    documents: [],
                    locations: [],
                    topics,
                    statements,
                    seforim: [],
                    mode: 'semantic',
                };

                cache.set(cacheKey, result, 5 * 60 * 1000);
                return NextResponse.json(result);
            } catch (error) {
                console.error('Semantic search error:', error);
                // Fall back to empty results
                return NextResponse.json({
                    documents: [],
                    locations: [],
                    topics: [],
                    statements: [],
                    seforim: [],
                    mode: 'semantic',
                    error: 'Semantic search failed',
                });
            }
        }

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

        // Apply hybrid search if mode is 'hybrid'
        let finalTopics = topics;
        let finalStatements = statements;

        if (mode === 'hybrid') {
            try {
                // Generate query embedding
                const embeddingResponse = await generateEmbedding({ text: normalizedQuery });
                const queryEmbedding = embeddingResponse.embedding;

                // Fetch semantic results in parallel
                const [semanticTopics, semanticStatements] = await Promise.all([
                    searchTopicsByVector(queryEmbedding, { threshold: 0.7, limit: 20 }),
                    searchStatementsByVector(queryEmbedding, { threshold: 0.7, limit: MAX_RESULTS_PER_TYPE }),
                ]);

                // Merge and score topics
                const topicScoreMap = new Map<string, { item: any; keywordScore: number; semanticScore: number }>();

                // Add keyword results with normalized scores
                const maxKeywordScore = topics.length > 0 ? topics.length : 1;
                topics.forEach((topic, index) => {
                    const keywordScore = 1 - (index / maxKeywordScore); // Higher score for earlier results
                    topicScoreMap.set(String(topic.id), {
                        item: topic,
                        keywordScore,
                        semanticScore: 0,
                    });
                });

                // Add semantic results
                semanticTopics.forEach((semanticTopic) => {
                    const existing = topicScoreMap.get(String(semanticTopic.id));
                    if (existing) {
                        existing.semanticScore = semanticTopic.similarity;
                    } else {
                        topicScoreMap.set(String(semanticTopic.id), {
                            item: {
                                id: semanticTopic.id,
                                name: semanticTopic.title,
                                slug: semanticTopic.url.split('/').pop() || '',
                                category: semanticTopic.metadata?.category,
                                definition_short: semanticTopic.content_preview,
                                url: semanticTopic.url,
                            },
                            keywordScore: 0,
                            semanticScore: semanticTopic.similarity,
                        });
                    }
                });

                // Calculate hybrid scores and sort
                finalTopics = Array.from(topicScoreMap.values())
                    .map(({ item, keywordScore, semanticScore }) => ({
                        ...item,
                        hybrid_score: calculateHybridScore(keywordScore, semanticScore, {
                            keywordWeight: 1 - semanticWeight,
                            semanticWeight,
                        }),
                        keyword_score: keywordScore,
                        semantic_score: semanticScore,
                        is_semantic_match: semanticScore > 0,
                    }))
                    .sort((a, b) => b.hybrid_score - a.hybrid_score)
                    .slice(0, 20);

                // Merge and score statements
                const statementScoreMap = new Map<string, { item: any; keywordScore: number; semanticScore: number }>();

                const maxStatementScore = statements.length > 0 ? statements.length : 1;
                statements.forEach((statement, index) => {
                    const keywordScore = 1 - (index / maxStatementScore);
                    const stmtId = String(statement.id).replace('statement-', '');
                    statementScoreMap.set(stmtId, {
                        item: statement,
                        keywordScore,
                        semanticScore: 0,
                    });
                });

                semanticStatements.forEach((semanticStmt) => {
                    const existing = statementScoreMap.get(String(semanticStmt.id));
                    if (existing) {
                        existing.semanticScore = semanticStmt.similarity;
                    } else {
                        statementScoreMap.set(String(semanticStmt.id), {
                            item: {
                                id: `statement-${semanticStmt.id}`,
                                title: semanticStmt.title,
                                content_preview: semanticStmt.content_preview,
                                url: semanticStmt.url,
                            },
                            keywordScore: 0,
                            semanticScore: semanticStmt.similarity,
                        });
                    }
                });

                finalStatements = Array.from(statementScoreMap.values())
                    .map(({ item, keywordScore, semanticScore }) => ({
                        ...item,
                        hybrid_score: calculateHybridScore(keywordScore, semanticScore, {
                            keywordWeight: 1 - semanticWeight,
                            semanticWeight,
                        }),
                        keyword_score: keywordScore,
                        semantic_score: semanticScore,
                        is_semantic_match: semanticScore > 0,
                    }))
                    .sort((a, b) => b.hybrid_score - a.hybrid_score)
                    .slice(0, MAX_RESULTS_PER_TYPE);
            } catch (error) {
                console.error('Hybrid search error:', error);
                // Fall back to keyword-only results
            }
        }

        const result = {
            documents: seforim.filter(s => s.doc_type === 'sefer'), // Alias for backward compatibility
            locations,
            topics: finalTopics,
            statements: finalStatements,
            seforim,
            mode,
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
