/**
 * Similarity Search
 * Vector similarity algorithms for semantic search
 */

import type { SimilaritySearchOptions } from './types';

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 is identical
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate Euclidean distance between two vectors
 * Lower values indicate higher similarity
 */
export function euclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < vectorA.length; i++) {
    const diff = vectorA[i] - vectorB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to similarity score (0-1)
 */
export function distanceToSimilarity(distance: number): number {
  return 1 / (1 + distance);
}

/**
 * Search for similar vectors in a collection
 * Used as fallback when pgvector is not available
 */
export function findSimilarVectors<T extends { id: string; embedding: number[] }>(
  queryEmbedding: number[],
  vectors: T[],
  options: SimilaritySearchOptions = {}
): Array<T & { similarity: number }> {
  const {
    threshold = 0.7,
    limit = 10,
    excludeIds = [],
  } = options;

  // Calculate similarities
  const results = vectors
    .filter(item => !excludeIds.includes(item.id))
    .map(item => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

/**
 * Normalize scores to 0-1 range
 */
export function normalizeScores<T extends { score: number }>(
  items: T[]
): Array<T & { normalized_score: number }> {
  if (items.length === 0) return [];

  const maxScore = Math.max(...items.map(item => item.score));
  const minScore = Math.min(...items.map(item => item.score));

  if (maxScore === minScore) {
    return items.map(item => ({
      ...item,
      normalized_score: 1,
    }));
  }

  return items.map(item => ({
    ...item,
    normalized_score: (item.score - minScore) / (maxScore - minScore),
  }));
}

/**
 * Combine and deduplicate search results from multiple sources
 */
export function mergeSearchResults<T extends { id: string; score: number }>(
  results: T[][],
  options?: {
    limit?: number;
    deduplicateBy?: keyof T;
  }
): T[] {
  const { limit = 10, deduplicateBy = 'id' as keyof T } = options || {};

  // Flatten all results
  const allResults = results.flat();

  // Deduplicate - keep highest scoring version
  const deduped = new Map<string | number, T>();
  for (const result of allResults) {
    const key = String(result[deduplicateBy]);
    const existing = deduped.get(key);

    if (!existing || result.score > existing.score) {
      deduped.set(key, result);
    }
  }

  // Sort and limit
  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Calculate weighted hybrid score
 * Combines keyword and semantic scores with configurable weights
 */
export function calculateHybridScore(
  keywordScore: number,
  semanticScore: number,
  options?: {
    keywordWeight?: number;
    semanticWeight?: number;
  }
): number {
  const {
    keywordWeight = 0.4,
    semanticWeight = 0.6,
  } = options || {};

  // Ensure weights sum to 1
  const totalWeight = keywordWeight + semanticWeight;
  const normalizedKeywordWeight = keywordWeight / totalWeight;
  const normalizedSemanticWeight = semanticWeight / totalWeight;

  return (keywordScore * normalizedKeywordWeight) + (semanticScore * normalizedSemanticWeight);
}

/**
 * Cluster vectors using K-means algorithm
 * Useful for discovering conceptual groupings
 */
export function kMeansClustering(
  vectors: Array<{ id: string; embedding: number[] }>,
  k: number,
  maxIterations: number = 100
): Array<{
  centroid: number[];
  members: Array<{ id: string; embedding: number[]; distance: number }>;
}> {
  if (vectors.length === 0 || k <= 0) {
    return [];
  }

  // Initialize centroids randomly
  const centroids: number[][] = [];
  const shuffled = [...vectors].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(k, vectors.length); i++) {
    centroids.push([...shuffled[i].embedding]);
  }

  let clusters: Array<Array<{ id: string; embedding: number[]; distance: number }>> = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign vectors to nearest centroid
    clusters = centroids.map(() => []);

    for (const vector of vectors) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = euclideanDistance(vector.embedding, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push({
        ...vector,
        distance: minDistance,
      });
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length === 0) continue;

      const dimensions = centroids[i].length;
      const newCentroid = new Array(dimensions).fill(0);

      for (const member of clusters[i]) {
        for (let d = 0; d < dimensions; d++) {
          newCentroid[d] += member.embedding[d];
        }
      }

      for (let d = 0; d < dimensions; d++) {
        newCentroid[d] /= clusters[i].length;
      }

      // Check for convergence
      const centroidShift = euclideanDistance(centroids[i], newCentroid);
      if (centroidShift > 0.001) {
        converged = false;
      }

      centroids[i] = newCentroid;
    }

    if (converged) break;
  }

  return centroids.map((centroid, i) => ({
    centroid,
    members: clusters[i] || [],
  }));
}

/**
 * Find the N most representative items from a cluster
 * (Items closest to the centroid)
 */
export function findRepresentativeItems<T extends { id: string; embedding: number[] }>(
  items: T[],
  n: number = 5
): T[] {
  if (items.length === 0) return [];

  // Calculate centroid
  const dimensions = items[0].embedding.length;
  const centroid = new Array(dimensions).fill(0);

  for (const item of items) {
    for (let d = 0; d < dimensions; d++) {
      centroid[d] += item.embedding[d];
    }
  }

  for (let d = 0; d < dimensions; d++) {
    centroid[d] /= items.length;
  }

  // Find items closest to centroid
  return items
    .map(item => ({
      item,
      distance: euclideanDistance(item.embedding, centroid),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n)
    .map(({ item }) => item);
}
