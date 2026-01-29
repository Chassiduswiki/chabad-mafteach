/**
 * Semantic Search API
 * POST /api/search/semantic
 * Provides vector-based semantic search capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/api-errors';
import { cache } from '@/lib/cache';
import { generateEmbedding } from '@/lib/vector/embedding-service';
import { searchTopicsByVector, searchStatementsByVector } from '@/lib/vector/pgvector-client';
import type { SemanticSearchParams, VectorSearchResult } from '@/lib/vector/types';

// Rate limiter for semantic search (more expensive than keyword search)
const semanticRateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkSemanticRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60; // Allow 60 semantic searches per minute

  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs };
  }

  const record = semanticRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    semanticRateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  semanticRateLimitStore.set(ip, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Cache key for semantic search results
function getSemanticCacheKey(params: SemanticSearchParams): string {
  const { query, collections = ['topics', 'statements'], limit = 10, threshold = 0.7 } = params;
  const normalized = query.toLowerCase().trim();
  const collectionsStr = collections.sort().join(',');
  return `semantic:${normalized}:${collectionsStr}:${limit}:${threshold}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    const rateLimitResult = checkSemanticRateLimit(ip);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many semantic search requests. Please try again in a moment.',
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const params: SemanticSearchParams = {
      query: body.query,
      collections: body.collections || ['topics', 'statements'],
      limit: body.limit || 10,
      threshold: body.threshold || 0.7,
    };

    if (!params.query || typeof params.query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getSemanticCacheKey(params);
    const cachedResult = cache.get<{
      results: VectorSearchResult[];
      query: string;
      cached: boolean;
    }>(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
      });
    }

    // Generate query embedding
    const embeddingResponse = await generateEmbedding({
      text: params.query,
    });

    const queryEmbedding = embeddingResponse.embedding;

    // Search across collections in parallel
    const searchPromises: Promise<VectorSearchResult[]>[] = [];
    const collections = params.collections || ['topics', 'statements'];

    if (collections.includes('topics')) {
      searchPromises.push(
        searchTopicsByVector(queryEmbedding, {
          threshold: params.threshold,
          limit: params.limit,
        })
      );
    }

    if (collections.includes('statements')) {
      searchPromises.push(
        searchStatementsByVector(queryEmbedding, {
          threshold: params.threshold,
          limit: params.limit,
        })
      );
    }

    const searchResults = await Promise.all(searchPromises);

    // Combine and sort results by similarity
    const allResults = searchResults
      .flat()
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.limit);

    const result = {
      results: allResults,
      query: params.query,
      cached: false,
      metadata: {
        total_results: allResults.length,
        collections_searched: collections,
        threshold: params.threshold,
        model: embeddingResponse.model,
      },
    };

    // Cache results for 5 minutes
    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Semantic Search API Error:', error);
    return handleApiError(error);
  }
}

// GET endpoint for simple queries
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const collections = searchParams.get('collections')?.split(',') as ('topics' | 'statements')[] | undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const threshold = parseFloat(searchParams.get('threshold') || '0.7');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter (q) is required' },
      { status: 400 }
    );
  }

  // Convert to POST request format
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      query,
      collections: collections || ['topics', 'statements'],
      limit,
      threshold,
    }),
  });

  return POST(mockRequest as NextRequest);
}
