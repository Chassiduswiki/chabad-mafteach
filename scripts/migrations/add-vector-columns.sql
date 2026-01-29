-- Migration: Add Vector Embedding Columns
-- Description: Adds embedding columns to topics and statements tables for semantic search
-- Date: 2026-01-28
--
-- IMPORTANT: This migration requires coordination with Directus Cloud support
-- to enable the pgvector extension if not already available.
--
-- If pgvector is not available, use JSON fallback (see alternative below)

-- ============================================================================
-- OPTION 1: With pgvector extension (Recommended)
-- ============================================================================

-- Enable pgvector extension (requires superuser or appropriate permissions)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to topics table
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS embedding vector(512),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- Add embedding columns to statements table
ALTER TABLE statements
ADD COLUMN IF NOT EXISTS embedding vector(512),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- Create vector indexes for efficient similarity search
-- IVFFlat is a good default for datasets with 1K-1M vectors
CREATE INDEX IF NOT EXISTS topics_embedding_idx ON topics
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS statements_embedding_idx ON statements
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add comments for documentation
COMMENT ON COLUMN topics.embedding IS 'Vector embedding (512 dimensions) for semantic search';
COMMENT ON COLUMN topics.embedding_model IS 'Model used to generate the embedding';
COMMENT ON COLUMN topics.embedding_updated_at IS 'Timestamp when embedding was last generated';

COMMENT ON COLUMN statements.embedding IS 'Vector embedding (512 dimensions) for semantic search';
COMMENT ON COLUMN statements.embedding_model IS 'Model used to generate the embedding';
COMMENT ON COLUMN statements.embedding_updated_at IS 'Timestamp when embedding was last generated';

-- ============================================================================
-- OPTION 2: JSON Fallback (if pgvector not available)
-- ============================================================================

-- If pgvector extension is not available on Directus Cloud, use JSONB instead
-- This will store embeddings as JSON arrays and use application-level similarity

-- Add embedding columns to topics table (JSON fallback)
-- ALTER TABLE topics
-- ADD COLUMN IF NOT EXISTS embedding JSONB,
-- ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
-- ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- Add embedding columns to statements table (JSON fallback)
-- ALTER TABLE statements
-- ADD COLUMN IF NOT EXISTS embedding JSONB,
-- ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
-- ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- Create GIN index for JSONB columns (helpful for existence checks)
-- CREATE INDEX IF NOT EXISTS topics_embedding_idx ON topics USING GIN (embedding);
-- CREATE INDEX IF NOT EXISTS statements_embedding_idx ON statements USING GIN (embedding);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if pgvector extension is installed
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if columns were added successfully
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'topics' AND column_name LIKE 'embedding%';

-- Check if indexes were created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('topics', 'statements') AND indexname LIKE '%embedding%';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- DROP INDEX IF EXISTS topics_embedding_idx;
-- DROP INDEX IF EXISTS statements_embedding_idx;
-- ALTER TABLE topics DROP COLUMN IF EXISTS embedding;
-- ALTER TABLE topics DROP COLUMN IF EXISTS embedding_model;
-- ALTER TABLE topics DROP COLUMN IF EXISTS embedding_updated_at;
-- ALTER TABLE statements DROP COLUMN IF EXISTS embedding;
-- ALTER TABLE statements DROP COLUMN IF EXISTS embedding_model;
-- ALTER TABLE statements DROP COLUMN IF EXISTS embedding_updated_at;
-- DROP EXTENSION IF EXISTS vector;
