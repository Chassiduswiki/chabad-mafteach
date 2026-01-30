/**
 * Vector Search Module
 * Centralized exports for semantic search functionality
 */

// Types
export * from './types';

// Embedding Service
export {
  generateEmbedding,
  generateEmbeddingsBatch,
  prepareTextForEmbedding,
  clearEmbeddingCache,
  getEmbeddingQueueStatus,
} from './embedding-service';

// pgvector Client
export {
  isPgVectorAvailable,
  searchTopicsByVector,
  searchStatementsByVector,
  storeTopicEmbedding,
  storeStatementEmbedding,
  createVectorIndex,
  getItemsWithoutEmbeddings,
} from './pgvector-client';

// Similarity Search
export {
  cosineSimilarity,
  euclideanDistance,
  distanceToSimilarity,
  findSimilarVectors,
  normalizeScores,
  mergeSearchResults,
  calculateHybridScore,
  kMeansClustering,
  findRepresentativeItems,
} from './similarity-search';
