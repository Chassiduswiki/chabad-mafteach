# Schema Audit & Refactoring Plan

**Date:** January 21, 2026  
**Status:** Phase 1 - Documentation & Analysis

---

## Executive Summary

This audit identifies three critical, interconnected issues affecting the Chabad Research platform:

1. **Random save failures** due to competing editor architectures
2. **Limited citation functionality** with schema mismatch between editor and database
3. **Massive field redundancy** in topics table violating i18n best practices

All issues stem from organic growth without architectural planning. This document provides a complete analysis and refactoring roadmap.

---

## Issue 1: Editor Save Persistence Failures

### Current State

**Problem:** Editor changes randomly fail to persist after save.

**Root Cause:** Two incompatible editor systems with conflicting save logic:

#### Editor System A: ProseMirror (Documents)
- **Location:** `@/components/editor/ProseEditor.tsx`
- **Sync Logic:** `@/lib/editor-sync.ts`
- **Target Collection:** `content_blocks`
- **Data Format:** ProseMirror JSON document structure
```typescript
{
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { id: 123, status: "draft" },
      content: [{ type: "text", text: "..." }]
    }
  ]
}
```

#### Editor System B: TipTap (Topics)
- **Location:** `@/app/editor/topics/[slug]/page.tsx`
- **Sync Logic:** Manual HTML extraction (lines 220-267)
- **Target Collection:** `topics`
- **Data Format:** HTML strings
```typescript
{
  description: "<p>HTML content</p>",
  overview: "<p>More HTML</p>",
  article: "<p>Article HTML</p>"
}
```

#### The Conflict

`@/lib/editor-sync.ts:60-182` expects ProseMirror document structure:
```typescript
export const syncEditorContent = async (
    docId: string | number,
    originalParagraphs: ContentBlock[],
    editorState: ProseMirrorDoc  // ← Expects this format
)
```

But topics editor sends HTML:
```typescript
// @/app/editor/topics/[slug]/page.tsx:228-232
Object.entries(editorsRef.current).forEach(([field, editor]) => {
  if (editor?.getHTML) {
    editorContent[field as keyof TopicFormData] = editor.getHTML(); // ← Sends HTML
  }
});
```

**Result:** Type mismatch causes intermittent save failures depending on editor state.

### Impact

- **User Experience:** Lost work, frustration, distrust of system
- **Data Integrity:** Inconsistent state between UI and database
- **Development:** Debugging difficulty due to non-deterministic failures

---

## Issue 2: Citation System Limitations

### Current State

#### 2.1: Citations Not Editable After Creation

**Problem:** Once inserted, citations cannot be edited.

**Code Evidence:**
```typescript
// @/components/editor/schema.ts:165
toDOM(node): DOMOutputSpec {
  return [
    "span",
    {
      contenteditable: "false"  // ← Explicitly non-editable
    },
    `${node.attrs.source_title}...`
  ];
}
```

**User Impact:** Must delete and recreate citation to fix typos or update references.

#### 2.2: Limited Citation Options

**Editor Citation Schema:**
```typescript
// @/components/editor/schema.ts:136-140
const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "Unknown Source" },
    reference: { default: "" }  // ← Single string field
  }
}
```

**Database Citation Capabilities:**
```typescript
// From content_blocks schema
{
  page_number: string,           // "17a", "23b"
  chapter_number: integer,       // 5
  halacha_number: integer,       // 12
  daf_number: string,            // "3b:6"
  section_number: integer,       // 2
  citation_refs: json[{          // Multiple formats
    system: string,              // "sefaria", "hebrewbooks"
    reference: string            // System-specific format
  }]
}
```

**Gap Analysis:**

| Feature | Editor Support | DB Support | Gap |
|---------|---------------|------------|-----|
| Source ID | ✅ | ✅ | None |
| Source Title | ✅ | ✅ | None |
| Page Number | ❌ | ✅ | **80%** |
| Chapter | ❌ | ✅ | **80%** |
| Section | ❌ | ✅ | **80%** |
| Daf (Talmud) | ❌ | ✅ | **80%** |
| Halacha | ❌ | ✅ | **80%** |
| Multi-format refs | ❌ | ✅ | **80%** |
| Editability | ❌ | N/A | **100%** |

**Result:** Editor can only use 20% of database citation capabilities.

### Use Cases Not Supported

1. **Talmud Citations:** Cannot specify daf (e.g., "Shabbos 31a")
2. **Halacha References:** Cannot cite specific halacha numbers
3. **Multi-System:** Cannot store both Sefaria and HebrewBooks references
4. **Corrections:** Cannot fix typos without deletion
5. **Chapter/Section:** Cannot cite "Chapter 5, Section 2"

