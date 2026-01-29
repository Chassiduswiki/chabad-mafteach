# Vector Search Implementation

This directory contains the semantic search implementation using vector embeddings for the Chabad Research platform.

## Overview

The vector search system enables users to find content by meaning and concept, not just keywords. For example, searching for "humility" will find topics about "bitul" (self-nullification) even without a direct keyword match.

### Key Features

- **Semantic Search**: Find content by meaning using vector embeddings
- **Hybrid Search**: Combine keyword and semantic search for best results
- **Multilingual Support**: Works with both Hebrew and English content
- **Cost-Effective**: ~$5-10/month ongoing costs
- **Graceful Fallback**: Works with or without pgvector extension

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         v                 v                 v
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Keyword Search │ │Semantic Search│ │ Cache Layer  │
│  (Directus)    │ │  (OpenRouter) │ │ (In-Memory)  │
└────────┬───────┘ └───────┬──────┘ └──────┬───────┘
         │                 │                │
         └────────┬────────┴────────────────┘
                  │
                  v
         ┌────────────────┐
         │ Score Fusion   │
         │ (40%/60% mix)  │
         └────────┬───────┘
                  │
                  v
         ┌────────────────┐
         │ Ranked Results │
         └────────────────┘
```

## Directory Structure

```
lib/vector/
├── README.md                    # This file
├── types.ts                     # TypeScript type definitions
├── embedding-service.ts         # OpenRouter API integration
├── pgvector-client.ts          # PostgreSQL vector operations
└── similarity-search.ts        # Similarity algorithms
```

## Core Components

### 1. Embedding Service (`embedding-service.ts`)

Handles text embedding generation via OpenRouter API.

**Key Functions:**
- `generateEmbedding(request)` - Generate embedding for text
- `generateEmbeddingsBatch(texts)` - Batch processing
- `prepareTextForEmbedding(fields)` - Text preparation
- `estimateEmbeddingCost(textLength)` - Cost estimation

**Features:**
- Automatic rate limiting (100 requests/minute)
- Response caching (24 hours)
- Hebrew + English support
- Text truncation for long content

**Example:**
```typescript
import { generateEmbedding, prepareTextForEmbedding } from '@/lib/vector/embedding-service';

const text = prepareTextForEmbedding({
  canonical_title: 'Bitul',
  description: 'Self-nullification in Chassidic thought',
  overview: 'The concept of bitul...',
});

const { embedding, model, dimensions } = await generateEmbedding({ text });
// embedding: number[] (512 dimensions)
// model: 'text-embedding-3-small'
```

### 2. pgvector Client (`pgvector-client.ts`)

Manages PostgreSQL vector operations with automatic fallback.

**Key Functions:**
- `searchTopicsByVector(embedding, options)` - Search topics
- `searchStatementsByVector(embedding, options)` - Search statements
- `storeTopicEmbedding(id, embedding, model)` - Store topic embedding
- `storeStatementEmbedding(id, embedding, model)` - Store statement embedding
- `isPgVectorAvailable()` - Check pgvector extension

**Features:**
- Automatic pgvector detection
- JSON fallback for non-pgvector databases
- Cosine similarity search
- Threshold filtering

**Example:**
```typescript
import { searchTopicsByVector } from '@/lib/vector/pgvector-client';

const results = await searchTopicsByVector(queryEmbedding, {
  threshold: 0.7,  // Minimum similarity (0-1)
  limit: 10,       // Max results
  excludeIds: [],  // IDs to exclude
});

// results: VectorSearchResult[]
// [{ id, type, title, similarity, content_preview, url, metadata }]
```

### 3. Similarity Search (`similarity-search.ts`)

Vector similarity algorithms and utilities.

**Key Functions:**
- `cosineSimilarity(vectorA, vectorB)` - Calculate similarity
- `findSimilarVectors(query, vectors, options)` - Find similar items
- `calculateHybridScore(keyword, semantic, weights)` - Combine scores
- `normalizeScores(items)` - Normalize to [0, 1]
- `mergeSearchResults(results, options)` - Deduplicate and merge
- `kMeansClustering(vectors, k)` - Cluster similar items

**Example:**
```typescript
import { calculateHybridScore, cosineSimilarity } from '@/lib/vector/similarity-search';

