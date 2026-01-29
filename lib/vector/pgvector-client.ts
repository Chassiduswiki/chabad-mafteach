/**
 * PostgreSQL Vector Client
 * Wrapper for pgvector operations with JSON fallback
 */

import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { cosineSimilarity, findSimilarVectors } from './similarity-search';
import type { VectorSearchResult, SimilaritySearchOptions, VectorIndexOptions } from './types';

const directus = createClient();

/**
 * Check if pgvector extension is available
 * This is a simplified check - in production you may want to query pg_extension
 */
export async function isPgVectorAvailable(): Promise<boolean> {
  try {
    // Try to fetch a topic with an embedding
    // This doesn't actually check for pgvector, but checks if embeddings exist
    // For now, we'll assume JSON fallback unless explicitly configured
    // TODO: Add proper pgvector detection via custom endpoint
    return false; // Default to JSON fallback for safety
  } catch (error) {
    console.warn('Error checking pgvector availability, using JSON fallback');
    return false;
  }
}

/**
 * Search topics by vector similarity using pgvector
 */
export async function searchTopicsByVector(
  queryEmbedding: number[],
  options: SimilaritySearchOptions = {}
): Promise<VectorSearchResult[]> {
  const {
    threshold = 0.7,
    limit = 10,
    excludeIds = [],
  } = options;

  const hasPgVector = await isPgVectorAvailable();

  if (hasPgVector) {
    // Use native pgvector operations
    return searchWithPgVector('topics', queryEmbedding, { threshold, limit, excludeIds });
  } else {
    // Fallback to JSON with application-level similarity
    return searchWithJsonFallback('topics', queryEmbedding, { threshold, limit, excludeIds });
  }
}

/**
 * Search statements by vector similarity using pgvector
 */
export async function searchStatementsByVector(
  queryEmbedding: number[],
  options: SimilaritySearchOptions = {}
): Promise<VectorSearchResult[]> {
  const {
    threshold = 0.7,
    limit = 10,
    excludeIds = [],
  } = options;

  const hasPgVector = await isPgVectorAvailable();

  if (hasPgVector) {
    return searchWithPgVector('statements', queryEmbedding, { threshold, limit, excludeIds });
  } else {
    return searchWithJsonFallback('statements', queryEmbedding, { threshold, limit, excludeIds });
  }
}

/**
 * Search using native pgvector extension
 * NOTE: This requires custom SQL endpoint in Directus
 * For now, falls back to JSON method
 */
async function searchWithPgVector(
  collection: 'topics' | 'statements',
  queryEmbedding: number[],
  options: SimilaritySearchOptions
): Promise<VectorSearchResult[]> {
  // TODO: Implement native pgvector search when custom endpoint is available
  // For now, use JSON fallback
  console.warn('Native pgvector not yet implemented, using JSON fallback');
  return searchWithJsonFallback(collection, queryEmbedding, options);
}

/**
 * Search using JSON fallback with application-level similarity
 */
async function searchWithJsonFallback(
  collection: 'topics' | 'statements',
  queryEmbedding: number[],
  options: SimilaritySearchOptions
): Promise<VectorSearchResult[]> {
  const { threshold = 0.7, limit = 10, excludeIds = [] } = options;

  try {
    // Fetch all items with embeddings
    // In production, this should be paginated or cached
    const items = await directus.request(
      readItems(collection, {
        fields: ['id', 'canonical_title', 'slug', 'description', 'text', 'embedding', 'date_created'] as any,
        filter: {
          embedding: { _nnull: true },
        } as any,
        limit: 1000, // Reasonable limit for fallback
      })
    );

    const data = items || [];

    // Parse JSON embeddings and calculate similarity
    const itemsWithEmbeddings = data
      .map((item: any) => {
        try {
          const embedding = typeof item.embedding === 'string'
            ? JSON.parse(item.embedding)
            : item.embedding;

          return {
            ...item,
            embedding: Array.isArray(embedding) ? embedding : null,
          };
        } catch (error) {
          return { ...item, embedding: null };
        }
      })
      .filter((item: any) => item.embedding !== null);

    // Find similar vectors
    const similar = findSimilarVectors(
      queryEmbedding,
      itemsWithEmbeddings,
      { threshold, limit, excludeIds }
    );

    return formatSearchResults(collection, similar);
  } catch (error) {
    console.error('Error searching with JSON fallback:', error);
    return [];
  }
}