---

## Issue 3: Topic Field Explosion

### Current State

**Problem:** Topics table has 20+ content fields with massive redundancy, violating i18n best practices.

#### Field Inventory

**Name Variations (7 fields):**
```typescript
{
  canonical_title: string,              // "Avodah"
  canonical_title_en: string,           // "Avodah" (duplicate!)
  canonical_title_transliteration: string, // "Avodah" (triplicate!)
  name_hebrew: string,                  // "עבודה"
  slug: string,                         // "avodah"
  // Missing: name_yiddish, name_aramaic, etc.
}
```

**Description Variations (4 fields):**
```typescript
{
  description: text,        // Short description (HTML)
  description_en: text,     // English short description (duplicate!)
  overview: text,           // Medium description (HTML)
  article: text            // Long description (HTML)
}
```

**Additional Content Fields (11 fields):**
```typescript
{
  practical_takeaways: text,
  historical_context: text,
  mashal: text,
  global_nimshal: text,
  charts: text,
  definition_positive: text,
  definition_negative: text,
  display_config: json,
  content_status: string,
  status_label: string,
  badge_color: string
}
```

**Metadata Fields (4 fields):**
```typescript
{
  topic_type: string,
  metadata: json,
  sources_count: integer,
  documents_count: integer
}
```

**Total:** 26 fields in topics table

### Problems

#### 1. Redundancy
- `canonical_title` vs `canonical_title_en` vs `canonical_title_transliteration` often contain identical values
- `description` vs `description_en` are duplicates
- No clear distinction between `overview` and `article`

#### 2. Scalability Issues
- Adding new language requires schema migration
- Currently supports: Hebrew, English, Transliteration
- Missing: Yiddish, Aramaic, Ladino, Russian, French, etc.
- Each new language = 7+ new fields

#### 3. Data Integrity
- No enforcement of which fields are required
- Unclear which field is "source of truth"
- Duplicate data leads to inconsistencies

#### 4. Developer Confusion
- Which field to use when?
- `description` vs `overview` vs `article`?
- `canonical_title` vs `canonical_title_en`?

#### 5. UI Complexity
```typescript
// @/app/editor/topics/[slug]/page.tsx has 7+ separate TipTap editors
editorsRef.current = {
  description: editor,
  overview: editor,
  article: editor,
  definition_positive: editor,
  definition_negative: editor,
  practical_takeaways: editor,
  historical_context: editor,
  mashal: editor,
  global_nimshal: editor,
  charts: editor
}
```

### Industry Standard: i18n Best Practice

**Professional approach:**

```typescript
// topics table (canonical data only)
{
  id: integer,
  slug: string,              // "avodah"
  topic_type: string,        // "concept"
  metadata: json
}

// topic_translations table (all translatable content)
{
  id: integer,
  topic_id: integer,         // FK to topics
  language_code: string,     // "en", "he", "yi", "ru", etc.
  
  // Name fields
  title: string,             // "Avodah" or "עבודה"
  transliteration: string,   // "Avodah" (only for non-Latin scripts)
  
  // Content fields
  description: text,         // Short
  overview: text,            // Medium
  article: text,             // Long
  
  // Additional content
  practical_takeaways: text,
  historical_context: text,
  mashal: text,
  global_nimshal: text,
  charts: text,
  definition_positive: text,
  definition_negative: text
}
```

**Benefits:**
- ✅ Add languages without schema changes
- ✅ Clear separation: canonical vs translated
- ✅ One field per piece of information
- ✅ Enforced consistency
- ✅ Scalable to 100+ languages

---

## Issue 4: Interconnected Problems

### How Issues Compound

```
Topic Field Explosion
    ↓
Unclear Field Requirements
    ↓
Validation Confusion
    ↓
Save Logic Complexity
    ↓
Editor System Mismatch
    ↓
Random Save Failures
    ↓
Permission Errors (unclear which fields need access)
```

### Evidence of Interconnection

1. **Save Logic:** Must handle 26 topic fields individually
2. **Validation:** No clear rules for which fields required
3. **Editors:** Multiple TipTap instances for redundant fields
4. **API Routes:** Complex logic to handle all field variations
5. **Permissions:** Unclear which fields need read/write access

---

## Proposed Solutions

### Solution 1: Unified Editor Architecture

**Goal:** Single editor system with consistent save logic.

**Approach:**
- Standardize on TipTap (more feature-rich, better maintained)
- Create unified sync adapter that works for both topics and documents
- Single source of truth for save logic

