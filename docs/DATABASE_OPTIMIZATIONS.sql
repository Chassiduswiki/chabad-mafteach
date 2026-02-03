-- Database Optimization and Constraints

-- 1. Index Creation (Based on Query Analysis)

-- Topic Type filtering for Explore Page
CREATE INDEX idx_topics_type ON topics (topic_type);

-- Full-text search for Topics (Title and Description)
-- Note: Syntax may vary based on specific PostgreSQL version/extensions
CREATE INDEX idx_topics_title_search ON topics USING GIN (to_tsvector('english', canonical_title || ' ' || coalesce(description, '')));
-- Or simple LIKE optimization if using standard B-tree with text_pattern_ops
CREATE INDEX idx_topics_title_pattern ON topics (canonical_title text_pattern_ops);

-- Statements by Paragraph (Loading content)
CREATE INDEX idx_statements_paragraph ON statements (paragraph_id);

-- Statement-Topic Junctions (Critical for queries)
CREATE INDEX idx_statement_topics_statement ON statement_topics (statement_id);
CREATE INDEX idx_statement_topics_topic ON statement_topics (topic_id);
-- Composite for intersection queries
CREATE INDEX idx_statement_topics_composite ON statement_topics (statement_id, topic_id);

-- Paragraph ordering within documents
CREATE INDEX idx_paragraphs_document_order ON paragraphs (document_id, order_key);

-- 2. Foreign Key Constraints (Data Integrity)

-- Ensure statement_topics always reference valid statements
ALTER TABLE statement_topics
ADD CONSTRAINT fk_statement_topics_statement
FOREIGN KEY (statement_id)
REFERENCES statements (id)
ON DELETE CASCADE;

-- Ensure statement_topics always reference valid topics
ALTER TABLE statement_topics
ADD CONSTRAINT fk_statement_topics_topic
FOREIGN KEY (topic_id)
REFERENCES topics (id)
ON DELETE CASCADE;

-- Ensure statements belong to paragraphs
ALTER TABLE statements
ADD CONSTRAINT fk_statements_paragraph
FOREIGN KEY (paragraph_id)
REFERENCES paragraphs (id)
ON DELETE CASCADE;

-- Ensure paragraphs belong to documents
ALTER TABLE paragraphs
ADD CONSTRAINT fk_paragraphs_document
FOREIGN KEY (document_id)
REFERENCES documents (id)
ON DELETE CASCADE;

-- Ensure topic translations belong to topics
ALTER TABLE topic_translations
ADD CONSTRAINT fk_topic_translations_topic
FOREIGN KEY (topic_id)
REFERENCES topics (id)
ON DELETE CASCADE;