/**
 * Format search results into standardized structure
 */
function formatSearchResults(
  collection: 'topics' | 'statements',
  results: any[]
): VectorSearchResult[] {
  return results.map((item: any) => {
    const type = collection === 'topics' ? 'topic' : 'statement';
    const title = item.canonical_title || item.text?.slice(0, 100) || 'Untitled';
    const preview = item.description || item.text?.slice(0, 200) || '';

    return {
      id: item.id,
      type,
      title,
      similarity: item.similarity || 0,
      content_preview: preview,
      url: type === 'topic' ? `/topics/${item.slug}` : `/statements/${item.id}`,
      metadata: {
        category: item.topic_type,
        date_created: item.date_created,
      },
    };
  });
}

/**
 * Store embedding for a topic
 */
export async function storeTopicEmbedding(
  topicId: string,
  embedding: number[],
  model: string = 'text-embedding-3-small'
): Promise<void> {
  const hasPgVector = await isPgVectorAvailable();

  try {
    const embeddingData = hasPgVector
      ? `[${embedding.join(',')}]` // pgvector format
      : JSON.stringify(embedding); // JSON fallback

    await directus.request(
      updateItem('topics', topicId, {
        embedding: embeddingData,
        embedding_model: model,
        embedding_updated_at: new Date().toISOString(),
      } as any)
    );
  } catch (error) {
    console.error(`Error storing embedding for topic ${topicId}:`, error);
    throw error;
  }
}

/**
 * Store embedding for a statement
 */
export async function storeStatementEmbedding(
  statementId: string,
  embedding: number[],
  model: string = 'text-embedding-3-small'
): Promise<void> {
  const hasPgVector = await isPgVectorAvailable();

  try {
    const embeddingData = hasPgVector
      ? `[${embedding.join(',')}]`
      : JSON.stringify(embedding);

    await directus.request(
      updateItem('statements', statementId, {
        embedding: embeddingData,
        embedding_model: model,
        embedding_updated_at: new Date().toISOString(),
      } as any)
    );
  } catch (error) {
    console.error(`Error storing embedding for statement ${statementId}:`, error);
    throw error;
  }
}

/**
 * Create vector index (if pgvector is available)
 */
export async function createVectorIndex(
  collection: 'topics' | 'statements',
  options: VectorIndexOptions = {}
): Promise<void> {
  const hasPgVector = await isPgVectorAvailable();

  if (!hasPgVector) {
    console.warn('pgvector not available, skipping index creation');
    return;
  }

  const { lists = 100 } = options;

  try {
    // This would require direct SQL access or custom Directus endpoint
    // Placeholder for when this becomes available
    console.info(`Creating vector index for ${collection} with ${lists} lists`);

    // Example SQL (would need to be executed through custom endpoint):
    // CREATE INDEX ${collection}_embedding_idx ON ${collection}
    // USING ivfflat (embedding vector_cosine_ops) WITH (lists = ${lists});
  } catch (error) {
    console.error(`Error creating vector index for ${collection}:`, error);
  }
}

/**
 * Get items without embeddings (for batch processing)
 */
export async function getItemsWithoutEmbeddings(
  collection: 'topics' | 'statements',
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const items = await directus.request(
      readItems(collection, {
        fields: ['id', 'canonical_title', 'slug', 'description', 'text', 'overview'] as any,
        filter: {
          _or: [
            { embedding: { _null: true } },
            { embedding: { _eq: '' } },
          ],
        } as any,
        limit,
        offset,
      })
    );

    return items || [];
  } catch (error) {
    console.error(`Error fetching items without embeddings:`, error);
    return [];
  }
}