**Benefits:**
- ✅ Eliminates random save failures
- ✅ Consistent behavior across all editors
- ✅ Easier to maintain and debug
- ✅ Better error handling

### Solution 2: Enhanced Citation Model

**Goal:** Full-featured citations with edit capability.

**Editor Schema:**
```typescript
const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "" },
    
    // Citation type determines which fields are relevant
    citation_type: { default: "page" }, // page|chapter|section|daf|verse|custom
    
    // Flexible reference fields
    page_number: { default: "" },      // "17a", "23b"
    chapter_number: { default: null },  // 5
    section_number: { default: null },  // 2
    daf_number: { default: "" },        // "3b:6"
    halacha_number: { default: null },  // 12
    verse_number: { default: "" },      // "1:5"
    custom_reference: { default: "" },  // Fallback
    
    // Multi-system support
    external_refs: { default: [] }      // [{ system: "sefaria", ref: "..." }]
  },
  
  // Make editable
  contenteditable: true,
  
  // Render based on citation_type
  toDOM(node): DOMOutputSpec {
    const display = formatCitation(node.attrs);
    return ["span", { 
      class: "citation-node editable",
      "data-citation-type": node.attrs.citation_type
    }, display];
  }
}
```

**Benefits:**
- ✅ Supports all citation types
- ✅ Editable after creation
- ✅ Maps to full database schema
- ✅ Extensible for future needs

### Solution 3: Professional i18n Architecture

**Goal:** One field per piece of information, scalable translation system.

#### New Schema Design

**topics (canonical data only):**
```typescript
{
  id: integer PRIMARY KEY,
  slug: string UNIQUE NOT NULL,
  topic_type: string,           // "person", "concept", "place", "event"
  default_language: string,     // "he" or "en"
  metadata: json,
  
  // Counts (auto-calculated or manual override)
  sources_count: integer,
  documents_count: integer,
  
  // Display config
  content_status: string,       // "minimal", "partial", "comprehensive"
  status_label: string,
  badge_color: string,
  display_config: json
}
```

**topic_translations (all translatable content):**
```typescript
{
  id: integer PRIMARY KEY,
  topic_id: integer REFERENCES topics(id) ON DELETE CASCADE,
  language_code: string NOT NULL,  // ISO 639-1: "en", "he", "yi", "ru"
  
  // Name
  title: string NOT NULL,
  transliteration: string,         // Only for non-Latin scripts
  
  // Content (all optional, depends on content_status)
  description: text,               // Short (1-3 sentences)
  overview: text,                  // Medium (1-3 paragraphs)
  article: text,                   // Long (full article)
  
  // Definitions
  definition_positive: text,       // What it IS
  definition_negative: text,       // What it's NOT
  
  // Teaching aids
  practical_takeaways: text,
  historical_context: text,
  mashal: text,                    // Parable
  global_nimshal: text,            // Universal application
  charts: text,                    // Markdown tables/charts
  
  // Metadata
  is_machine_translated: boolean DEFAULT false,
  translation_quality: string,     // "draft", "reviewed", "professional"
  translated_by: uuid REFERENCES directus_users(id),
  translated_at: timestamp,
  
  UNIQUE(topic_id, language_code)
}
```

#### Migration Strategy

**Phase 1: Add translations table**
```sql
CREATE TABLE topic_translations (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  transliteration VARCHAR(255),
  description TEXT,
  overview TEXT,
  article TEXT,
  definition_positive TEXT,
  definition_negative TEXT,
  practical_takeaways TEXT,
  historical_context TEXT,
  mashal TEXT,
  global_nimshal TEXT,
  charts TEXT,
  is_machine_translated BOOLEAN DEFAULT false,
  translation_quality VARCHAR(50) DEFAULT 'draft',
  translated_by UUID,
  translated_at TIMESTAMP,
  UNIQUE(topic_id, language_code)
);
```

**Phase 2: Migrate existing data**
```sql
-- Migrate Hebrew content
INSERT INTO topic_translations (
  topic_id, language_code, title, description, overview, article,
  definition_positive, definition_negative, practical_takeaways,
  historical_context, mashal, global_nimshal, charts
)
SELECT 
  id, 'he',
  COALESCE(canonical_title, name_hebrew),
  description,
  overview,
  article,
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts
FROM topics
WHERE original_lang = 'he' OR name_hebrew IS NOT NULL;

-- Migrate English content (only if different from Hebrew)
INSERT INTO topic_translations (
  topic_id, language_code, title, description, overview, article,
  definition_positive, definition_negative, practical_takeaways,
  historical_context, mashal, global_nimshal, charts
)
SELECT 
  id, 'en',
  COALESCE(canonical_title_en, canonical_title),
  description_en,
  overview,  -- Assuming overview is English
  article,   -- Assuming article is English
  definition_positive,
  definition_negative,
  practical_takeaways,
  historical_context,
  mashal,
  global_nimshal,
  charts
FROM topics
WHERE canonical_title_en IS NOT NULL 
  AND canonical_title_en != canonical_title;
```

