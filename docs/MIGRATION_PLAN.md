# Database Migration Plan

**Related:** [SCHEMA_AUDIT.md](./SCHEMA_AUDIT.md)  
**Phase:** 3 - Database Migration  
**Status:** Planning

---

## Overview

This document provides detailed migration scripts and procedures to refactor the topics table from a flat, redundant structure to a professional i18n architecture.

---

## Migration Goals

1. **Consolidate topic fields** from 26 to 10 fields
2. **Create translations infrastructure** with `topic_translations` table
3. **Preserve all existing data** with zero data loss
4. **Enable scalable i18n** supporting unlimited languages
5. **Maintain backward compatibility** during transition

---

## Pre-Migration Checklist

- [ ] **Full database backup** created and verified
- [ ] **Staging environment** set up with production data copy
- [ ] **Migration scripts** tested on staging
- [ ] **Rollback procedures** documented and tested
- [ ] **Downtime window** scheduled (estimated 30-60 minutes)
- [ ] **Team notification** sent
- [ ] **Monitoring** enabled for migration process

---

## Migration Steps

### Step 1: Create Translations Table

**File:** `migrations/001_create_topic_translations.sql`

```sql
-- Create topic_translations table
CREATE TABLE IF NOT EXISTS topic_translations (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  
  -- Name fields
  title VARCHAR(255) NOT NULL,
  transliteration VARCHAR(255),
  
  -- Content fields (all optional)
  description TEXT,
  overview TEXT,
  article TEXT,
  
  -- Definition fields
  definition_positive TEXT,
  definition_negative TEXT,
  
  -- Teaching aid fields
  practical_takeaways TEXT,
  historical_context TEXT,
  mashal TEXT,
  global_nimshal TEXT,
  charts TEXT,
  
  -- Translation metadata
  is_machine_translated BOOLEAN DEFAULT false,
  translation_quality VARCHAR(50) DEFAULT 'draft',
  translated_by UUID,
  translated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Directus system fields
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_created UUID,
  user_updated UUID,
  
  -- Constraints
  CONSTRAINT fk_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_translated_by FOREIGN KEY (translated_by) REFERENCES directus_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_created FOREIGN KEY (user_created) REFERENCES directus_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_updated FOREIGN KEY (user_updated) REFERENCES directus_users(id) ON DELETE SET NULL,
  CONSTRAINT unique_topic_language UNIQUE(topic_id, language_code),
  CONSTRAINT valid_language_code CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT valid_quality CHECK (translation_quality IN ('draft', 'reviewed', 'professional', 'native'))
);

-- Create indexes for performance
CREATE INDEX idx_topic_translations_topic_id ON topic_translations(topic_id);
CREATE INDEX idx_topic_translations_language ON topic_translations(language_code);
CREATE INDEX idx_topic_translations_quality ON topic_translations(translation_quality);
CREATE INDEX idx_topic_translations_lookup ON topic_translations(topic_id, language_code);

-- Add comments for documentation
COMMENT ON TABLE topic_translations IS 'Stores all translatable content for topics in multiple languages';
COMMENT ON COLUMN topic_translations.language_code IS 'ISO 639-1 language code (e.g., en, he, yi, ru)';
COMMENT ON COLUMN topic_translations.title IS 'Topic name in this language';
COMMENT ON COLUMN topic_translations.transliteration IS 'Romanized version for non-Latin scripts';
COMMENT ON COLUMN topic_translations.translation_quality IS 'Quality level: draft, reviewed, professional, native';
```

---

### Step 2: Migrate Existing Data

**File:** `migrations/002_migrate_topic_data.sql`

