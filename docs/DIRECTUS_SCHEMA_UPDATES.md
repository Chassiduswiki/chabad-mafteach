# Directus Schema Updates for Scholarly Authority System

## Current Schema Status

**Last Updated**: January 28, 2026  
**Schema Version**: Current MCP snapshot  

### Existing Collections Overview

The system currently has the following relevant collections:

#### `topic_translations`
- **Purpose**: Translations for topics in multiple languages
- **Current Fields**: 23 fields including basic translation data, rich text content, and quality metrics
- **Missing Fields**: `conceptual_variants`, `terminology_notes`

#### `sources`  
- **Purpose**: Source materials and references
- **Current Fields**: 14 fields including metadata, external system links, and author relationships
- **Missing Fields**: `authority_level`

---

## Required Schema Updates

You need to make schema changes in your Directus instance to support the new scholarly authority features. There are two approaches:

### Option 1: Using Directus Admin UI (Recommended)

1. **Log into Directus Admin** at your Directus URL
2. Navigate to **Settings → Data Model**

#### Update `topic_translations` Collection

**Current Status**: Missing scholarly authority fields  
**Required Fields**: 2 new fields

1. Click on the **`topic_translations`** collection
2. Click **"Create Field"** button
3. **Add Field 1: conceptual_variants**
   - Field Name: `conceptual_variants`
   - Type: **JSON**
   - Interface: **JSON Editor**
   - Default Value: `[]` (empty array)
   - Optional: ✅ (checked)
   - Note: "Alternative conceptual framings from different authoritative sources"
   - Click **Save**

4. **Add Field 2: terminology_notes**
   - Field Name: `terminology_notes`
   - Type: **Text**
   - Interface: **Textarea**
   - Optional: ✅ (checked)
   - Note: "Translation and terminology clarification notes"
   - Click **Save**

#### Update `sources` Collection

**Current Status**: Missing authority classification  
**Required Fields**: 1 new field

1. Click on the **`sources`** collection
2. Click **"Create Field"** button
3. **Add Field: authority_level**
   - Field Name: `authority_level`
   - Type: **Dropdown (Single Selection)**
   - Interface: **Dropdown**
   - Optional: ✅ (checked)
   - Default Value: `explanatory`
   - Note: "Classification of source authority in scholarly hierarchy"
   - Choices:
     ```
     foundational
     explanatory
     contextual
     supplementary
     ```
   - Click **Save**

---

### Option 2: SQL Migration (For Advanced Users)

If you have direct database access, run this SQL:

```sql
-- Add fields to topic_translations
ALTER TABLE topic_translations
ADD COLUMN conceptual_variants JSONB DEFAULT '[]',
ADD COLUMN terminology_notes TEXT;

-- Add field to sources
ALTER TABLE sources
ADD COLUMN authority_level VARCHAR(50) DEFAULT 'explanatory',
ADD CONSTRAINT sources_authority_level_check 
  CHECK (authority_level IN ('foundational', 'explanatory', 'contextual', 'supplementary'));

-- Add comments for documentation
COMMENT ON COLUMN topic_translations.conceptual_variants IS 'Alternative conceptual framings from different authoritative sources';
COMMENT ON COLUMN topic_translations.terminology_notes IS 'Translation and terminology clarification notes';
COMMENT ON COLUMN sources.authority_level IS 'Classification of source authority in scholarly hierarchy';
```

---

## MCP Schema Implementation

For automated schema updates using the MCP (Model Context Protocol) tools:

### Using MCP Collections Tool

```bash
# Add conceptual_variants field to topic_translations
mcp0_fields create --collection=topic_translations --data='[
  {
    "field": "conceptual_variants",
    "type": "json",
    "meta": {
      "interface": "input-code",
      "note": "Alternative conceptual framings from different authoritative sources",
      "options": {
        "language": "json"
      }
    },
    "schema": {
      "default_value": "[]"
    }
  },
  {
    "field": "terminology_notes", 
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "note": "Translation and terminology clarification notes"
    }
  }
]'

# Add authority_level field to sources
mcp0_fields create --collection=sources --data='[
  {
    "field": "authority_level",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "note": "Classification of source authority in scholarly hierarchy",
      "options": {
        "choices": [
          {"text": "Foundational", "value": "foundational"},
          {"text": "Explanatory", "value": "explanatory"}, 
          {"text": "Contextual", "value": "contextual"},
          {"text": "Supplementary", "value": "supplementary"}
        ]
      }
    },
    "schema": {
      "default_value": "explanatory"
    }
  }
]'
```

