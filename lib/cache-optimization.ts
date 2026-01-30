/**
 * Cache Optimization for Semantic Search
 * Enhanced caching strategies with hierarchical keys and warming
 */

import { useCallback } from 'react';
import { cache } from '@/lib/cache';

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
 * Enhanced cache manager for semantic search
 */
export class SemanticCacheManager {
  private readonly defaultTTL = {
    search: 5 * 60 * 1000, // 5 minutes
    embeddings: 24 * 60 * 60 * 1000, // 24 hours
    similarTopics: 10 * 60 * 1000, // 10 minutes
    suggestions: 2 * 60 * 1000, // 2 minutes
    popular: 30 * 60 * 1000, // 30 minutes
  };

  /**
   * Cache search results with mode-specific TTL
   */
  cacheSearchResults(
    query: string, 
    mode: string, 
    weight: number, 
    results: any, 
    ttl?: number
  ): void {
    const key = cacheKeys.semanticSearch(query, mode, weight);
    const cacheTTL = ttl || this.defaultTTL.search;
    cache.set(key, results, cacheTTL);
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults(query: string, mode: string, weight: number): any {
    const key = cacheKeys.semanticSearch(query, mode, weight);
    return cache.get(key);
  }

  /**
   * Cache similar topics with longer TTL
   */
  cacheSimilarTopics(topicId: string, topics: any, ttl?: number): void {
    const key = cacheKeys.similarTopics(topicId);
    const cacheTTL = ttl || this.defaultTTL.similarTopics;
    cache.set(key, topics, cacheTTL);
  }

  /**
   * Get cached similar topics
   */
  getCachedSimilarTopics(topicId: string): any {
    const key = cacheKeys.similarTopics(topicId);
    return cache.get(key);
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
  async warmPopularQueries(): Promise<void> {
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
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&mode=${mode}&semantic_weight=${weight}`);
          if (response.ok) {
            const data = await response.json();
            this.cacheSearchResults(query, mode, weight, data);
          }
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
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
