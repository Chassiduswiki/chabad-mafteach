import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Topic } from '@/lib/types';

const directus = createClient();

// Simple in-memory cache for frequently accessed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cache keys
const CACHE_KEYS = {
  TOPICS_ALL: 'topics:all',
  TOPICS_DISCOVERY: 'topics:discovery',
  TOPICS_FEATURED: 'topics:featured',
  DOCUMENTS_BY_TYPE: (type: string) => `documents:type:${type}`,
  SEARCH_RESULTS: (query: string) => `search:${query}`
} as const;

// Cached function wrappers
export const getCachedTopics = async (filter?: any, limit?: number): Promise<Topic[]> => {
  const cacheKey = filter ? `topics:filtered:${JSON.stringify(filter)}` : CACHE_KEYS.TOPICS_ALL;

  // Try cache first
  const cached = cache.get<Topic[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from Directus
  const topics = await directus.request(
    readItems('topics', {
      fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
      filter,
      limit,
      sort: ['canonical_title']
    })
  ) as Topic[];

  // Cache for 10 minutes (topics don't change frequently)
  cache.set(cacheKey, topics, 10 * 60 * 1000);

  return topics;
};

export const getCachedDiscoveryTopics = async (): Promise<{
  featuredTopic: Topic | null;
  recentTopics: Topic[];
  recentSources: any[];
}> => {
  const cacheKey = CACHE_KEYS.TOPICS_DISCOVERY;

  // Try cache first
  const cached = cache.get<{
    featuredTopic: Topic | null;
    recentTopics: Topic[];
    recentSources: any[];
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch topics for discovery
  const topics = await getCachedTopics({}, 50);

  const featuredTopic = topics.length > 0
    ? topics[Math.floor(Math.random() * topics.length)]
    : null;

  const recentTopics = topics.slice(0, 5);
  const recentSources: any[] = []; // Empty for now, as per original logic

  const result = {
    featuredTopic,
    recentTopics,
    recentSources
  };

  // Cache for 15 minutes (discovery data can be slightly stale)
  cache.set(cacheKey, result, 15 * 60 * 1000);

  return result;
};

export const getCachedDocuments = async (docType?: string): Promise<any[]> => {
  const cacheKey = docType ? CACHE_KEYS.DOCUMENTS_BY_TYPE(docType) : 'documents:all';

  // Try cache first
  const cached = cache.get<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Build filter - use proper typing to avoid schema conflicts
  const filter: any = docType ? { doc_type: { _eq: docType as 'entry' | 'sefer' } } : {};

  // Fetch from Directus
  const documents = await directus.request(
    readItems('documents', {
      filter,
      fields: ['id', 'title', 'doc_type'],
      limit: -1,
      sort: ['title']
    })
  ) as any[];

  // Cache for 30 minutes (documents change less frequently)
  cache.set(cacheKey, documents, 30 * 60 * 1000);

  return documents;
};

// Cache management functions
export const clearCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }

  // Clear cache entries matching pattern
  for (const key of cache['cache'].keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

export const getCacheStats = (): { entries: number; size: string } => {
  const entries = cache['cache'].size;
  // Rough estimate of memory usage
  let sizeEstimate = 0;
  for (const [key, entry] of cache['cache'].entries()) {
    sizeEstimate += key.length + JSON.stringify(entry.data).length;
  }

  return {
    entries,
    size: `${(sizeEstimate / 1024).toFixed(1)} KB`
  };
};

// Periodic cleanup (run this in a background process)
export const startCacheCleanup = (intervalMs: number = 10 * 60 * 1000): void => {
  setInterval(() => {
    cache.cleanup();
  }, intervalMs);
};

// Export cache instance for advanced usage
export { cache };
