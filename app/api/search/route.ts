import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';
import { isHebrew } from '@/lib/utils/search';
import { generateEmbedding } from '@/lib/vector/embedding-service';
import { searchTopicsByVector, searchStatementsByVector } from '@/lib/vector/pgvector-client';
import { calculateHybridScore, normalizeScores } from '@/lib/vector/similarity-search';
import type { HybridSearchResult } from '@/lib/vector/types';
import { determineSmartSearchMode, getLanguageOptimizedFilters, getSearchExplanation, shouldShowSemanticIndicators } from '@/lib/search-smart-mode';

// Directus client for server-side operations
const directus = createClient();

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const explicitMode = searchParams.get('mode'); // Keep for backward compatibility
        const semanticWeight = parseFloat(searchParams.get('semantic_weight') || '0.6');

        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimit = checkSearchRateLimit(ip);
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { 
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many search requests. Please try again later.',
                    resetTime: rateLimit.resetTime
                },
                { status: 429 }
            );
        }

        // Input validation
        if (!query || query.trim().length < 1) {
            return NextResponse.json({
                topics: [],
                statements: [],
                documents: [],
                locations: [],
                mode: 'keyword',
                message: 'Query too short'
            });
        }

        if (query.length > 200) {
            return NextResponse.json({
                topics: [],
                statements: [],
                documents: [],
                locations: [],
                mode: 'keyword',
                message: 'Query too long'
            });
        }

        // SMART MODE: Determine optimal search strategy
        const smartConfig = determineSmartSearchMode(query);
        const mode = explicitMode || smartConfig.mode;
        
        console.log(`Smart search: query="${query}" -> mode="${mode}" (${smartConfig.reasoning})`);

        // Check cache first (with timeout protection)
        const cacheKey = getSearchCacheKey(query, mode, semanticWeight);
        let cached = null;
        try {
            // Add timeout to prevent hanging on cache operations
            const cachePromise = new Promise((resolve) => {
                setTimeout(() => resolve(null), 1000); // 1 second timeout
                const result = cache.get(cacheKey);
                resolve(result);
            });
            cached = await Promise.race([cachePromise]);
        } catch (cacheError) {
            console.warn('Cache access failed, proceeding without cache:', cacheError);
            cached = null;
        }
        
        if (cached) {
            return NextResponse.json({
                ...cached,
                mode,
                cached: true,
                explanation: getSearchExplanation(smartConfig, query)
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let results: any = {};

        // Execute search based on smart mode
        if (mode === 'semantic' || mode === 'hybrid') {
            try {
                results = await performSemanticSearch(query, mode, semanticWeight);
            } catch (semanticError) {
                console.warn('Semantic search failed, falling back to keyword:', semanticError);
                
                // Fallback to keyword search
                if (mode === 'semantic') {
                    results = await performKeywordSearch(query);
                } else {
                    // For hybrid mode, try keyword search and combine with partial semantic results
                    try {
                        const keywordResults = await performKeywordSearch(query);
                        results = keywordResults; // Fallback to keyword only
                    } catch (keywordError) {
                        throw new Error('Both semantic and keyword search failed');
                    }
                }
            }
        } else {
            // Keyword search - DIRECT PATH, no AI involved
            results = await performKeywordSearch(query);
        }

        // Cache results
        cache.set(cacheKey, results, 5 * 60 * 1000);

        return NextResponse.json({
            ...results,
            mode,
            cached: false,
            explanation: getSearchExplanation(smartConfig, query),
            showSemanticIndicators: shouldShowSemanticIndicators(smartConfig)
        });

    } catch (error) {
        console.error('Search API Error:', error);
        
        // Return a safe fallback response
        return NextResponse.json({
            topics: [],
            statements: [],
            documents: [],
            locations: [],
            mode: 'keyword',
            error: 'SEARCH_FAILED',
            message: 'Search temporarily unavailable. Please try again.',
        }, { status: 500 });
    }
}

async function performSemanticSearch(
  query: string, 
  mode: string, 
  semanticWeight: number
) {
    // Generate embedding for the query
    const embedding = await generateEmbedding({ text: query });
    
    // Search for similar topics and statements
    const [topicResults, statementResults] = await Promise.all([
        searchTopicsByVector(embedding.embedding, { limit: 10 }),
        searchStatementsByVector(embedding.embedding, { limit: 10 })
    ]);

    // Get keyword results for hybrid mode
    let keywordResults: any = { topics: [], statements: [] };
    if (mode === 'hybrid') {
        keywordResults = await performKeywordSearch(query);
    }

    // Combine and normalize results
    const combinedResults = combineSearchResults(
        topicResults,
        statementResults,
        keywordResults.topics,
        keywordResults.statements,
        mode,
        semanticWeight
    );

    return combinedResults;
}

async function performKeywordSearch(query: string) {
    // Add timeout protection to prevent hanging
    const searchPromise = (async () => {
        // Get language-optimized filters
        const optimizedFilters = getLanguageOptimizedFilters(query);
        
        // Implement keyword search using Directus
        // Get keyword results
        let topics = [];
        try {
            topics = await directus.request(
                readItems('topics', {
                    filter: optimizedFilters,
                    limit: 20
                })
            );
        } catch (error) {
            console.warn('Failed to fetch topics via SDK, trying direct API call:', error);
            
            // Fallback to direct API call with language optimization
            try {
                const directusUrl = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
                const staticToken = process.env.DIRECTUS_STATIC_TOKEN;
                
                if (!staticToken) {
                    console.warn('No Directus static token configured');
                    topics = [];
                } else {
                    // Build query string with language-optimized filters
                    const params = new URLSearchParams();
                    params.append('limit', '20');
                    
                    // Add filter parameters based on language
                    if (isHebrew(query)) {
                        params.append('filter[canonical_title][_icontains]', query);
                        params.append('filter[description][_icontains]', query);
                    } else {
                        params.append('filter[canonical_title_en][_icontains]', query);
                        params.append('filter[canonical_title_transliteration][_icontains]', query);
                        params.append('filter[canonical_title][_icontains]', query); // Fallback
                    }
                    
                    const response = await fetch(`${directusUrl}/items/topics?${params.toString()}`, {
                        headers: {
                            'Authorization': `Bearer ${staticToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        topics = data.data || [];
                    } else {
                        topics = [];
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback API call also failed:', fallbackError);
                topics = [];
            }
        }

        // Try to get statements, but handle if collection doesn't exist
        let statements: any[] = [];
        try {
            statements = await directus.request(
                readItems('statements', {
                    filter: {
                        content: { _icontains: query }
                    },
                    limit: 20
                })
            );
        } catch (error) {
            console.log('Statements collection not available, using empty array');
            statements = [];
        }

        return {
            topics: topics.map((topic: any) => ({
                ...topic,
                is_semantic_match: false,
                keyword_score: 1.0
            })),
            statements: statements.map((statement: any) => ({
                ...statement,
                is_semantic_match: false,
                keyword_score: 1.0
            })),
            documents: [],
            locations: []
        };
    })();

    // Add 5 second timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Keyword search timeout')), 5000);
    });

    try {
        return await Promise.race([searchPromise, timeoutPromise]);
    } catch (error) {
        console.error('Keyword search failed or timed out:', error);
        return {
            topics: [],
            statements: [],
            documents: [],
            locations: []
        };
    }
}

function combineSearchResults(
    semanticTopics: any[],
    semanticStatements: any[],
    keywordTopics: any[],
    keywordStatements: any[],
    mode: string,
    semanticWeight: number
) {
    // Implementation for combining results based on mode
    if (mode === 'semantic') {
        return {
            topics: semanticTopics.map(t => ({ ...t, is_semantic_match: true, semantic_score: 0.8 })),
            statements: semanticStatements.map(s => ({ ...s, is_semantic_match: true, semantic_score: 0.8 })),
            documents: [],
            locations: []
        };
    }

    // Hybrid mode - combine both results
    const allTopics = [...semanticTopics, ...keywordTopics];
    const allStatements = [...semanticStatements, ...keywordStatements];

    return {
        topics: allTopics.slice(0, 20),
        statements: allStatements.slice(0, 20),
        documents: [],
        locations: []
    };
}

// Helper function to check if query looks numeric
function checkQueryLooksNumeric(query: string): boolean {
    return !isNaN(Number(query)) && query.trim().length > 0;
}
