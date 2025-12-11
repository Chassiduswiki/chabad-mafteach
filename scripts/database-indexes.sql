-- Database Indexing Recommendations for Chabad Mafteach
-- Run these SQL commands in your Directus database to improve query performance

-- =====================================================
-- INDEXES FOR FREQUENTLY QUERIED FIELDS
-- =====================================================

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_published_at ON documents(published_at);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);

-- Content blocks indexes (replaces paragraphs)
CREATE INDEX IF NOT EXISTS idx_content_blocks_document_id ON content_blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_block_type ON content_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_status ON content_blocks(status);
CREATE INDEX IF NOT EXISTS idx_content_blocks_order_key ON content_blocks(order_key);

-- Statements indexes
CREATE INDEX IF NOT EXISTS idx_statements_block_id ON statements(block_id);
CREATE INDEX IF NOT EXISTS idx_statements_status ON statements(status);
CREATE INDEX IF NOT EXISTS idx_statements_is_deleted ON statements(is_deleted);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_topic_type ON topics(topic_type);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);

-- Statement-Topic relationships (junction table)
CREATE INDEX IF NOT EXISTS idx_statement_topics_statement_id ON statement_topics(statement_id);
CREATE INDEX IF NOT EXISTS idx_statement_topics_topic_id ON statement_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_statement_topics_relevance_score ON statement_topics(relevance_score);

-- Sources and source links
CREATE INDEX IF NOT EXISTS idx_sources_author_id ON sources(author_id);
CREATE INDEX IF NOT EXISTS idx_source_links_statement_id ON source_links(statement_id);
CREATE INDEX IF NOT EXISTS idx_source_links_source_id ON source_links(source_id);

-- =====================================================
-- FULL-TEXT SEARCH INDEXES
-- =====================================================

-- Full-text search on content blocks (for Hebrew/English text search)
CREATE INDEX IF NOT EXISTS idx_content_blocks_content_fts
ON content_blocks USING gin(to_tsvector('english', content));

-- Full-text search on statements
CREATE INDEX IF NOT EXISTS idx_statements_text_fts
ON statements USING gin(to_tsvector('english', text));

-- Full-text search on topics
CREATE INDEX IF NOT EXISTS idx_topics_title_fts
ON topics USING gin(to_tsvector('english', canonical_title));

CREATE INDEX IF NOT EXISTS idx_topics_description_fts
ON topics USING gin(to_tsvector('english', description));

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Documents with type and status (common filter combination)
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(doc_type, status);

-- Content blocks with document and type
CREATE INDEX IF NOT EXISTS idx_content_blocks_doc_type ON content_blocks(document_id, block_type);

-- Statements with block and status
CREATE INDEX IF NOT EXISTS idx_statements_block_status ON statements(block_id, status);

-- Topics with type and slug
CREATE INDEX IF NOT EXISTS idx_topics_type_slug ON topics(topic_type, slug);

-- =====================================================
-- INDEXES FOR SEARCH AND FILTERING
-- =====================================================

-- Content blocks page/chapter references
CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON content_blocks(page_number);
CREATE INDEX IF NOT EXISTS idx_content_blocks_chapter ON content_blocks(chapter_number);

-- Authors
CREATE INDEX IF NOT EXISTS idx_authors_era ON authors(era);

-- Translations
CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(target_lang);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check which indexes exist
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('documents', 'content_blocks', 'statements', 'topics', 'statement_topics', 'sources', 'source_links')
ORDER BY tablename, indexname;

-- Check index usage statistics (run after some usage)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('documents', 'content_blocks', 'statements', 'topics', 'statement_topics', 'sources', 'source_links')
ORDER BY idx_scan DESC;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Performance Benefits:
-- 1. Faster WHERE clause filtering
-- 2. Improved JOIN performance
-- 3. Better ORDER BY performance
-- 4. Enhanced full-text search capabilities
--
-- Maintenance Considerations:
-- - Indexes speed up SELECT queries but slow down INSERT/UPDATE/DELETE
-- - Monitor index usage and remove unused indexes
-- - Consider partial indexes for filtered queries
-- - Full-text search indexes work well for English; may need custom config for Hebrew
--
-- Next Steps:
-- 1. Run this script in your Directus database
-- 2. Monitor query performance with the performance analysis script
-- 3. Consider adding Redis caching for frequently accessed data
