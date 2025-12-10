# Database Optimization Guide

## Overview
This guide covers database performance optimization strategies for the Chabad Mafteach application, focusing on query performance, indexing, and monitoring.

## Current Database Schema Analysis

### Tables Overview
- **topics**: Main content entities (concepts, people, places, events)
- **statements**: Individual statements within articles
- **paragraphs**: Document paragraph structure
- **statement_topics**: Many-to-many relationship between statements and topics
- **documents**: Source documents (books, articles)

## Performance Analysis Results

### Critical Indexes Needed

#### High Impact (Immediate Priority)
```sql
-- Category filtering on explore page
CREATE INDEX idx_topics_type ON topics (topic_type);

-- Text search functionality
CREATE FULLTEXT INDEX idx_topics_title_search ON topics (canonical_title);

-- Linking statements to topics (junction table optimization)
CREATE INDEX idx_statement_topics_statement ON statement_topics (statement_id);
CREATE INDEX idx_statement_topics_topic ON statement_topics (topic_id);

-- Composite index for complex queries
CREATE INDEX idx_statement_topics_composite ON statement_topics (statement_id, topic_id);
```

#### Medium Impact (Secondary Priority)
```sql
-- Loading statements for paragraphs
CREATE INDEX idx_statements_paragraph ON statements (paragraph_id);

-- Document paragraph ordering
CREATE INDEX idx_paragraphs_document_order ON paragraphs (document_id, order_key);
```

### Slow Query Analysis

#### Query 1: Text Search Performance
**Problem**: `SELECT * FROM topics WHERE description LIKE ?` (2.5s avg)
**Solution**: Add FULLTEXT index
```sql
CREATE FULLTEXT INDEX idx_topics_description_search ON topics (description);
```

#### Query 2: Junction Table Joins
**Problem**: Complex joins on statement_topics (1.8s avg)
**Solution**: Optimize with composite indexes
```sql
-- Already covered by composite index above
```

#### Query 3: Count Queries
**Problem**: `SELECT COUNT(*) FROM topics WHERE topic_type = ?` (0.5s avg)
**Solution**: Index on topic_type (already planned)

## Implementation Strategy

### Phase 1: Critical Indexes
1. Create all HIGH impact indexes
2. Monitor query performance improvement
3. Validate no negative side effects

### Phase 2: Optimization Refinement
1. Add remaining indexes based on monitoring
2. Implement query result caching
3. Consider read replicas for heavy queries

### Phase 3: Advanced Optimization
1. Database connection pooling
2. Query result caching (Redis)
3. Database normalization review

## Monitoring and Maintenance

### Performance Monitoring
```bash
# Run performance analysis
npm run performance

# Run database optimization analysis
npm run db:optimize

# Clean up orphaned data
npm run db:cleanup
```

### Key Metrics to Monitor
- Query execution time (>100ms flagged)
- Index usage statistics
- Table growth and fragmentation
- Connection pool utilization
- Cache hit rates

### Regular Maintenance Tasks
- Weekly: Review slow query logs
- Monthly: Analyze index usage
- Quarterly: Full database optimization
- On-demand: Add indexes for new query patterns

## Query Optimization Techniques

### 1. Index Usage
- Always include WHERE clause columns in indexes
- Consider composite indexes for multi-column filters
- Use covering indexes for SELECT queries

### 2. Query Structure
- Avoid SELECT * in production queries
- Use LIMIT for pagination
- Prefer INNER JOIN over OUTER JOIN when possible

### 3. Application-Level Optimizations
- Implement database connection pooling
- Use prepared statements
- Cache frequently accessed data
- Implement pagination for large result sets

## Troubleshooting

### Common Issues

#### Index Not Being Used
```sql
-- Check if index is being used
EXPLAIN SELECT * FROM topics WHERE topic_type = 'concept';

-- Force index usage (temporary debugging)
SELECT * FROM topics USE INDEX (idx_topics_type) WHERE topic_type = 'concept';
```

#### Slow Query Diagnosis
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- Log queries > 1 second

-- View slow queries
SHOW PROCESSLIST;
```

#### Index Maintenance
```sql
-- Analyze table for optimization opportunities
ANALYZE TABLE topics;

-- Rebuild indexes (for fragmented tables)
ALTER TABLE topics ENGINE = InnoDB;

-- Check index cardinality
SHOW INDEX FROM topics;
```

## Directus-Specific Considerations

### API-Level Optimizations
- Use Directus fields parameter to limit returned data
- Implement proper pagination in API calls
- Cache API responses at application level

### Schema Design
- Leverage Directus relationships efficiently
- Use appropriate field types for better indexing
- Consider denormalization for read-heavy operations

## Migration Strategy

### Safe Rollout Process
1. **Development**: Test indexes on staging environment
2. **Staging**: Full performance testing with realistic data
3. **Production**: Deploy during low-traffic period
4. **Monitoring**: Watch for performance improvements and issues
5. **Rollback**: Have index drop scripts ready

### Index Creation Script
```sql
-- Safe index creation (won't fail if index exists)
CREATE INDEX IF NOT EXISTS idx_topics_type ON topics (topic_type);
CREATE INDEX IF NOT EXISTS idx_statement_topics_composite ON statement_topics (statement_id, topic_id);
```

### Index Removal (Rollback)
```sql
-- Safe index removal
DROP INDEX IF EXISTS idx_topics_type ON topics;
DROP INDEX IF EXISTS idx_statement_topics_composite ON statement_topics;
```

## Performance Benchmarks

### Target Metrics
- **API Response Time**: <200ms for simple queries
- **Complex Queries**: <500ms for joins and aggregations
- **Search Queries**: <300ms for text search
- **Database Connections**: <80% pool utilization

### Monitoring Dashboard
- Query performance graphs
- Index usage statistics
- Connection pool metrics
- Slow query alerts

## Future Considerations

### Scalability Planning
- Read replica configuration
- Database sharding strategy
- CDN integration for static content
- Microservices architecture evaluation

### Advanced Features
- Full-text search with Elasticsearch
- Graph database for relationship analysis
- Real-time data synchronization
- Advanced caching strategies

## Resources

### Tools
- **Database Monitoring**: PMM (Percona Monitoring and Management)
- **Query Analysis**: EXPLAIN plans, slow query logs
- **Performance Testing**: Apache Bench, JMeter

### Documentation
- MySQL Performance Best Practices
- Directus Performance Optimization
- Database Indexing Strategies

### Community Resources
- Database performance forums
- Directus community discussions
- Performance optimization case studies
