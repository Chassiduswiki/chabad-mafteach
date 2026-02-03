import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

interface SearchOptions {
  mode?: 'keyword' | 'semantic' | 'hybrid';
  semanticWeight?: number;
  enabled?: boolean;
  debounceMs?: number;
}

interface SearchResult {
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    definition_short?: string;
    url: string;
    is_semantic_match?: boolean;
    semantic_score?: number;
    hybrid_score?: number;
    keyword_score?: number;
  }>;
  statements: Array<{
    id: string;
    title: string;
    content_preview?: string;
    url: string;
    is_semantic_match?: boolean;
    semantic_score?: number;
    hybrid_score?: number;
    keyword_score?: number;
  }>;
  documents: Array<{
    id: string;
    title: string;
    author?: string;
    doc_type?: string;
    category?: string;
    url: string;
  }>;
  locations: Array<{
    id: string;
    title: string;
    content_preview?: string;
    url: string;
  }>;
  mode: string;
}

interface UseSemanticSearchResult {
  data: SearchResult | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSemanticSearch(
  query: string,
  options: SearchOptions = {}
): UseSemanticSearchResult {
  const {
    mode = 'keyword',
    semanticWeight = 0.6,
    enabled = true,
    debounceMs = 300,
  } = options;

  // Create debounced query function
  const debouncedQuery = useCallback(
    (searchQuery: string) => {
      return new Promise<string>((resolve) => {
        const timer = setTimeout(() => {
          resolve(searchQuery.trim());
        }, debounceMs);
        return timer;
      });
    },
    [debounceMs]
  );

  const { data, isLoading, error, refetch } = useQuery<SearchResult>({
    queryKey: ['search', query, mode, semanticWeight],
    queryFn: async () => {
      if (!query.trim()) {
        return {
          topics: [],
          statements: [],
          documents: [],
          locations: [],
          mode,
        };
      }

      // Build search URL with parameters
      const params = new URLSearchParams({
        q: query.trim(),
        mode,
        semantic_weight: semanticWeight.toString(),
      });

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    retry: (failureCount, error) => {
      // Retry on network errors, but not on 4xx errors
      if (error.message.includes('Search failed: 4')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// Hook for getting search suggestions based on partial input
export function useSearchSuggestions(partialQuery: string, options: SearchOptions = {}) {
  const { mode = 'hybrid', semanticWeight = 0.6, enabled = true } = options;

  return useQuery({
    queryKey: ['search-suggestions', partialQuery, mode, semanticWeight],
    queryFn: async () => {
      if (!partialQuery.trim() || partialQuery.length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        q: partialQuery.trim(),
        mode,
        semantic_weight: semanticWeight.toString(),
      });

      const response = await fetch(`/api/search?${params}&limit=5`);
      
      if (!response.ok) {
        throw new Error(`Suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Combine all result types and extract titles/names for suggestions
      const suggestions = [
        ...(data.topics || []).map((t: any) => t.name || t.title),
        ...(data.documents || []).map((d: any) => d.title),
        ...(data.statements || []).map((s: any) => s.title),
      ].filter(Boolean).slice(0, 5);

      return suggestions;
    },
    enabled: enabled && partialQuery.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
}

// Hook for getting popular searches (cache warming)
export function usePopularSearches() {
  const popularQueries = [
    'bitul',
    'emunah', 
    'ratzon',
    'taanug',
    'humility',
    'faith',
    'will',
    'pleasure'
  ];

  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      // Warm cache with popular queries
      const promises = popularQueries.map(async (query) => {
        try {
          const params = new URLSearchParams({
            q: query,
            mode: 'hybrid',
            semantic_weight: '0.6',
          });

          const response = await fetch(`/api/search?${params}&limit=3`);
          if (response.ok) {
            return { query, success: true };
          }
          return { query, success: false };
        } catch (error) {
          return { query, success: false };
        }
      });

      const results = await Promise.all(promises);
      return results;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
    refetchInterval: 60 * 60 * 1000, // Refresh every hour
  });
}
