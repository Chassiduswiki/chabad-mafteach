/**
 * Embedding Service
 * Handles text embedding generation via OpenRouter API
 */

import { cache } from '@/lib/cache';
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  EmbeddingCacheEntry,
} from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 512;
const MAX_TOKENS_PER_REQUEST = 8192;
const RATE_LIMIT_PER_MINUTE = 100;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Simple rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.limit) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Recursively check again
      return this.waitIfNeeded();
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_PER_MINUTE);

/**
 * Generate a cache key for embedding text
 */
function getCacheKey(text: string, model: string): string {
  const hash = simpleHash(text + model);
  return `embed:${model}:${hash}`;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Truncate text to fit within token limit
 * Rough estimate: 1 token ≈ 4 characters for English, ~2 for Hebrew
 */
function truncateText(text: string, maxTokens: number = MAX_TOKENS_PER_REQUEST): string {
  const estimatedTokens = Math.ceil(text.length / 3); // Conservative estimate
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Truncate to approximate token limit
  const maxChars = Math.floor(maxTokens * 3);
  return text.slice(0, maxChars) + '...';
}

/**
 * Prepare text for embedding
 * Combines multiple fields and cleans the text
 */
export function prepareTextForEmbedding(fields: Record<string, string | null | undefined>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === 'string' && value.trim()) {
      parts.push(value.trim());
    }
  }

  const combined = parts.join(' | ');
  return truncateText(combined);
}

/**
 * Generate embedding for text using OpenRouter API
 */
export async function generateEmbedding(
  request: EmbeddingRequest
): Promise<EmbeddingResponse> {
  const { text, model = EMBEDDING_MODEL } = request;

  // Check cache first
  const cacheKey = getCacheKey(text, model);
  const cached = cache.get<EmbeddingCacheEntry>(cacheKey);

  if (cached) {
    return {
      embedding: cached.embedding,
      model: cached.model,
      dimensions: cached.embedding.length,
    };
  }

  // Rate limiting
  await rateLimiter.waitIfNeeded();

  // Prepare text
  const preparedText = truncateText(text);

  // Call OpenRouter API
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chabad Research Semantic Search',
      },
      body: JSON.stringify({
        model: `openai/${model}`,
        input: preparedText,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const embedding = data.data[0].embedding;

    // Cache the result
    const cacheEntry: EmbeddingCacheEntry = {
      embedding,
      model,
      timestamp: Date.now(),
    };
    cache.set(cacheKey, cacheEntry, CACHE_TTL);

    return {
      embedding,
      model,
      dimensions: embedding.length,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Processes with rate limiting and error handling
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options?: {
    model?: string;
    onProgress?: (completed: number, total: number) => void;
    onError?: (error: Error, text: string) => void;
  }
): Promise<Array<{ text: string; embedding: number[] | null; error?: Error }>> {
  const results: Array<{ text: string; embedding: number[] | null; error?: Error }> = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    try {
      const response = await generateEmbedding({
        text,
        model: options?.model,
      });

      results.push({
        text,
        embedding: response.embedding,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({
        text,
        embedding: null,
        error: err,
      });

      if (options?.onError) {
        options.onError(err, text);
      }
    }

    if (options?.onProgress) {
      options.onProgress(i + 1, texts.length);
    }
  }

  return results;
}

/**
 * Estimate cost for embedding generation
 * Based on OpenRouter pricing: ~$0.02 per 1M tokens
 */
export function estimateEmbeddingCost(textLength: number, count: number = 1): number {
  const estimatedTokens = Math.ceil(textLength / 3) * count;
  const costPerToken = 0.02 / 1_000_000;
  return estimatedTokens * costPerToken;
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache(pattern?: string): void {
  if (pattern) {
    // Clear specific pattern
    const keys = Array.from((cache as any).cache.keys()) as string[];
    keys.forEach((key: string) => {
      if (key.startsWith('embed:') && key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    // Clear all embeddings
    const keys = Array.from((cache as any).cache.keys()) as string[];
    keys.forEach((key: string) => {
      if (key.startsWith('embed:')) {
        cache.delete(key);
      }
    });
  }
}
