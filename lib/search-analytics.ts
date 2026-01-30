/**
 * Search Analytics and Performance Monitoring
 * Simple in-memory logging for search performance metrics
 */

import { useCallback } from 'react';
import { log } from '@/lib/logger';

interface SearchMetrics {
  query: string;
  mode: string;
  semanticWeight?: number;
  latency: number; // in milliseconds
  resultCount: number;
  timestamp: Date;
  userId?: string;
  error?: string;
  cacheHit?: boolean;
}

class SearchAnalytics {
  private metrics: SearchMetrics[] = [];
  private readonly maxMetrics: number = 1000;

  /**
   * Log a search execution with performance metrics
   */
  logSearch(metrics: Omit<SearchMetrics, 'timestamp'>): void {
    const searchMetric: SearchMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(searchMetric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log with structured logging
    log.search(
      metrics.query,
      metrics.mode,
      metrics.latency,
      metrics.resultCount,
      {
        semanticWeight: metrics.semanticWeight,
        userId: metrics.userId,
        error: metrics.error,
        cacheHit: metrics.cacheHit,
        component: 'SearchAnalytics'
      }
    );
  }

  /**
   * Get average latency for a specific search mode
   */
  getAverageLatency(mode?: string): number {
    const filtered = mode 
      ? this.metrics.filter(m => m.mode === mode && !m.error)
      : this.metrics.filter(m => !m.error);
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.latency, 0);
    return Math.round(total / filtered.length);
  }

  /**
   * Get cache hit rate for a specific mode
   */
  getCacheHitRate(mode?: string): number {
    const filtered = mode 
      ? this.metrics.filter(m => m.mode === mode)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const cacheHits = filtered.filter(m => m.cacheHit === true).length;
    return Math.round((cacheHits / filtered.length) * 100);
  }

  /**
   * Get error rate for a specific mode
   */
  getErrorRate(mode?: string): number {
    const filtered = mode 
      ? this.metrics.filter(m => m.mode === mode)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const errors = filtered.filter(m => m.error).length;
    return Math.round((errors / filtered.length) * 100);
  }

  /**
   * Get average result count for a specific mode
   */
  getAverageResultCount(mode?: string): number {
    const filtered = mode 
      ? this.metrics.filter(m => m.mode === mode && !m.error)
      : this.metrics.filter(m => !m.error);
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.resultCount, 0);
    return Math.round(total / filtered.length);
  }

  /**
   * Get most popular queries (by frequency)
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>();
    
    this.metrics.forEach(metric => {
      const query = metric.query.toLowerCase().trim();
      if (query.length > 0) {
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
      }
    });

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get performance summary for all modes
   */
  getPerformanceSummary(): {
    total: number;
    byMode: Record<string, {
      count: number;
      avgLatency: number;
      errorRate: number;
      cacheHitRate: number;
      avgResults: number;
    }>;
  } {
    const modes = ['keyword', 'semantic', 'hybrid'];
    const summary = {
      total: this.metrics.length,
      byMode: {} as Record<string, any>,
    };

    modes.forEach(mode => {
      const modeMetrics = this.metrics.filter(m => m.mode === mode);
      summary.byMode[mode] = {
        count: modeMetrics.length,
        avgLatency: this.getAverageLatency(mode),
        errorRate: this.getErrorRate(mode),
        cacheHitRate: this.getCacheHitRate(mode),
        avgResults: this.getAverageResultCount(mode),
      };
    });

    return summary;
  }

  /**
   * Get metrics from the last N minutes
   */
  getRecentMetrics(minutes: number = 60): SearchMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get current metrics count
   */
  getMetricsCount(): number {
    return this.metrics.length;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): SearchMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const searchAnalytics = new SearchAnalytics();

/**
 * Higher-order function to wrap search functions with analytics
 */
export function withSearchAnalytics<T extends any[], R>(
  searchFn: (...args: T) => Promise<R>,
  options: {
    getQueryFromArgs?: (...args: T) => string;
    getModeFromArgs?: (...args: T) => string;
    getSemanticWeightFromArgs?: (...args: T) => number;
  } = {}
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const query = options.getQueryFromArgs?.(...args) || 'unknown';
    const mode = options.getModeFromArgs?.(...args) || 'unknown';
    const semanticWeight = options.getSemanticWeightFromArgs?.(...args);

    try {
      const result = await searchFn(...args);
      const latency = Date.now() - startTime;

      // Extract result count (this is a basic implementation)
      let resultCount = 0;
      if (result && typeof result === 'object') {
        if ('topics' in result) resultCount += (result as any).topics?.length || 0;
        if ('statements' in result) resultCount += (result as any).statements?.length || 0;
        if ('documents' in result) resultCount += (result as any).documents?.length || 0;
        if ('locations' in result) resultCount += (result as any).locations?.length || 0;
      }

      searchAnalytics.logSearch({
        query,
        mode,
        semanticWeight,
        latency,
        resultCount,
        cacheHit: false, // This would be determined by cache logic
      });

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      
      searchAnalytics.logSearch({
        query,
        mode,
        semanticWeight,
        latency,
        resultCount: 0,
        error: error instanceof Error ? error.message : String(error),
        cacheHit: false,
      });

      throw error;
    }
  };
}

/**
 * Hook for monitoring search performance in React components
 */
export function useSearchAnalytics() {
  const getMetrics = useCallback(() => searchAnalytics.getPerformanceSummary(), []);
  const getPopularQueries = useCallback((limit = 10) => searchAnalytics.getPopularQueries(limit), []);
  const getRecentMetrics = useCallback((minutes = 60) => searchAnalytics.getRecentMetrics(minutes), []);

  return {
    getMetrics,
    getPopularQueries,
    getRecentMetrics,
    clear: useCallback(() => searchAnalytics.clear(), []),
  };
}
