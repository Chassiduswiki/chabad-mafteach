# Semantic Search Setup Guide

This guide walks through setting up semantic search with vector embeddings for the Chabad Research platform.

## Prerequisites

- OpenRouter API key configured (`OPENROUTER_API_KEY` environment variable)
- Access to Directus Cloud database (or local Directus instance)
- Node.js and TypeScript installed

## Step 1: Enable pgvector Extension

The pgvector extension enables efficient vector similarity search in PostgreSQL.

### Option A: Directus Cloud

Contact Directus Cloud support to enable the pgvector extension for your database:

```
Subject: Enable pgvector extension

Hello,

Could you please enable the pgvector extension for my Directus Cloud database?
I need it for implementing semantic search with vector embeddings.

Database: [Your project name]
Extension: pgvector (https://github.com/pgvector/pgvector)

Thank you!
```

### Option B: Self-Hosted Directus

If running Directus locally or on a self-hosted instance:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Verify Installation

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

If the query returns a row, pgvector is installed successfully.

## Step 2: Add Database Columns

Run the migration script to add embedding columns to the database.

### Via Directus SQL Editor

1. Log into Directus admin panel
2. Navigate to Settings > Data Model
3. Use custom SQL or Directus UI to add columns

### Via Direct SQL (if available)

```bash
psql $DATABASE_URL < scripts/migrations/add-vector-columns.sql
```

### Via Directus UI (Recommended for Directus Cloud)

For each table (topics and statements):

1. Open the collection in Directus admin
2. Go to "Fields" tab
3. Add the following fields:

**Field 1: embedding**
- Type: `JSON` (if pgvector available, use custom field type)
- Interface: Input (raw value)
- Options: Allow null = true

**Field 2: embedding_model**
- Type: `String`
- Interface: Input
- Default value: `text-embedding-3-small`
- Options: Allow null = true

**Field 3: embedding_updated_at**
- Type: `Timestamp`
- Interface: Datetime
- Options: Allow null = true

## Step 3: Generate Initial Embeddings

Run the embedding generation script to create embeddings for all existing content.

```bash
# Dry run first to estimate cost and time
npx tsx scripts/generate-embeddings.ts --dry-run

# Generate embeddings for topics only
npx tsx scripts/generate-embeddings.ts --collection=topics

# Generate embeddings for statements only
npx tsx scripts/generate-embeddings.ts --collection=statements

# Generate embeddings for all collections (default)
npx tsx scripts/generate-embeddings.ts

# Customize batch size (default: 50)
npx tsx scripts/generate-embeddings.ts --batch-size=100
```

### Expected Output

```
============================================================
EMBEDDING GENERATION SCRIPT
============================================================

Options:
  Collection: all
  Batch size: 50
  Dry run: false
  Resume mode: true

============================================================

[INFO] Starting topic processing...
[INFO] Processing batch of 50 topics (offset: 0)
[SUCCESS] Generated embedding for topic: Bitul (123)
[PROGRESS] 20.0% (10/50) - Topics processed
...
[INFO] Topic processing complete

[INFO] Starting statement processing...
...

============================================================
EMBEDDING GENERATION SUMMARY
============================================================

Topics:
  Processed: 150
  Succeeded: 148
  Failed: 2
  Skipped: 0

Statements:
  Processed: 500
  Succeeded: 495
  Failed: 5
  Skipped: 0

Overall:
  Total processed: 650
  Total succeeded: 643
  Total failed: 7
  Total skipped: 0
  Estimated cost: $0.0782
  Time elapsed: 45.3 minutes

============================================================
```

### Troubleshooting

**Rate limit errors:**
- The script automatically handles rate limiting (100 requests/minute)
- If errors persist, reduce batch size: `--batch-size=25`

**API errors:**
- Verify `OPENROUTER_API_KEY` is set correctly
- Check OpenRouter API status: https://openrouter.ai/status

**Memory issues:**
- Process in smaller batches
- Run separately for each collection

**Resume after interruption:**
- The script is idempotent - just run it again
- It will skip items that already have embeddings

## Step 4: Test Semantic Search

### Test the Semantic Search API

```bash
# Semantic search for topics
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "humility and self-nullification",
    "collections": ["topics"],
    "limit": 10,
    "threshold": 0.7
  }'

# Test Hebrew query
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "בטול",
    "collections": ["topics"],
    "limit": 10
  }'
```

### Test Hybrid Search

```bash
# Hybrid search (keyword + semantic)
curl "http://localhost:3000/api/search?q=bitul&mode=hybrid&semantic_weight=0.6"

# Semantic-only search
curl "http://localhost:3000/api/search?q=humility&mode=semantic"

# Keyword-only search (default)
curl "http://localhost:3000/api/search?q=bitul&mode=keyword"
```