// Calculate similarity between two embeddings
const similarity = cosineSimilarity(embedding1, embedding2);
// Returns: 0.87 (high similarity)

// Combine keyword and semantic scores
const finalScore = calculateHybridScore(
  0.8,  // keyword score
  0.9,  // semantic score
  { keywordWeight: 0.4, semanticWeight: 0.6 }
);
// Returns: 0.86 (weighted average)
```

## API Endpoints

### 1. Semantic Search API

**Endpoint:** `POST /api/search/semantic`

**Request:**
```json
{
  "query": "humility and self-nullification",
  "collections": ["topics", "statements"],
  "limit": 10,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "123",
      "type": "topic",
      "title": "Bitul",
      "similarity": 0.92,
      "content_preview": "Self-nullification in Chassidic thought...",
      "url": "/topics/bitul",
      "metadata": { "category": "concept" }
    }
  ],
  "query": "humility and self-nullification",
  "cached": false,
  "metadata": {
    "total_results": 1,
    "collections_searched": ["topics", "statements"],
    "threshold": 0.7,
    "model": "text-embedding-3-small"
  }
}
```

### 2. Hybrid Search API

**Endpoint:** `GET /api/search?q={query}&mode=hybrid`

**Query Parameters:**
- `q` - Search query (required)
- `mode` - Search mode: `keyword`, `semantic`, or `hybrid` (default: `keyword`)
- `semantic_weight` - Weight for semantic results: 0.0-1.0 (default: 0.6)

**Response:**
```json
{
  "topics": [
    {
      "id": "123",
      "name": "Bitul",
      "slug": "bitul",
      "hybrid_score": 0.87,
      "keyword_score": 0.8,
      "semantic_score": 0.92,
      "is_semantic_match": true,
      "url": "/topics/bitul"
    }
  ],
  "statements": [...],
  "mode": "hybrid"
}
```

### 3. Generate Embedding API

**Endpoint:** `POST /api/embeddings/generate`

**Request:**
```json
{
  "collection": "topics",
  "item_id": "123",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Embedding generated successfully",
  "item_id": "123",
  "collection": "topics",
  "model": "text-embedding-3-small",
  "dimensions": 512,
  "text_length": 342
}
```

## Database Schema

### Topics Table

```sql
ALTER TABLE topics
ADD COLUMN embedding vector(512),          -- or JSONB for fallback
ADD COLUMN embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
ADD COLUMN embedding_updated_at TIMESTAMP;

CREATE INDEX topics_embedding_idx ON topics
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Statements Table

```sql
ALTER TABLE statements
ADD COLUMN embedding vector(512),          -- or JSONB for fallback
ADD COLUMN embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
ADD COLUMN embedding_updated_at TIMESTAMP;

CREATE INDEX statements_embedding_idx ON statements
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Usage Examples

### Basic Semantic Search

```typescript
import { generateEmbedding } from '@/lib/vector/embedding-service';
import { searchTopicsByVector } from '@/lib/vector/pgvector-client';

// Generate query embedding
const { embedding } = await generateEmbedding({
  text: 'What is bitul in Chassidic philosophy?'
});

// Search for similar topics
const results = await searchTopicsByVector(embedding, {
  threshold: 0.7,
  limit: 10,
});

console.log(results);
// [{ id, title, similarity, url, ... }]
```

### Hybrid Search with Custom Weights

```typescript
import { calculateHybridScore } from '@/lib/vector/similarity-search';

// Get keyword results
const keywordResults = await keywordSearch(query);

// Get semantic results
const semanticResults = await semanticSearch(query);