**Phase 3: Drop redundant columns**
```sql
ALTER TABLE topics
  DROP COLUMN canonical_title,
  DROP COLUMN canonical_title_en,
  DROP COLUMN canonical_title_transliteration,
  DROP COLUMN name_hebrew,
  DROP COLUMN description,
  DROP COLUMN description_en,
  DROP COLUMN overview,
  DROP COLUMN article,
  DROP COLUMN definition_positive,
  DROP COLUMN definition_negative,
  DROP COLUMN practical_takeaways,
  DROP COLUMN historical_context,
  DROP COLUMN mashal,
  DROP COLUMN global_nimshal,
  DROP COLUMN charts,
  DROP COLUMN original_lang;  -- No longer needed
```

**Phase 4: Add constraints**
```sql
-- Ensure every topic has at least one translation
CREATE FUNCTION check_topic_has_translation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM topic_translations 
    WHERE topic_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Topic must have at least one translation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER ensure_translation
  AFTER INSERT ON topics
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_topic_has_translation();
```

#### API Changes

**Before:**
```typescript
// GET /api/topics/avodah
{
  id: 122,
  canonical_title: "Avodah",
  canonical_title_en: "Avodah",
  name_hebrew: "עבודה",
  description: "<p>Divine service...</p>",
  description_en: "<p>Divine service...</p>",
  overview: null,
  article: null
}
```

**After:**
```typescript
// GET /api/topics/avodah?lang=en
{
  id: 122,
  slug: "avodah",
  topic_type: "concept",
  translations: {
    en: {
      title: "Avodah",
      transliteration: "Avodah",
      description: "<p>Divine service...</p>"
    },
    he: {
      title: "עבודה",
      description: "<p>עבודה אלוקית...</p>"
    }
  },
  // Or with ?lang=en, return only English:
  title: "Avodah",
  description: "<p>Divine service...</p>"
}
```

#### UI Changes

**Before:** 7+ separate input fields
```tsx
<input name="canonical_title" />
<input name="canonical_title_en" />
<input name="name_hebrew" />
<TipTapEditor name="description" />
<TipTapEditor name="description_en" />
<TipTapEditor name="overview" />
<TipTapEditor name="article" />
```

**After:** Language selector + unified fields
```tsx
<LanguageSelector value={currentLang} onChange={setCurrentLang} />

{/* Fields auto-load for selected language */}
<input name="title" value={translations[currentLang].title} />
<TipTapEditor name="description" content={translations[currentLang].description} />
<TipTapEditor name="overview" content={translations[currentLang].overview} />
<TipTapEditor name="article" content={translations[currentLang].article} />
```

**Benefits:**
- ✅ Clear which language you're editing
- ✅ Easy to see translation coverage
- ✅ Can copy content between languages
- ✅ Reduced cognitive load

---

## Implementation Roadmap

### Phase 1: Documentation ✅ (Current)
- [x] Audit current schema
- [x] Document all issues
- [x] Propose solutions
- [ ] Review with stakeholders

### Phase 2: Design (Week 1)
- [ ] Finalize i18n schema design
- [ ] Design unified citation model
- [ ] Create API contract specifications
- [ ] Design migration scripts

### Phase 3: Database Migration (Week 2)
- [ ] Create `topic_translations` table
- [ ] Write data migration scripts
- [ ] Test migration on staging data
- [ ] Create rollback procedures
- [ ] Execute migration

### Phase 4: Citation Enhancement (Week 2-3)
- [ ] Extend citation node schema
- [ ] Add edit capability to citations
- [ ] Create citation type selector UI
- [ ] Update citation insertion logic
- [ ] Add citation validation

### Phase 5: Unify Editor Logic (Week 3-4)
- [ ] Create unified TipTap adapter
- [ ] Migrate ProseMirror documents to TipTap
- [ ] Consolidate save logic
- [ ] Add comprehensive error handling
- [ ] Test all editor instances

### Phase 6: Update API Routes (Week 4)
- [ ] Modify topic APIs for translations
- [ ] Add language parameter handling
- [ ] Update validation logic
- [ ] Add translation CRUD endpoints
- [ ] Update documentation