---

## Verification

After making the changes, verify they worked:

1. Go to **Content → topic_translations**
2. Click on any translation entry
3. You should see two new fields at the bottom:
   - **conceptual_variants** (JSON editor)
   - **terminology_notes** (text area)

4. Go to **Content → sources**
5. Click on any source entry
6. You should see a new **authority_level** dropdown with options:
   - foundational
   - explanatory
   - contextual
   - supplementary

### MCP Verification

After running the MCP commands, verify the schema updates:

```bash
# Check topic_translations schema
mcp0_schema --keys='["topic_translations"]'

# Check sources schema  
mcp0_schema --keys='["sources"]'

# Verify fields exist in the response
```

---

## Schema Impact Analysis

### Before Updates
- `topic_translations`: 23 fields
- `sources`: 14 fields

### After Updates  
- `topic_translations`: 25 fields (+2 scholarly authority fields)
- `sources`: 15 fields (+1 authority classification field)

### New Capabilities
1. **Multi-perspective conceptual framing** via `conceptual_variants`
2. **Translation transparency** via `terminology_notes`
3. **Source authority hierarchy** via `authority_level`

---

## Test Data (Optional)

To test the new fields, you can add sample data:

### Sample Conceptual Variant

In any topic translation, set `conceptual_variants` to:

```json
[
  {
    "type": "tanya_framing",
    "title": "In Tanya",
    "content": "<p>This is how Tanya frames this concept...</p>",
    "sources": ["tanya_ch32"],
    "order": 1
  },
  {
    "type": "kabbalistic_background",
    "title": "Kabbalistic Roots",
    "content": "<p>The Zohar explains...</p>",
    "sources": ["zohar_123a"],
    "order": 2
  }
]
```

### Sample Terminology Notes

In the `terminology_notes` field:

```
Translation note: The term "Atzmus" is deliberately left untranslated 
as there is no perfect English equivalent. Some translators use "Essence" 
but this can be misleading. The Hebrew/Yiddish original should be preserved.
```

### Sample Authority Level

For a source like "Tanya":
- Set `authority_level` to: **foundational**

For a source like "Lessons in Tanya":
- Set `authority_level` to: **explanatory**

For a source like "Contemporary Commentary":
- Set `authority_level` to: **contextual**

For a source like "Supplementary Notes":
- Set `authority_level` to: **supplementary**

---

## Implementation Timeline

### Phase 1: Schema Updates ✅
- [x] Document current schema state
- [x] Create MCP implementation guide  
- [ ] Apply schema changes via MCP or UI
- [ ] Verify field creation

### Phase 2: Frontend Integration 🚀
- [ ] Update TopicExperienceV2 component
- [ ] Add conceptual variants display
- [ ] Implement terminology notes UI
- [ ] Add authority level indicators

### Phase 3: Content Migration 📚
- [ ] Populate authority levels for existing sources
- [ ] Add terminology notes for key translations
- [ ] Create conceptual variants for major topics

---

## Troubleshooting

### Common Issues

1. **MCP Command Fails**
   - Check Directus connection
   - Verify collection names match exactly
   - Ensure proper JSON formatting

2. **Field Not Visible in UI**
   - Refresh browser cache
   - Check user permissions
   - Verify field is not hidden

3. **SQL Migration Errors**
   - Check table exists
   - Verify column names don't conflict
   - Ensure proper PostgreSQL syntax

### Rollback Procedure

If updates cause issues:

```sql
-- Rollback topic_translations
ALTER TABLE topic_translations 
DROP COLUMN IF EXISTS conceptual_variants,
DROP COLUMN IF EXISTS terminology_notes;

-- Rollback sources  
ALTER TABLE sources
DROP COLUMN IF EXISTS authority_level;
```

---

## What's Next

Once these schema changes are complete:
- ✅ **Phase 1** is done
- 🚀 We can proceed to **Phase 2**: Creating TopicExperienceV2 component
- 📚 **Phase 3**: Content population and authority mapping