### Expected Response

```json
{
  "documents": [],
  "locations": [],
  "topics": [
    {
      "id": "123",
      "name": "Bitul",
      "slug": "bitul",
      "category": "concept",
      "definition_short": "Self-nullification...",
      "url": "/topics/bitul",
      "hybrid_score": 0.87,
      "keyword_score": 0.8,
      "semantic_score": 0.92,
      "is_semantic_match": true
    }
  ],
  "statements": [],
  "seforim": [],
  "mode": "hybrid"
}
```

## Step 5: Configure Automatic Embedding Generation

Set up automatic embedding generation for new content using Directus Flows.

### Create Directus Flow

1. Navigate to Settings > Flows in Directus admin
2. Click "Create Flow"
3. Configure:
   - **Name**: Generate Embeddings on Create/Update
   - **Status**: Active
   - **Trigger**: Event Hook
   - **Collections**: topics, statements
   - **Events**: items.create, items.update

4. Add Webhook Operation:
   - **Method**: POST
   - **URL**: `https://your-domain.com/api/embeddings/generate`
   - **Body**:
     ```json
     {
       "collection": "{{$trigger.collection}}",
       "item_id": "{{$trigger.key}}"
     }
     ```

### Alternative: Scheduled Job

If Directus Flows are not available, set up a cron job:

```bash
# Add to crontab (runs every 15 minutes)
*/15 * * * * cd /path/to/project && npx tsx scripts/generate-embeddings.ts --resume
```

## Step 6: Monitor and Optimize

### Check Embedding Coverage

```sql
-- Check how many topics have embeddings
SELECT
  COUNT(*) as total_topics,
  COUNT(embedding) as topics_with_embeddings,
  ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percent
FROM topics;

-- Check embedding age
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN embedding_updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as updated_last_week,
  COUNT(CASE WHEN embedding_updated_at > NOW() - INTERVAL '30 days' THEN 1 END) as updated_last_month
FROM topics
WHERE embedding IS NOT NULL;
```

### Monitor Search Performance

```sql
-- Check semantic search usage (if logging is enabled)
-- Track cache hit rates, search latency, and user engagement
```

### Cost Tracking

```bash
# Estimate monthly cost
# ~$0.02 per 1M tokens
# Average topic: 200 tokens
# New content per month: 1000 items
# Cost = (1000 × 200 × 0.02) / 1,000,000 = ~$0.004/month

# Very low cost for ongoing operations!
```

## Troubleshooting

### Semantic Search Returns No Results

1. Check if embeddings exist:
   ```sql
   SELECT COUNT(*) FROM topics WHERE embedding IS NOT NULL;
   ```

2. Verify API key is configured:
   ```bash
   echo $OPENROUTER_API_KEY
   ```

3. Check semantic search logs:
   ```bash
   # In development
   npm run dev
   # Look for "[ERROR]" in logs
   ```

### Poor Search Quality

1. **Adjust similarity threshold**
   - Default: 0.7 (strict)
   - Looser: 0.5-0.6
   - Stricter: 0.8-0.9

2. **Adjust hybrid weights**
   - More semantic: `semantic_weight=0.8`
   - More keyword: `semantic_weight=0.4`

3. **Regenerate embeddings** (if model updated):
   ```bash
   npx tsx scripts/generate-embeddings.ts --no-resume
   ```

### High API Costs

1. **Enable aggressive caching**
   - Query embeddings cached for 24 hours
   - Search results cached for 5 minutes

2. **Limit embedding generation**
   - Only embed published content
   - Skip very short content
   - Batch updates daily instead of real-time

3. **Monitor usage**
   ```bash
   # Check OpenRouter dashboard
   # https://openrouter.ai/activity
   ```

## Performance Optimization

### pgvector Index Tuning

If using pgvector with IVFFlat indexes:

```sql
-- Adjust number of lists based on dataset size
-- Rule of thumb: lists = rows / 1000 (100-1000 range)

-- For ~10K topics:
DROP INDEX topics_embedding_idx;
CREATE INDEX topics_embedding_idx ON topics
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- For ~100K topics:
DROP INDEX topics_embedding_idx;
CREATE INDEX topics_embedding_idx ON topics
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Search Optimization

```typescript
// Adjust limits based on performance
const SEMANTIC_SEARCH_LIMIT = 20; // Reduce if slow
const SIMILARITY_THRESHOLD = 0.7; // Increase to reduce results
```

## Next Steps

- ✅ Semantic search is now functional
- ⬜ Integrate into UI (CommandMenu, search results)
- ⬜ Add "Similar Topics" widget
- ⬜ Implement semantic discovery features
- ⬜ Set up monitoring and analytics

See the full implementation plan for Phase 2 and beyond.
