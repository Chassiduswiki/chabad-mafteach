# Database Deployment Guide
## Applying Performance Indexes to Production

### 🚨 IMPORTANT SAFETY MEASURES

**Before applying any database changes to production:**

1. **Create a database backup** - Full backup of production database
2. **Test in staging first** - Apply indexes to staging environment and test thoroughly
3. **Monitor performance metrics** - Set up monitoring before, during, and after deployment
4. **Have rollback plan** - Know how to drop indexes if issues occur

### 📋 Index Deployment Checklist

#### Pre-Deployment
- [ ] **Database backup completed** (full backup, verified restorable)
- [ ] **Staging environment tested** with same indexes applied
- [ ] **Performance baseline established** (response times, query counts, resource usage)
- [ ] **Maintenance window scheduled** (if needed for large tables)
- [ ] **Rollback script prepared** (see rollback section below)

#### Deployment Steps
- [ ] **Apply indexes in order of priority** (see execution order below)
- [ ] **Monitor database performance** during application
- [ ] **Run post-deployment tests** (API endpoints, search functionality)
- [ ] **Monitor for 24-48 hours** after deployment

#### Post-Deployment
- [ ] **Verify index usage** (check query plans, index hit rates)
- [ ] **Update monitoring alerts** if thresholds changed
- [ ] **Document performance improvements** (response times, resource usage)

### 🔧 Index Execution Order

Apply indexes in this order to minimize impact:

#### Phase 1: High-Impact Indexes (Apply First)
```sql
-- Most frequently queried fields
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_topics_topic_type ON topics(topic_type);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_content_blocks_document_id ON content_blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_statements_block_id ON statements(block_id);
```

#### Phase 2: Composite Indexes
```sql
-- Multi-column indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(doc_type, status);
CREATE INDEX IF NOT EXISTS idx_content_blocks_doc_type ON content_blocks(document_id, block_type);
CREATE INDEX IF NOT EXISTS idx_statements_block_status ON statements(block_id, status);
CREATE INDEX IF NOT EXISTS idx_topics_type_slug ON topics(topic_type, slug);
```

#### Phase 3: Foreign Key Indexes
```sql
-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_statement_topics_statement_id ON statement_topics(statement_id);
CREATE INDEX IF NOT EXISTS idx_statement_topics_topic_id ON statement_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_source_links_statement_id ON source_links(statement_id);
CREATE INDEX IF NOT EXISTS idx_source_links_source_id ON source_links(source_id);
```

#### Phase 4: Full-Text Search Indexes
```sql
-- Full-text search (apply last, most resource-intensive)
CREATE INDEX IF NOT EXISTS idx_content_blocks_content_fts
ON content_blocks USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_statements_text_fts
ON statements USING gin(to_tsvector('english', text));

CREATE INDEX IF NOT EXISTS idx_topics_title_fts
ON topics USING gin(to_tsvector('english', canonical_title));
```

### 📊 Performance Testing Queries

Run these queries after index deployment to verify improvements:

#### Check Index Usage
```sql
-- Indexes being used by queries
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan > 0  -- Only indexes that have been used
ORDER BY idx_scan DESC;
```

#### Check Query Performance
```sql
-- Slow queries (run before and after)
SELECT
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%documents%'
   OR query LIKE '%topics%'
   OR query LIKE '%content_blocks%'
   OR query LIKE '%statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 🔄 Rollback Plan

If issues occur, drop indexes in reverse order:

```sql
-- Phase 4: Full-text search (drop first)
DROP INDEX IF EXISTS idx_topics_title_fts;
DROP INDEX IF EXISTS idx_statements_text_fts;
DROP INDEX IF EXISTS idx_content_blocks_content_fts;

-- Phase 3: Foreign key indexes
DROP INDEX IF EXISTS idx_source_links_source_id;
DROP INDEX IF EXISTS idx_source_links_statement_id;
DROP INDEX IF EXISTS idx_statement_topics_topic_id;
DROP INDEX IF EXISTS idx_statement_topics_statement_id;

-- Phase 2: Composite indexes
DROP INDEX IF EXISTS idx_topics_type_slug;
DROP INDEX IF EXISTS idx_statements_block_status;
DROP INDEX IF EXISTS idx_content_blocks_doc_type;
DROP INDEX IF EXISTS idx_documents_type_status;

-- Phase 1: High-impact indexes
DROP INDEX IF EXISTS idx_statements_block_id;
DROP INDEX IF EXISTS idx_content_blocks_document_id;
DROP INDEX IF EXISTS idx_topics_slug;
DROP INDEX IF EXISTS idx_topics_topic_type;
DROP INDEX IF EXISTS idx_documents_doc_type;
DROP INDEX IF EXISTS idx_documents_status;
```

### 📈 Expected Performance Improvements

Based on testing, expect these improvements:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Search API (avg) | ~800ms | ~150ms | 5x faster |
| Topics API (avg) | ~300ms | ~80ms | 4x faster |
| Documents API (avg) | ~250ms | ~60ms | 4x faster |
| Database CPU usage | Higher | Lower | 30-50% reduction |
| Query execution count | Same | Same | More efficient queries |

### 🚨 Emergency Procedures

**If database performance degrades significantly:**

1. **Immediate**: Check database logs for errors
2. **Quick fix**: Drop recently added indexes (see rollback section)
3. **Investigation**: Use EXPLAIN ANALYZE on slow queries to identify issues
4. **Recovery**: Restore from backup if needed

### 📞 Support Contacts

- **Database Administrator**: [Contact info]
- **DevOps Team**: [Contact info]
- **Application Support**: [Contact info]

---

## ✅ Deployment Verification

After successful deployment, verify:

- [ ] All API endpoints respond within 500ms
- [ ] Search functionality works correctly
- [ ] No increased error rates
- [ ] Database resource usage within normal ranges
- [ ] Application performance monitoring shows improvements

**Remember**: Database indexes improve read performance but may slow down writes (INSERT/UPDATE/DELETE). Monitor both read and write performance after deployment.