// Merge with custom weights
const mergedResults = mergeResults(keywordResults, semanticResults, {
  keywordWeight: 0.3,  // 30% keyword
  semanticWeight: 0.7, // 70% semantic
});
```

### Find Similar Content

```typescript
import { searchTopicsByVector } from '@/lib/vector/pgvector-client';

// Get current topic's embedding
const currentTopic = await getTopicWithEmbedding(topicId);

// Find similar topics
const similarTopics = await searchTopicsByVector(
  currentTopic.embedding,
  {
    threshold: 0.75,
    limit: 5,
    excludeIds: [topicId], // Exclude current topic
  }
);
```

## Performance Considerations

### Caching Strategy

**Query Embeddings:** 24 hours
- Common queries cached to avoid API calls
- Significant cost savings for repeated searches

**Search Results:** 5 minutes
- Balance between freshness and performance
- Aligns with keyword search cache

**Similar Items:** 1 hour
- Relatively stable relationships
- Good balance for "Related Topics" widgets

### Rate Limiting

- **Embedding Generation:** 100 requests/minute (OpenRouter limit)
- **Semantic Search:** 60 requests/minute per IP
- **Batch Processing:** 50 items per batch with 1s delay

### Database Optimization

**pgvector Indexes:**
- IVFFlat for 1K-1M vectors
- Lists = dataset_size / 1000 (100-1000 range)
- Cosine similarity operator for semantic search

**JSON Fallback:**
- Application-level similarity calculation
- 2-5x slower but acceptable for MVP
- No special indexes needed

## Cost Analysis

### Initial Generation
- 50K items × 200 tokens avg = 10M tokens
- Cost: 10M × $0.02/1M = **$0.20 one-time**

### Ongoing Monthly
- 1K new items × 200 tokens = 200K tokens
- Cost: 200K × $0.02/1M = **$0.004/month**
- Plus API overhead: **~$5-10/month total**

### Cost Optimization
1. **Aggressive caching** - Reduce duplicate API calls
2. **Batch processing** - More efficient than real-time
3. **Selective embedding** - Only published content
4. **Lazy generation** - Generate on-demand for older content

## Troubleshooting

### No Results Returned

**Check embeddings exist:**
```sql
SELECT COUNT(*) FROM topics WHERE embedding IS NOT NULL;
```

**Adjust threshold:**
```typescript
// Too strict
searchTopicsByVector(embedding, { threshold: 0.9 });

// More lenient
searchTopicsByVector(embedding, { threshold: 0.6 });
```

### Poor Search Quality

**Increase semantic weight:**
```
GET /api/search?q=bitul&mode=hybrid&semantic_weight=0.8
```

**Regenerate embeddings:**
```bash
npx tsx scripts/generate-embeddings.ts --no-resume
```

### High Latency

**Check pgvector availability:**
```typescript
import { isPgVectorAvailable } from '@/lib/vector/pgvector-client';
const available = await isPgVectorAvailable();
```

**Optimize limits:**
```typescript
// Reduce result count
searchTopicsByVector(embedding, { limit: 5 });
```

### Rate Limit Errors

**Reduce batch size:**
```bash
npx tsx scripts/generate-embeddings.ts --batch-size=25
```

**Add delays:**
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

## Future Enhancements

### Planned Features
- [ ] Question answering (RAG)
- [ ] Personalized search weights
- [ ] Semantic autocomplete
- [ ] Content recommendations
- [ ] Visual similarity (Hebrew text images)

### Advanced Algorithms
- [ ] HNSW indexes (pgvector 0.5+)
- [ ] Query expansion with embeddings
- [ ] Multi-vector search (title + content separately)
- [ ] Temporal decay for freshness
- [ ] User feedback integration

## References

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Semantic Search Best Practices](https://www.pinecone.io/learn/semantic-search/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review setup guide: `docs/SEMANTIC_SEARCH_SETUP.md`
3. Check implementation plan for context
4. Open an issue on GitHub

---

**Last Updated:** 2026-01-28
**Status:** Phase 1 Complete (MVP)
