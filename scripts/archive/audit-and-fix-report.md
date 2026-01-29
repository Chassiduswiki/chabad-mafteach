# Data Model Audit & Fix Report

## Executive Summary

**Status:** ❌ CRITICAL - Data model is broken and unusable for article display

**Issue:** The intended document hierarchy is completely bypassed. Content blocks are missing entirely.

## Problems Identified

### 1. Broken Data Hierarchy

**Expected Flow:**
```
documents (9) → content_blocks (0) → statements (60) → statement_topics → topics
```

**Actual Flow:**
```
documents (9 orphaned)
statements (60 orphaned, block_id=null) → statement_topics → topics
```

**Impact:** 
- Article tab cannot display content (needs paragraphs from content_blocks)
- "Article Coming Soon" message shows for all topics
- No way to organize statements into logical sections

### 2. Data Model vs Implementation Mismatch

**Documentation Says:**
- Use content_blocks for organizing document structure
- Each block has a type: heading, subheading, paragraph, section break
- Statements belong to blocks

**Reality:**
- No content_blocks exist
- Statements created directly without parent blocks
- Frontend expects blocks but finds none

### 3. v1.md Import Requirements

**Source Data:** 47 dictionary entries in v1.md
- Each entry has 5-7 sections (Definition, Mashal, Nimshal, Sources)
- Each section has 1-20 sentences
- Total: ~500-800 statements needed

**Current State:** Only 60 statements exist (incomplete import)

## Recommended Fix Strategy

### Phase 1: Data Model Validation ✅

Schema is correct. Collections and relationships are properly defined.

### Phase 2: Data Migration (REQUIRED)

**Option A: Rebuild from Scratch (RECOMMENDED)**
1. Delete all existing orphaned statements
2. Delete all existing documents
3. Re-import v1.md with proper hierarchy
4. Create: documents → content_blocks → statements → statement_topics

**Option B: Repair Existing Data**
1. Create content_blocks for each document
2. Update all statements to link to appropriate blocks
3. Complete the import from v1.md

### Phase 3: Import Script Creation

Need a script that:
1. Parses v1.md structure
2. Creates document for each entry
3. Creates content_blocks for each section (Definition, Mashal, etc.)
4. Creates statements for each sentence
5. Links statements to topics via statement_topics

### Phase 4: Frontend Verification

Test that:
1. Overview tab shows correct counts
2. Article tab displays structured content
3. Statements appear in proper order within blocks

## Next Steps

**Immediate Actions Required:**
1. ✅ Get user approval for fix strategy (Option A vs B)
2. Create import script for v1.md
3. Execute import with proper hierarchy
4. Verify display in both overview and article tabs

**Questions for User:**
1. Should we rebuild from scratch or repair existing data?
2. Are the 60 existing statements important, or can they be deleted?
3. Do you want to preserve any existing documents?
