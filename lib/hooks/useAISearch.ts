import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResults {
  results: any[];
  total: number;
  query: string;
  suggestions: string[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAISearch() {
  const [results, setResults] = useState<SearchResults>({
    results: [],
    total: 0,
    query: '',
    suggestions: [],
    hasMore: false,
    isLoading: false,
    error: null,
  });

  const search = useCallback(async (query: string, filters?: any, limit = 20, offset = 0) => {
    if (!query || query.length < 2) return;

    setResults(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/search/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          limit,
          offset,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults({
          results: data.results || [],
          total: data.total || 0,
          query: data.query || query,
          suggestions: data.suggestions || [],
          hasMore: data.hasMore || false,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('AI search hook error:', error);
      setResults(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults({
      results: [],
      total: 0,
      query: '',
      suggestions: [],
      hasMore: false,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...results,
    search,
    clearSearch,
  };
}
