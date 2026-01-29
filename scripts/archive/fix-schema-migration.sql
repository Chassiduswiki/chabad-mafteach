-- =====================================================
-- CRITICAL FIX: Schema Migration Issues
-- Problem: content_blocks replaced paragraphs but statements.block_id
-- may still reference old paragraph_id values
-- =====================================================

-- Step 1: Check for invalid block_id references in statements
-- These statements reference content_blocks that don't exist

SELECT
    'Invalid block_id references' as issue_type,
    COUNT(*) as count
FROM statements s
LEFT JOIN content_blocks cb ON s.block_id = cb.id
WHERE cb.id IS NULL;

-- Step 2: If there are old paragraph references, we need to map them
-- Check if there's a paragraphs table or if we can infer mappings
-- This query shows statements with invalid block_id references

SELECT
    s.id as statement_id,
    s.block_id as current_block_id,
    s.text as statement_text,
    s.order_key,
    'INVALID - content_block does not exist' as issue
FROM statements s
LEFT JOIN content_blocks cb ON s.block_id = cb.id
WHERE cb.id IS NULL
ORDER BY s.block_id;

-- Step 3: Attempt to map old paragraph_id to new block_id
-- This assumes there was a migration that preserved some mapping
-- If paragraphs table exists, we can try to map based on document and order

-- Check if paragraphs table still exists (for migration reference)
SELECT
    'Paragraphs table exists' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'paragraphs'
    ) THEN 'YES' ELSE 'NO' END as exists_flag;

-- If paragraphs table exists, try to create mapping
-- This query attempts to map based on document and order_key
CREATE TEMPORARY TABLE IF NOT EXISTS paragraph_to_block_mapping AS
SELECT
    p.id as old_paragraph_id,
    cb.id as new_block_id,
    p.doc_id as document_id,
    p.order_key,
    p.text as paragraph_text,
    cb.content as block_content
FROM paragraphs p
LEFT JOIN content_blocks cb ON (
    cb.document_id = p.doc_id
    AND cb.order_key = p.order_key
)
WHERE cb.id IS NOT NULL;

-- Show the mapping results
SELECT
    'Paragraph to Block Mapping' as mapping_type,
    COUNT(*) as total_mappings,
    COUNT(CASE WHEN new_block_id IS NOT NULL THEN 1 END) as successful_mappings
FROM paragraph_to_block_mapping;

-- Step 4: Update statements with correct block_id references
-- ONLY RUN THIS IF YOU'VE VERIFIED THE MAPPINGS ABOVE

-- Update statements that have valid mappings
UPDATE statements s
SET block_id = p2b.new_block_id
FROM paragraph_to_block_mapping p2b
WHERE s.block_id = p2b.old_paragraph_id
  AND p2b.new_block_id IS NOT NULL;

-- Step 5: Handle statements that still have invalid references
-- These might need to be deleted or have block_id set to NULL

SELECT
    'Statements still with invalid block_id' as remaining_issue,
    COUNT(*) as count
FROM statements s
LEFT JOIN content_blocks cb ON s.block_id = cb.id
WHERE cb.id IS NULL;

-- For statements that can't be mapped, set block_id to NULL or delete
-- (Choose based on your business requirements)

-- Option A: Set to NULL (keeps statements but disconnects from content)
UPDATE statements
SET block_id = NULL
WHERE block_id IS NOT NULL
  AND block_id NOT IN (
      SELECT id FROM content_blocks
  );

-- Option B: Delete orphaned statements (more aggressive cleanup)
-- DELETE FROM statements
-- WHERE block_id IS NOT NULL
--   AND block_id NOT IN (
--       SELECT id FROM content_blocks
--   );

-- Step 6: Verify the fix
SELECT
    'Schema Migration Verification' as check_type,
    COUNT(*) as total_statements,
    COUNT(CASE WHEN block_id IS NULL THEN 1 END) as statements_without_blocks,
    COUNT(CASE WHEN block_id IS NOT NULL AND cb.id IS NOT NULL THEN 1 END) as valid_block_references
FROM statements s
LEFT JOIN content_blocks cb ON s.block_id = cb.id;

-- Step 7: Clean up temporary table
DROP TABLE IF EXISTS paragraph_to_block_mapping;

-- =====================================================
-- ADDITIONAL VERIFICATION QUERIES
-- =====================================================

-- Check content_blocks and statements relationship
SELECT
    cb.document_id,
    cb.order_key as block_order,
    COUNT(s.id) as statements_count,
    GROUP_CONCAT(s.order_key ORDER BY s.order_key) as statement_orders
FROM content_blocks cb
LEFT JOIN statements s ON cb.id = s.block_id
WHERE cb.status = 'published'
GROUP BY cb.id, cb.document_id, cb.order_key
ORDER BY cb.document_id, cb.order_key;

-- Check for any remaining data integrity issues
SELECT
    'Data Integrity Check' as check_type,
    COUNT(*) as total_statements,
    COUNT(CASE WHEN block_id IS NULL THEN 1 END) as orphaned_statements,
    COUNT(CASE WHEN block_id IS NOT NULL AND cb.id IS NULL THEN 1 END) as invalid_references
FROM statements s
LEFT JOIN content_blocks cb ON s.block_id = cb.id;

-- =====================================================
-- BACKUP AND ROLLBACK RECOMMENDATIONS
-- =====================================================
--
-- BEFORE RUNNING THIS SCRIPT:
-- 1. Create full database backup
-- 2. Run in staging environment first
-- 3. Test TorahReader functionality after migration
-- 4. Have rollback script ready (below)
--
-- ROLLBACK SCRIPT (if needed):
-- UPDATE statements SET block_id = [old_paragraph_id] WHERE [condition];
--
-- EXPECTED IMPACT:
-- - TorahReader will properly load content sections
-- - Statements will correctly link to content blocks
-- - No more "No content available" messages due to bad references
--
-- =====================================================