```sql
-- Migrate Hebrew content
-- Uses canonical_title or name_hebrew as title
INSERT INTO topic_translations (
  topic_id,
  language_code,
  title,
  transliteration,
  description,
  overview,
  article,
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts,
  is_machine_translated,
  translation_quality,
  date_created,
  date_updated
)
SELECT 
  id,
  'he' AS language_code,
  COALESCE(
    NULLIF(TRIM(name_hebrew), ''),
    NULLIF(TRIM(canonical_title), ''),
    'ללא שם'  -- "No name" in Hebrew as fallback
  ) AS title,
  NULLIF(TRIM(canonical_title_transliteration), '') AS transliteration,
  description,
  overview,
  article,
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts,
  false AS is_machine_translated,
  'draft' AS translation_quality,
  CURRENT_TIMESTAMP AS date_created,
  CURRENT_TIMESTAMP AS date_updated
FROM topics
WHERE 
  -- Only migrate if we have Hebrew content
  (original_lang = 'he' OR name_hebrew IS NOT NULL OR canonical_title IS NOT NULL)
  -- Avoid duplicates if migration runs twice
  AND NOT EXISTS (
    SELECT 1 FROM topic_translations 
    WHERE topic_id = topics.id AND language_code = 'he'
  );

-- Migrate English content
-- Only create English translation if it differs from Hebrew
INSERT INTO topic_translations (
  topic_id,
  language_code,
  title,
  transliteration,
  description,
  overview,
  article,
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts,
  is_machine_translated,
  translation_quality,
  date_created,
  date_updated
)
SELECT 
  id,
  'en' AS language_code,
  COALESCE(
    NULLIF(TRIM(canonical_title_en), ''),
    NULLIF(TRIM(canonical_title), ''),
    'Untitled'
  ) AS title,
  NULLIF(TRIM(canonical_title_transliteration), '') AS transliteration,
  COALESCE(NULLIF(TRIM(description_en), ''), description) AS description,
  overview,
  article,
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts,
  false AS is_machine_translated,
  'draft' AS translation_quality,
  CURRENT_TIMESTAMP AS date_created,
  CURRENT_TIMESTAMP AS date_updated
FROM topics
WHERE 
  -- Only create English if we have English-specific content
  -- or if original language was English
  (
    original_lang = 'en' 
    OR canonical_title_en IS NOT NULL 
    OR description_en IS NOT NULL
  )
  -- Avoid duplicates
  AND NOT EXISTS (
    SELECT 1 FROM topic_translations 
    WHERE topic_id = topics.id AND language_code = 'en'
  );

-- Verification query
SELECT 
  t.id,
  t.slug,
  t.original_lang,
  COUNT(tt.id) as translation_count,
  STRING_AGG(tt.language_code, ', ' ORDER BY tt.language_code) as languages
FROM topics t
LEFT JOIN topic_translations tt ON t.id = tt.topic_id
GROUP BY t.id, t.slug, t.original_lang
ORDER BY translation_count ASC, t.id;

-- Check for topics without translations (should be 0)
SELECT COUNT(*) as topics_without_translations
FROM topics t
WHERE NOT EXISTS (
  SELECT 1 FROM topic_translations WHERE topic_id = t.id
);
```

---

### Step 3: Add Default Language Field

**File:** `migrations/003_add_default_language.sql`

```sql
-- Add default_language column to topics
ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'he';

-- Set default language based on original_lang
UPDATE topics
SET default_language = CASE 
  WHEN original_lang = 'en' THEN 'en'
  WHEN original_lang = 'he' THEN 'he'
  ELSE 'he'  -- Default to Hebrew
END
WHERE default_language IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE topics 
ALTER COLUMN default_language SET NOT NULL;

-- Add constraint
ALTER TABLE topics
ADD CONSTRAINT valid_default_language 
CHECK (default_language ~ '^[a-z]{2}(-[A-Z]{2})?$');

-- Add index
CREATE INDEX idx_topics_default_language ON topics(default_language);

COMMENT ON COLUMN topics.default_language IS 'Primary language for this topic (ISO 639-1 code)';
```

---

### Step 4: Drop Redundant Columns

**File:** `migrations/004_drop_redundant_columns.sql`

```sql
-- IMPORTANT: Only run this after verifying data migration success!
-- Create backup of dropped data first

-- Create backup table
CREATE TABLE topics_backup_pre_migration AS 
SELECT * FROM topics;

-- Drop redundant name columns
ALTER TABLE topics
DROP COLUMN IF EXISTS canonical_title,
DROP COLUMN IF EXISTS canonical_title_en,
DROP COLUMN IF EXISTS canonical_title_transliteration,
DROP COLUMN IF EXISTS name_hebrew;

-- Drop redundant content columns
ALTER TABLE topics
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS description_en,
DROP COLUMN IF EXISTS overview,
DROP COLUMN IF EXISTS article;

-- Drop redundant additional content columns
ALTER TABLE topics
DROP COLUMN IF EXISTS definition_positive,
DROP COLUMN IF EXISTS definition_negative,
DROP COLUMN IF EXISTS practical_takeaways,
DROP COLUMN IF EXISTS historical_context,
DROP COLUMN IF EXISTS mashal,
DROP COLUMN IF EXISTS global_nimshal,
DROP COLUMN IF EXISTS charts;

-- Drop original_lang (replaced by default_language)
ALTER TABLE topics
DROP COLUMN IF EXISTS original_lang;

-- Verification: Show new slim schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'topics'
ORDER BY ordinal_position;
```

---

### Step 5: Add Translation Constraints

**File:** `migrations/005_add_translation_constraints.sql`

