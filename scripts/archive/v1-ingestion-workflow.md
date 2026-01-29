---
description: Complete workflow for ingesting v1.md Chassidus dictionary into Directus
---

# v1.md Dictionary Ingestion Workflow

## Overview

This workflow ingests the Chassidus Basics Dictionary (v1.md) into Directus, creating topics, relationships, and enabling cross-referenced knowledge graph connections.

## Architecture

```
v1.md (799 lines, ~40 entries)
    ↓
Parser (ingest-v1-dictionary.ts)
    ↓
Sample JSON (v1-sample-ingestion.json)
    ↓
Directus API Client (ingest-to-directus.ts)
    ↓
Directus Database
    ├── topics (canonical entries)
    ├── topic_relationships (cross-references)
    └── metadata (sources, categories)
```

## Step 1: Parse Dictionary Entries

### Command
```bash
npx ts-node scripts/ingest-v1-dictionary.ts
```

### What it does
- Reads v1.md and extracts ~40 entries
- Parses each entry structure:
  - Hebrew term + English term
  - Definition
  - Mashal (parable)
  - Personal Nimshal (application)
  - Global Nimshal (cosmic meaning)
  - Sources
  - Cross-references (e.g., `[[Keter]]`, `[[Mitzvos]]`)
- Converts to Directus topic format
- Outputs first 5 entries to `v1-sample-ingestion.json`

### Output
```json
[
  {
    "canonical_title": "Avodah",
    "canonical_title_transliteration": "Avodah",
    "canonical_title_en": "Avodah",
    "slug": "avodah",
    "description": "Divine service, especially davening...",
    "overview": "<h3>Mashal...</h3><p>...</p>",
    "historical_context": "The goal of creation is to make...",
    "practical_takeaways": "Any time we work to improve...",
    "topic_type": "concept",
    "metadata": {
      "category": "General Concepts",
      "sources": [],
      "crossReferences": ["Nefesh", "Mitzvos"],
      "originalEntry": { ... }
    }
  }
]
```

## Step 2: Ingest to Directus

### Prerequisites
```bash
export DIRECTUS_URL="http://localhost:8055"
export DIRECTUS_ACCESS_TOKEN="your_admin_token"
```

### Command
```bash
npx ts-node scripts/ingest-to-directus.ts
```

### What it does

**Phase 1: Create Topics**
- Batch creates 5 sample topics in `topics` table
- Sets `content_status: "partial"` (indicates dictionary-sourced)
- Sets `badge_color: "blue"` for visual distinction
- Returns topic IDs for relationship linking

**Phase 2: Create Relationships**
- Scans cross-references in metadata
- Creates `topic_relationships` entries
- Links related topics with `relation_type: "related_to"`
- Sets `strength: 0.7` for cross-reference confidence

### Output
```
🚀 Starting ingestion of 5 sample topics to Directus
📍 Directus URL: http://localhost:8055

📝 Step 1: Creating topics...
Creating topic: Avodah...
✅ Created topic ID: 42
Creating topic: Haskalah...
✅ Created topic ID: 43
...

🔗 Step 2: Creating relationships from cross-references...
Creating relationship: avodah -> nefesh
✅ Created relationship ID: 101
...

📊 Ingestion Summary:
   Topics created: 5
   Relationships created: 8
   Topic ID Map:
     avodah: 42
     haskalah: 43
     ...
```

## Step 3: Verify in Directus

1. **Check Topics**
   - Navigate to Content → Topics
   - Filter by `content_status: "partial"` to see ingested entries
   - Verify fields populated: title, transliteration, description, overview

2. **Check Relationships**
   - Navigate to Content → Topic Relationships
   - Verify cross-references created
   - Check relationship strength and type

3. **Test Knowledge Graph**
   - Click on a topic
   - Verify related topics appear in UI
   - Check that cross-references resolve

## Data Mapping Reference

| v1.md Section | Directus Field | Format |
|---|---|---|
| Entry name | `canonical_title` | English text |
| Hebrew term | `canonical_title_transliteration` | Transliterated |
| Definition | `description` | Plain text |
| Mashal + Personal Nimshal | `overview` | HTML formatted |
| Global Nimshal | `historical_context` | Plain text |
| Category | `metadata.category` | String |
| Cross-references `[[X]]` | `metadata.crossReferences` | Array |
| Sources | `metadata.sources` | Array |

## Full Ingestion (All ~40 Entries)

### Command
```bash
npx ts-node scripts/ingest-v1-dictionary-full.ts
```

This will:
1. Parse all ~40 entries from v1.md
2. Create topics in batch (50 at a time)
3. Create all cross-reference relationships
4. Generate ingestion report with statistics

### Expected Results
- ~40 topics created
- ~80-100 relationships created
- All cross-references resolved
- Content status: "partial" (fallback content)

## Integration with Team Entries

The dictionary serves as a **fallback/baseline**:

```typescript
// In topic detail page
if (topic.content_status === 'comprehensive') {
  // Show team-written entry (emunah.md, ratzon.md)
  renderTeamEntry(topic);
} else if (topic.content_status === 'partial') {
  // Show dictionary entry with "Learn More" CTA
  renderDictionaryEntry(topic);
  showCallToAction('Help us write a complete entry');
}
```

## Validation Checklist

- [ ] Parser extracts all entries correctly
- [ ] Cross-references identified and stored
- [ ] Topics created with all required fields
- [ ] Relationships created for cross-references
- [ ] Content status set to "partial"
- [ ] No orphaned relationships (all references resolve)
- [ ] Slugs are unique and URL-safe
- [ ] Hebrew transliterations accurate

## Troubleshooting

### Parser Issues
```bash
# Debug: Print all found entries
npx ts-node scripts/ingest-v1-dictionary.ts --debug
```

### Directus Connection Issues
```bash
# Test connection
curl -H "Authorization: Bearer $DIRECTUS_ACCESS_TOKEN" \
  $DIRECTUS_URL/items/topics?limit=1
```

### Relationship Creation Failures
- Check that both topics exist in database
- Verify topic slugs match cross-reference names
- Check for typos in cross-reference format `[[Term]]`

## Future Enhancements

1. **Automatic Transliteration**
   - Replace simplified transliteration with proper Hebrew library
   - Support multiple transliteration standards

2. **Source Linking**
   - Parse sources section and create `source_links`
   - Link to Sefaria API for source references

3. **Learning Paths**
   - Extract difficulty levels from entries
   - Create learning path relationships

4. **Progressive Enhancement**
   - Auto-update when team writes comprehensive entry
   - Merge dictionary + team content
   - Track content evolution

5. **Batch Operations**
   - Use Directus batch API for faster ingestion
   - Implement transaction rollback on errors
