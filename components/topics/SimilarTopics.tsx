'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SimilarTopicsProps {
  topicId: string;
  limit?: number;
  className?: string;
}

interface SimilarTopic {
  id: string;
  title: string;
  content_preview: string;
  url: string;
  similarity: number;
}

export function SimilarTopics({ topicId, limit = 3, className = '' }: SimilarTopicsProps) {
  const { data: similarTopics = [], isLoading, error } = useQuery<SimilarTopic[]>({
    queryKey: ['similar-topics', topicId, limit],
    queryFn: async () => {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: topicId, // Use current topic as query
          collections: ['topics'],
          limit,
          threshold: 0.75,
          excludeIds: [topicId] // Don't show current topic
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch similar topics');
      }

      const data = await response.json();
      return data.results || [];
    },
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });

  if (isLoading) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Similar Topics</h3>
        </div>
        <div className="space-y-2">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !similarTopics?.length) {
    return null;
  }

  return (
    <div className={`border rounded-lg p-4 bg-card/50 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Similar Topics</h3>
        <span className="text-xs text-muted-foreground">
          ({similarTopics.length} found)
        </span>
      </div>
      
      <div className="space-y-3">
        {similarTopics.map((topic: SimilarTopic) => (
          <Link
            key={topic.id}
            href={topic.url}
            className="block group"
          >
            <div className="p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {topic.content_preview}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {Math.round(topic.similarity * 100)}%
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Topics discovered using semantic similarity
        </p>
      </div>
    </div>
  );
}

// Export a hook for easy use in other components
export function useSimilarTopics(topicId: string, limit = 3) {
  return useQuery<SimilarTopic[]>({
    queryKey: ['similar-topics', topicId, limit],
    queryFn: async () => {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: topicId,
          collections: ['topics'],
          limit,
          threshold: 0.75,
          excludeIds: [topicId]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch similar topics');
      }

      const data = await response.json();
      return data.results || [];
    },
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
