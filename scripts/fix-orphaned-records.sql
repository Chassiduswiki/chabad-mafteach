-- =====================================================
-- CRITICAL FIX: Remove Orphaned Records in statement_topics
-- =====================================================
-- Problem: 7 records in statement_topics reference non-existent statement IDs
-- This causes empty article content for topics
-- =====================================================

-- Step 1: Identify orphaned statement_topics records
-- These records reference statement IDs that don't exist in statements table

SELECT
    st.id as statement_topic_id,
    st.statement_id,
    st.topic_id,
    st.relevance_score,
    st.is_primary,
    'ORPHANED - statement does not exist' as issue
FROM statement_topics st
LEFT JOIN statements s ON st.statement_id = s.id
WHERE s.id IS NULL
ORDER BY st.statement_id;

-- Expected results: 7 records with statement_ids: 62, 65, 66, 67, 69

-- Step 2: Remove the orphaned records
-- ONLY RUN THIS AFTER VERIFYING THE ABOVE QUERY SHOWS THE EXPECTED ORPHANS

DELETE FROM statement_topics
WHERE statement_id IN (
    SELECT st.statement_id
    FROM statement_topics st
    LEFT JOIN statements s ON st.statement_id = s.id
    WHERE s.id IS NULL
);

-- Step 3: Verify the fix
-- After deletion, this should return 0 rows

SELECT
    st.id as statement_topic_id,
    st.statement_id,
    st.topic_id,
    'STILL ORPHANED' as status
FROM statement_topics st
LEFT JOIN statements s ON st.statement_id = s.id
WHERE s.id IS NULL;

-- Step 4: Check overall data integrity
-- Verify we have valid relationships after cleanup

SELECT
    'statement_topics' as table_name,
    COUNT(*) as total_records
FROM statement_topics
UNION ALL
SELECT
    'statements' as table_name,
    COUNT(*) as total_records
FROM statements
UNION ALL
SELECT
    'topics' as table_name,
    COUNT(*) as total_records
FROM topics;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that topic pages now have content
-- This query shows which topics should now have article content

SELECT
    t.canonical_title,
    t.slug,
    COUNT(st.id) as statement_count,
    GROUP_CONCAT(DISTINCT s.text ORDER BY s.order_key SEPARATOR ' | ') as sample_statements
FROM topics t
JOIN statement_topics st ON t.id = st.topic_id
JOIN statements s ON st.statement_id = s.id
WHERE s.status = 'published'
  AND s.is_deleted != true
GROUP BY t.id, t.canonical_title, t.slug
HAVING COUNT(st.id) > 0
ORDER BY statement_count DESC;

-- =====================================================
-- BACKUP RECOMMENDATION
-- =====================================================
--
-- BEFORE RUNNING THIS SCRIPT:
-- 1. Create full database backup
-- 2. Test in staging environment first
-- 3. Have rollback plan ready
-- 4. Monitor application logs after deployment
--
-- EXPECTED IMPACT:
-- - Article tabs will now show content instead of "Coming Soon"
-- - Topic pages will display related statements
-- - Search results will be more accurate
--
-- =====================================================