```sql
-- Function to ensure every topic has at least one translation
CREATE OR REPLACE FUNCTION check_topic_has_translation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM topic_translations 
    WHERE topic_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Topic (id: %) must have at least one translation', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce constraint (deferred to allow creation workflow)
CREATE CONSTRAINT TRIGGER ensure_topic_has_translation
  AFTER INSERT ON topics
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_topic_has_translation();

-- Function to ensure default language translation exists
CREATE OR REPLACE FUNCTION check_default_language_translation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM topic_translations 
    WHERE topic_id = NEW.id 
    AND language_code = NEW.default_language
  ) THEN
    RAISE EXCEPTION 'Topic (id: %) must have translation in default language (%)', 
      NEW.id, NEW.default_language;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for default language constraint
CREATE CONSTRAINT TRIGGER ensure_default_language_translation
  AFTER INSERT OR UPDATE OF default_language ON topics
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_default_language_translation();

-- Function to update date_updated timestamp
CREATE OR REPLACE FUNCTION update_topic_translation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER topic_translation_update_timestamp
  BEFORE UPDATE ON topic_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_translation_timestamp();
```

---

## Rollback Procedures

### Emergency Rollback (if migration fails)

**File:** `migrations/rollback_001.sql`

```sql
-- Restore from backup
DROP TABLE IF EXISTS topics CASCADE;
ALTER TABLE topics_backup_pre_migration RENAME TO topics;

-- Drop translations table
DROP TABLE IF EXISTS topic_translations CASCADE;

-- Drop functions and triggers
DROP TRIGGER IF EXISTS ensure_topic_has_translation ON topics;
DROP TRIGGER IF EXISTS ensure_default_language_translation ON topics;
DROP TRIGGER IF EXISTS topic_translation_update_timestamp ON topic_translations;
DROP FUNCTION IF EXISTS check_topic_has_translation();
DROP FUNCTION IF EXISTS check_default_language_translation();
DROP FUNCTION IF EXISTS update_topic_translation_timestamp();

-- Recreate indexes and constraints as needed
-- (Add original schema recreation here)
```

---

## Directus Configuration Updates

### Step 6: Configure Directus Collections

**File:** `directus_config/topic_translations_collection.json`

```json
{
  "collection": "topic_translations",
  "meta": {
    "collection": "topic_translations",
    "icon": "translate",
    "note": "Translations for topics in multiple languages",
    "display_template": "{{title}} ({{language_code}})",
    "hidden": false,
    "singleton": false,
    "translations": [
      {
        "language": "en-US",
        "translation": "Topic Translations"
      }
    ],
    "archive_field": null,
    "archive_value": null,
    "unarchive_value": null,
    "sort_field": null,
    "accountability": "all",
    "color": "#6366F1",
    "group": null,
    "collapse": "open"
  },
  "schema": {
    "name": "topic_translations"
  }
}
```

### Step 7: Configure Directus Fields

**Create via Directus MCP tools:**

```typescript
// Primary key
{
  field: "id",
  type: "integer",
  schema: { is_primary_key: true, has_auto_increment: true },
  meta: { hidden: true, readonly: true, interface: "input" }
}

// Foreign key to topics
{
  field: "topic_id",
  type: "integer",
  schema: { is_nullable: false },
  meta: {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{slug}}" },
    required: true,
    width: "half"
  }
}

// Language code
{
  field: "language_code",
  type: "string",
  schema: { is_nullable: false, max_length: 10 },
  meta: {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "English", value: "en" },
        { text: "Hebrew", value: "he" },
        { text: "Yiddish", value: "yi" },
        { text: "Russian", value: "ru" },
        { text: "French", value: "fr" },
        { text: "Spanish", value: "es" }
      ]
    },
    required: true,
    width: "half"
  }
}

// Title
{
  field: "title",
  type: "string",
  schema: { is_nullable: false, max_length: 255 },
  meta: {
    interface: "input",
    required: true,
    width: "half",
    note: "Topic name in this language"
  }
}

// Transliteration
{
  field: "transliteration",
  type: "string",
  schema: { max_length: 255 },
  meta: {
    interface: "input",
    width: "half",
    note: "Romanized version (for non-Latin scripts)"
  }
}

// Content fields (all rich text)
{
  field: "description",
  type: "text",
  meta: {
    interface: "input-rich-text-html",
    width: "full",
    note: "Short description (1-3 sentences)"
  }
}

{
  field: "overview",
  type: "text",
  meta: {
    interface: "input-rich-text-html",
    width: "full",
    note: "Medium overview (1-3 paragraphs)"
  }
}

{
  field: "article",
  type: "text",
  meta: {
    interface: "input-rich-text-html",
    width: "full",
    note: "Full article content"
  }
}

// Translation metadata
{
  field: "translation_quality",
  type: "string",
  schema: { default_value: "draft" },
  meta: {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "Draft", value: "draft" },
        { text: "Reviewed", value: "reviewed" },
        { text: "Professional", value: "professional" },
        { text: "Native Speaker", value: "native" }
      ]
    },
    width: "half"
  }
}

{
  field: "is_machine_translated",
  type: "boolean",
  schema: { default_value: false },
  meta: {
    interface: "boolean",
    width: "half"
  }
}
```

