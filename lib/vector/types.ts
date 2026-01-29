/**
 * Vector Search Types
 * Type definitions for semantic search and vector embeddings
 */

export interface VectorSearchResult {
  id: string;
  type: 'topic' | 'statement';
  title: string;
  similarity: number;
  content_preview: string;
  url: string;
  metadata?: {
    category?: string;
    date_created?: string;
    [key: string]: any;
  };
}

export interface EmbeddingMetadata {
  model: string;
  dimensions: number;
  updated_at: string;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface SemanticSearchParams {
  query: string;
  collections?: ('topics' | 'statements')[];
  limit?: number;
  threshold?: number; // Minimum similarity score (0-1)
}

export interface HybridSearchResult {
  id: string;
  type: 'topic' | 'statement';
  title: string;
  score: number;
  keyword_score?: number;
  semantic_score?: number;
  content_preview: string;
  url: string;
  is_semantic_match: boolean;
}

export interface SimilaritySearchOptions {
  threshold?: number;
  limit?: number;
  excludeIds?: string[];
}

export interface VectorIndexOptions {
  lists?: number; // Number of IVFFlat lists
  probes?: number; // Number of lists to probe
}

export interface EmbeddingCacheEntry {
  embedding: number[];
  model: string;
  timestamp: number;
}

export interface CostMetrics {
  total_embeddings: number;
  total_tokens: number;
  estimated_cost: number;
  period: string;
}
