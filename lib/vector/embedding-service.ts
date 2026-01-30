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

// Enhanced rate limiter with queuing and batch processing
interface EmbeddingJob {
  id: string;
  text: string;
  model: string;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

class EmbeddingQueue {
  private queue: EmbeddingJob[] = [];
  private processing = false;
  private readonly MAX_BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 6000; // 6 seconds between batches
  private readonly RATE_LIMIT_PER_MINUTE = 100;
  private readonly WINDOW_MS = 60000;
  private requests: number[] = [];

  async addToQueue(text: string, model: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const job: EmbeddingJob = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        model,
        resolve,
        reject
      };
      
      this.queue.push(job);
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Wait for rate limit if needed
      await this.waitForRateLimit();
      
      // Process batch
      const batch = this.queue.splice(0, this.MAX_BATCH_SIZE);
      
      try {
        await this.processBatch(batch);
      } catch (error) {
        // Reject all jobs in batch with error
        batch.forEach(job => job.reject(error as Error));
      }
      
      // Wait between batches to avoid rate limiting
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
      }
    }
    
    this.processing = false;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.WINDOW_MS);

    if (this.requests.length >= this.RATE_LIMIT_PER_MINUTE) {
      // Calculate wait time with exponential backoff
      const oldestRequest = this.requests[0];
      const baseWaitTime = this.WINDOW_MS - (now - oldestRequest);
      const exponentialBackoff = Math.min(baseWaitTime * 1.5, 30000); // Max 30 seconds
      const waitTime = Math.max(exponentialBackoff, 1000); // Min 1 second
      
      console.log(`Rate limit reached, waiting ${Math.round(waitTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Recursively check again
      return this.waitForRateLimit();
    }
  }

  private async processBatch(jobs: EmbeddingJob[]): Promise<void> {
    const now = Date.now();
    
    // Record requests for rate limiting
    jobs.forEach(() => this.requests.push(now));
    
    // Process jobs in parallel (within the batch)
    const promises = jobs.map(job => this.processSingleJob(job));
    await Promise.allSettled(promises);
  }

  private async processSingleJob(job: EmbeddingJob): Promise<void> {
    try {
      const result = await this.generateEmbeddingDirect(job.text, job.model);
      job.resolve(result);
    } catch (error) {
      job.reject(error as Error);
    }
  }

  private async generateEmbeddingDirect(text: string, model: string): Promise<any> {
    const openrouterUrl = 'https://openrouter.ai/api/v1/embeddings';
    const embeddingDimensions = 512;
    
    // Prepare text
    const preparedText = this.truncateText(text);
    
    // Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const response = await fetch(openrouterUrl, {
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
        dimensions: embeddingDimensions,
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

    return {
      embedding,
      model,
      dimensions: embedding.length,
    };
  }

  private truncateText(text: string, maxTokens: number = 8192): string {
    const estimatedTokens = Math.ceil(text.length / 3); // Conservative estimate
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Truncate to approximate token limit
    const maxChars = Math.floor(maxTokens * 3);
    return text.slice(0, maxChars) + '...';
  }

  // Get queue status for monitoring
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      recentRequests: this.requests.length,
      rateLimitStatus: this.requests.length >= this.RATE_LIMIT_PER_MINUTE ? 'LIMITED' : 'AVAILABLE'
    };
  }
}

const embeddingQueue = new EmbeddingQueue();

// Legacy rate limiter for backward compatibility
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

  // Use enhanced queue system for better rate limiting
  try {
    const result = await embeddingQueue.addToQueue(text, model);
    
    // Cache the result
    const cacheEntry: EmbeddingCacheEntry = {
      embedding: result.embedding,
      model,
      timestamp: Date.now(),
    };
    cache.set(cacheKey, cacheEntry, CACHE_TTL);

    return result;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch with improved queuing
 * Processes with rate limiting and error handling
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options?: {
    model?: string;
    onProgress?: (completed: number, total: number) => void;
    onError?: (error: Error, text: string) => void;
    batchSize?: number;
  }
): Promise<Array<{ text: string; embedding: number[] | null; error?: Error }>> {
  const results: Array<{ text: string; embedding: number[] | null; error?: Error }> = [];
  const batchSize = options?.batchSize || 10;
  const model = options?.model || EMBEDDING_MODEL;

  // Process in batches to respect rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (text) => {
      try {
        const response = await generateEmbedding({ text, model });
        return {
          text,
          embedding: response.embedding,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (options?.onError) {
          options.onError(err, text);
        }
        
        return {
          text,
          embedding: null,
          error: err,
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Extract results from settled promises
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // This shouldn't happen with our error handling, but just in case
        results.push({
          text: 'unknown',
          embedding: null,
          error: new Error('Batch processing failed'),
        });
      }
    });

    if (options?.onProgress) {
      options.onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  return results;
}

/**
 * Get queue status for monitoring
 */
export function getEmbeddingQueueStatus() {
  return embeddingQueue.getQueueStatus();
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