### Step 8: Create Relation

```typescript
// M2O relation: topic_translations -> topics
{
  collection: "topic_translations",
  field: "topic_id",
  related_collection: "topics",
  meta: {
    one_field: "translations",  // O2M field on topics side
    sort_field: null
  },
  schema: {
    on_delete: "CASCADE"
  }
}
```

---

## Testing Procedures

### Pre-Migration Tests

```sql
-- Count topics
SELECT COUNT(*) as total_topics FROM topics;

-- Count topics with Hebrew content
SELECT COUNT(*) as hebrew_topics 
FROM topics 
WHERE original_lang = 'he' OR name_hebrew IS NOT NULL;

-- Count topics with English content
SELECT COUNT(*) as english_topics 
FROM topics 
WHERE original_lang = 'en' OR canonical_title_en IS NOT NULL;

-- Sample data check
SELECT 
  id, 
  slug, 
  canonical_title, 
  canonical_title_en, 
  name_hebrew,
  original_lang
FROM topics 
LIMIT 10;
```

### Post-Migration Tests

```sql
-- Verify translation count
SELECT COUNT(*) as total_translations FROM topic_translations;

-- Verify every topic has at least one translation
SELECT COUNT(*) as topics_without_translations
FROM topics t
WHERE NOT EXISTS (
  SELECT 1 FROM topic_translations WHERE topic_id = t.id
);
-- Should return 0

-- Verify language distribution
SELECT 
  language_code,
  COUNT(*) as translation_count
FROM topic_translations
GROUP BY language_code
ORDER BY translation_count DESC;

-- Sample translated data
SELECT 
  t.id,
  t.slug,
  t.default_language,
  tt.language_code,
  tt.title,
  LEFT(tt.description, 50) as description_preview
FROM topics t
JOIN topic_translations tt ON t.id = tt.topic_id
ORDER BY t.id, tt.language_code
LIMIT 20;

-- Check for data loss
SELECT 
  'topics' as table_name,
  COUNT(*) as count_before
FROM topics_backup_pre_migration
UNION ALL
SELECT 
  'topics' as table_name,
  COUNT(*) as count_after
FROM topics;
-- Counts should match
```

---

## Performance Considerations

### Indexes

All necessary indexes are created in Step 1:
- `idx_topic_translations_topic_id` - Fast lookup by topic
- `idx_topic_translations_language` - Filter by language
- `idx_topic_translations_quality` - Filter by quality
- `idx_topic_translations_lookup` - Composite for topic+language queries

### Query Optimization

**Before (inefficient):**
```sql
SELECT canonical_title, canonical_title_en, description, description_en
FROM topics
WHERE id = 122;
```

**After (efficient):**
```sql
-- Get specific language
SELECT t.slug, tt.title, tt.description
FROM topics t
JOIN topic_translations tt ON t.id = tt.topic_id
WHERE t.id = 122 AND tt.language_code = 'en';

-- Get all languages (when needed)
SELECT t.slug, tt.language_code, tt.title, tt.description
FROM topics t
JOIN topic_translations tt ON t.id = tt.topic_id
WHERE t.id = 122;
```

---

## Migration Execution Checklist

### Pre-Execution
- [ ] Database backup completed
- [ ] Backup verified and restorable
- [ ] Staging migration successful
- [ ] All tests passing on staging
- [ ] Rollback procedure tested
- [ ] Downtime window scheduled
- [ ] Team notified

### Execution
- [ ] Enable maintenance mode
- [ ] Run Step 1: Create translations table
- [ ] Run Step 2: Migrate data
- [ ] Verify data migration (run post-migration tests)
- [ ] Run Step 3: Add default_language
- [ ] Run Step 4: Drop redundant columns
- [ ] Run Step 5: Add constraints
- [ ] Configure Directus (Steps 6-8)
- [ ] Run all post-migration tests
- [ ] Verify API functionality
- [ ] Verify UI functionality

### Post-Execution
- [ ] Disable maintenance mode
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Verify user workflows
- [ ] Document any issues
- [ ] Team notification: migration complete

---

## Estimated Timeline

- **Preparation:** 2 hours
- **Backup:** 30 minutes
- **Migration execution:** 30-60 minutes
- **Testing:** 1 hour
- **Directus configuration:** 1 hour
- **Total:** 5-6 hours

---

## Support & Troubleshooting

### Common Issues

**Issue:** Migration fails with foreign key constraint error
**Solution:** Check that all topic IDs in translations table exist in topics table

**Issue:** Topics without translations after migration
**Solution:** Run verification query and manually create missing translations

**Issue:** Performance degradation after migration
**Solution:** Verify all indexes are created, run ANALYZE on tables

### Emergency Contacts

- Database Admin: [Contact]
- DevOps: [Contact]
- Project Lead: [Contact]

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Ready for Review
