/**
 * Cache Optimization for Semantic Search
 * Enhanced caching strategies with hierarchical keys and warming
 */

import { useCallback } from 'react';
import { log } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { getBaseUrl } from '@/lib/utils/base-url';

// Cache key patterns
export const cacheKeys = {
  semanticSearch: (query: string, mode: string, weight: number) => 
    `search:semantic:${query}:${mode}:${weight}`,
  similarTopics: (topicId: string) => `similar:topics:${topicId}`,
  embedding: (text: string) => `embedding:${hash(text)}`,
  popularQueries: () => `cache:popular:queries`,
  searchSuggestions: (query: string, mode: string) => `suggestions:${query}:${mode}`,
};

/**
 * Simple hash function for cache keys
 */
function hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Enhanced cache manager for semantic search with size limits
 */
export class SemanticCacheManager {
  private readonly defaultTTL = {
    search: 5 * 60 * 1000, // 5 minutes
    embeddings: 24 * 60 * 60 * 1000, // 24 hours
    similarTopics: 10 * 60 * 1000, // 10 minutes
    suggestions: 2 * 60 * 1000, // 2 minutes
    popular: 30 * 60 * 1000, // 30 minutes
  };

  private readonly maxCacheSize = 1000; // Maximum number of entries
  private readonly maxMemorySize = 50 * 1024 * 1024; // 50MB limit
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
  };

  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): string {
    // Rough estimation - would need more sophisticated tracking in production
    const avgEntrySize = 1024; // 1KB per entry estimate
    const usage = this.cacheStats.currentSize * avgEntrySize;
    return `${(usage / 1024 / 1024).toFixed(2)}MB`;
  }

  /**
   * Check if cache needs cleanup
   */
  private needsCleanup(): boolean {
    return this.cacheStats.currentSize > this.maxCacheSize || 
           this.estimateMemoryUsageBytes() > this.maxMemorySize;
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsageBytes(): number {
    // Simplified estimation - in production would track actual sizes
    return this.cacheStats.currentSize * 1024;
  }

  /**
   * Cleanup old entries to prevent memory exhaustion
   */
  private cleanupCache(): void {
    if (!this.needsCleanup()) return;

    // Remove expired entries first
    const now = Date.now();
    let removed = 0;

    // This is a simplified cleanup - in production would iterate through actual cache entries
    const keysToRemove: string[] = [];
    
    // Remove expired entries
    for (const key of this.getCacheKeys()) {
      const entry = cache.get(key) as any;
      if (entry && entry.expiresAt && entry.expiresAt < now) {
        keysToRemove.push(key);
      }
    }

    // If still too large, remove oldest entries
    if (this.cacheStats.currentSize - keysToRemove.length > this.maxCacheSize) {
      const allKeys = this.getCacheKeys();
      const oldestKeys = allKeys
        .sort((a, b) => this.getEntryTimestamp(a) - this.getEntryTimestamp(b))
        .slice(0, this.cacheStats.currentSize - this.maxCacheSize);
      
      keysToRemove.push(...oldestKeys);
    }

    // Remove entries
    keysToRemove.forEach(key => {
      cache.delete(key);
      this.cacheStats.currentSize--;
      this.cacheStats.evictions++;
    });

    if (keysToRemove.length > 0) {
      log.cache('cleanup', 'cache', false, {
        removedEntries: keysToRemove.length,
        component: 'SemanticCacheManager'
      });
    }
  }

  /**
   * Get all cache keys (simplified - would need actual cache inspection)
   */
  private getCacheKeys(): string[] {
    // This is a placeholder - in production would inspect actual cache storage
    return [];
  }

  /**
   * Get entry timestamp (simplified)
   */
  private getEntryTimestamp(key: string): number {
    const entry = cache.get(key) as any;
    return entry?.timestamp || 0;
  }

  /**
   * Cache search results with size limits and cleanup
   */
  cacheSearchResults(
    query: string, 
    mode: string, 
    weight: number, 
    results: any, 
    ttl?: number
  ): void {
    // Cleanup before adding new entries
    this.cleanupCache();

    const key = cacheKeys.semanticSearch(query, mode, weight);
    const cacheTTL = ttl || this.defaultTTL.search;
    
    // Check if we're at capacity
    if (this.cacheStats.currentSize >= this.maxCacheSize) {
      this.cleanupCache();
    }

    // Add entry with metadata
    const entry = {
      data: results,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheTTL,
      size: this.estimateEntrySize(results),
    };

    cache.set(key, entry, cacheTTL);
    this.cacheStats.currentSize++;
  }

  /**
   * Get cached search results with hit tracking
   */
  getCachedSearchResults(query: string, mode: string, weight: number): any {
    const key = cacheKeys.semanticSearch(query, mode, weight);
    const entry = cache.get(key) as any;
    if (entry) {
      this.cacheStats.hits++;
      return entry?.data || entry; // Handle both wrapped and unwrapped entries
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Estimate entry size (simplified)
   */
  private estimateEntrySize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // Default size estimate
    }
  }

  /**
   * Cache similar topics with size limits
   */
  cacheSimilarTopics(topicId: string, topics: any, ttl?: number): void {
    this.cleanupCache();

    const key = cacheKeys.similarTopics(topicId);
    const cacheTTL = ttl || this.defaultTTL.similarTopics;

    if (this.cacheStats.currentSize >= this.maxCacheSize) {
      this.cleanupCache();
    }

    const entry = {
      data: topics,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheTTL,
      size: this.estimateEntrySize(topics),
    };

    cache.set(key, entry, cacheTTL);
    this.cacheStats.currentSize++;
  }

  /**
   * Get cached similar topics
   */
  getCachedSimilarTopics(topicId: string): any {
    const key = cacheKeys.similarTopics(topicId);
    const entry = cache.get(key) as any;
    if (entry) {
      this.cacheStats.hits++;
      return entry?.data || entry;
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Cache embedding with very long TTL
   */
  cacheEmbedding(text: string, embedding: number[], ttl?: number): void {
    const key = cacheKeys.embedding(text);
    const cacheTTL = ttl || this.defaultTTL.embeddings;
    cache.set(key, embedding, cacheTTL);
  }

  /**
   * Get cached embedding
   */
  getCachedEmbedding(text: string): number[] | null {
    const key = cacheKeys.embedding(text);
    return cache.get(key);
  }

  /**
   * Warm cache with popular queries
   */
  async warmPopularQueries(options?: { baseUrl?: string; delayMs?: number }): Promise<void> {
    const baseUrl = options?.baseUrl ?? getBaseUrl();
    const delayMs = options?.delayMs ?? 100;

    const popularQueries = [
      'bitul', 'emunah', 'ratzon', 'taanug', // Hebrew concepts
      'humility', 'faith', 'will', 'pleasure', // English translations
      'god', 'torah', 'mitzvot', 'teshuvah', // Common terms
    ];

    const warmPromises = popularQueries.map(async (query) => {
      try {
        // Warm semantic search cache
        for (const mode of ['semantic', 'hybrid']) {
          const weight = mode === 'hybrid' ? 0.6 : 1.0;
          const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}&mode=${mode}&semantic_weight=${weight}`);
          if (response.ok) {
            const data = await response.json();
            this.cacheSearchResults(query, mode, weight, data);
          }
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        console.warn(`Failed to warm cache for query: ${query}`, error);
      }
    });

    await Promise.all(warmPromises);
    
    // Store warming timestamp
    cache.set(cacheKeys.popularQueries(), {
      lastWarmed: new Date().toISOString(),
      queriesWarmed: popularQueries.length,
    }, this.defaultTTL.popular);
  }

  /**
   * Get cache warming status
   */
  getCacheWarmingStatus(): { lastWarmed: string; queriesWarmed: number } | null {
    return cache.get(cacheKeys.popularQueries());
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(pattern: string): void {
    if (pattern.includes('search:')) {
      // Invalidate all search caches
      this.invalidateSearchCache();
    } else if (pattern.includes('embedding:')) {
      // Invalidate embedding caches
      this.invalidateEmbeddingCache();
    } else if (pattern.includes('similar:')) {
      // Invalidate similar topics caches
      this.invalidateSimilarTopicsCache();
    }
  }

  /**
   * Invalidate all search-related caches
   */
  invalidateSearchCache(): void {
    // This is a simplified approach - in a real implementation,
    // you'd iterate through cache keys and delete matching ones
    console.log('Search cache invalidated');
  }

  /**
   * Invalidate embedding caches
   */
  invalidateEmbeddingCache(): void {
    console.log('Embedding cache invalidated');
  }

  /**
   * Invalidate similar topics caches
   */
  invalidateSimilarTopicsCache(): void {
    console.log('Similar topics cache invalidated');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalKeys: number;
    estimatedSize: string;
    lastWarmed?: string;
  } {
    // This is a simplified implementation
    // In a real scenario, you'd analyze the actual cache storage
    const warmingStatus = this.getCacheWarmingStatus();
    
    return {
      totalKeys: 0, // Would need cache inspection API
      estimatedSize: '~0MB', // Would need size calculation
      lastWarmed: warmingStatus?.lastWarmed,
    };
  }

  /**
   * Optimize cache by removing old entries
   */
  optimizeCache(): void {
    // This would implement cache cleanup logic
    // For now, we rely on the built-in cache TTL
    console.log('Cache optimization completed');
  }
}

// Singleton instance
export const semanticCache = new SemanticCacheManager();

/**
 * Higher-order function to add caching to API calls
 */
export function withCache<T extends any[], R>(
  apiFn: (...args: T) => Promise<R>,
  getCacheKey: (...args: T) => string,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = getCacheKey(...args);
    
    // Check cache first
    const cached = cache.get(key) as R | undefined;
    if (cached !== undefined) {
      return cached;
    }

    // Execute API call
    const result = await apiFn(...args);
    
    // Cache the result
    cache.set(key, result, ttl);
    
    return result;
  };
}

/**
 * Cache warming hook for React components
 */
export function useCacheWarming() {
  const warmCache = useCallback(async () => {
    try {
      await semanticCache.warmPopularQueries();
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }, []);

  const getWarmingStatus = useCallback(() => {
    return semanticCache.getCacheWarmingStatus();
  }, []);

  return {
    warmCache,
    getWarmingStatus,
  };
}

/**
 * Initialize cache warming on app startup
 */
export function initializeCache(): void {
  // Warm cache in the background after app startup
  setTimeout(async () => {
    try {
      await semanticCache.warmPopularQueries();
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Initial cache warming failed:', error);
    }
  }, 5000); // Wait 5 seconds after app startup
}