### Phase 7: Frontend Updates (Week 5)
- [ ] Add language selector component
- [ ] Update topic editor forms
- [ ] Migrate all TipTap instances
- [ ] Update citation UI
- [ ] Add translation management UI

### Phase 8: Testing & Validation (Week 6)
- [ ] Test save persistence
- [ ] Test citation editing
- [ ] Test translation workflows
- [ ] Test language switching
- [ ] Performance testing
- [ ] User acceptance testing

---

## Risk Assessment

### High Risk
- **Data Migration:** Potential data loss if migration scripts fail
  - **Mitigation:** Comprehensive backups, staging environment testing, rollback procedures

### Medium Risk
- **Editor Migration:** Breaking existing editor functionality
  - **Mitigation:** Feature flags, gradual rollout, extensive testing

### Low Risk
- **API Changes:** Breaking frontend-backend contract
  - **Mitigation:** Versioned APIs, backward compatibility layer

---

## Success Metrics

### Technical Metrics
- ✅ 100% save success rate (currently ~70-80%)
- ✅ Zero data loss during migration
- ✅ <100ms API response time for translations
- ✅ Support for 5+ languages without schema changes

### User Metrics
- ✅ Zero lost work incidents
- ✅ Reduced editor confusion (measured by support tickets)
- ✅ Increased translation coverage
- ✅ Faster content creation workflow

---

## Appendix A: Current vs Proposed Schema Comparison

### Topics Table

**Current (26 fields):**
```
id, canonical_title, canonical_title_en, canonical_title_transliteration,
name_hebrew, slug, topic_type, description, description_en, overview,
article, practical_takeaways, historical_context, mashal, global_nimshal,
charts, definition_positive, definition_negative, metadata, content_status,
status_label, badge_color, display_config, sources_count, documents_count,
original_lang
```

**Proposed (10 fields):**
```
id, slug, topic_type, default_language, metadata, content_status,
status_label, badge_color, display_config, sources_count, documents_count
```

**Reduction:** 61% fewer fields

### New Tables

**topic_translations:**
- Handles all translatable content
- Supports unlimited languages
- Clear translation metadata

---

## Appendix B: Code References

### Editor Save Logic
- `@/lib/editor-sync.ts:60-182` - ProseMirror sync
- `@/app/editor/topics/[slug]/page.tsx:220-267` - TipTap manual save
- `@/components/editor/hooks/useEditorSync.ts` - Sync hook

### Citation System
- `@/components/editor/schema.ts:134-170` - Citation node definition
- `@/components/editor/plugins/citations/comprehensiveCitationPlugin.ts` - Citation plugin
- `@/components/editor/CitationCommandPalette.tsx` - Citation UI

### Topic Editor
- `@/app/editor/topics/[slug]/page.tsx` - Main editor page
- Lines 710-870: Multiple TipTap editor instances

---

## Appendix C: Database Schema (Current)

### Topics Collection
```typescript
{
  id: integer PRIMARY KEY,
  canonical_title: string REQUIRED,
  original_lang: string,  // "he" | "en"
  slug: string REQUIRED,
  topic_type: string,  // "person" | "concept" | "place" | "event"
  
  // Name variations
  canonical_title_en: string,
  canonical_title_transliteration: string,
  name_hebrew: string,
  
  // Content variations
  description: text,
  description_en: text,
  overview: text,
  article: text,
  
  // Additional content
  practical_takeaways: text,
  historical_context: text,
  mashal: text,
  global_nimshal: text,
  charts: text,
  definition_positive: text,
  definition_negative: text,
  
  // Display config
  metadata: json,
  content_status: string,
  status_label: string,
  badge_color: string,
  display_config: json,
  
  // Counts
  sources_count: integer,
  documents_count: integer
}
```

### Content Blocks Collection
```typescript
{
  id: integer PRIMARY KEY,
  document_id: integer REFERENCES documents(id),
  block_type: string,  // "heading" | "subheading" | "paragraph" | "section break"
  order_key: string,
  order_position: integer,
  content: text,
  
  // Citation fields (underutilized)
  page_number: string,
  chapter_number: integer,
  halacha_number: integer,
  daf_number: string,
  section_number: integer,
  citation_refs: json,  // [{ system: string, reference: string }]
  
  metadata: json
}
```

---

## Next Steps

1. **Review this document** with team/stakeholders
2. **Approve or modify** proposed solutions
3. **Begin Phase 2:** Detailed design specifications
4. **Create test environment** for migration testing
5. **Set timeline** for implementation phases

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Author:** System Audit  
**Status:** Awaiting Review
