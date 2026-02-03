# Sefer Import System

A generalized system for importing hierarchical Jewish texts (seforim) into the Directus sources table.

## Quick Start

```bash
# Import Likkutei Sichos (already done)
node scripts/import-sefer/import.mjs likkutei-sichos

# Dry run (see what would be created)
node scripts/import-sefer/import.mjs tanya --dry-run
```

## Creating a New Config

1. Copy an existing config from `configs/`
2. Modify for your sefer's structure
3. Run with `--dry-run` first to verify

## Config Structure

```javascript
{
  id: 'my-sefer',                    // Unique identifier
  name: 'My Sefer',                  // Display name

  root: {
    title: 'My Sefer',               // Root source title
    author_id: 8,                    // Author ID from database
    original_lang: 'he',             // he, yi, en, ar
    authority_level: 'primary',      // primary, secondary, explanatory
  },

  dataSource: {
    type: 'url',                     // url, file, or inline
    url: 'https://example.com/data.json',
  },

  hierarchy: {
    structure: 'grouped',            // flat, grouped, or nested

    middleLevel: {                   // Optional - volumes, sections, etc.
      levelName: 'Volume',
      extract: {
        groupByField: 'volume',      // Field in data to group by
        titleTemplate: 'My Sefer {value}',
        sortType: 'hebrew-numeric',  // numeric, alphabetic, hebrew-numeric
      },
    },

    leafLevel: {                     // Individual items (chapters, sichos)
      levelName: 'Chapter',
      mappings: {
        title: 'title',              // Direct field or { template: '...' }
        pageNumber: 'page',          // Or { extract: { from: 'title', regex: '...' } }
        pageCount: 'pages',
        parsha: 'parsha',
        language: 'language',        // Or { static: 'he' }
        metadata: { ... },           // Additional fields to store
      },
      externalUrl: {                 // Optional - for external links
        system: 'chabad.org',
        idField: 'articleid',
        urlTemplate: 'https://example.com/{id}',
        requireId: true,
      },
    },
  },

  transforms: {                      // Optional data transformations
    preProcess: (data) => [...],     // Transform raw data
    transformLeaf: (item) => {...},  // Transform each item
    filter: (item) => true,          // Filter items
  },

  options: {
    skipExisting: true,              // Skip if title exists
    dryRun: false,                   // Don't actually create
    batchSize: 50,                   // Items per batch
    batchDelay: 100,                 // MS between batches
  },
}
```

## Available Authors

| ID | Name |
|----|------|
| 2 | The Alter Rebbe |
| 3 | The Mitteler Rebbe |
| 4 | The Tzemach Tzedek |
| 5 | The Rebbe Maharash |
| 6 | The Rebbe Rashab |
| 7 | The Frierdiker Rebbe |
| 8 | The Rebbe |

## Database Fields

The import populates these `sources` fields:
- `title` - Source title
- `parent_id` - Parent source ID (for hierarchy)
- `page_number` - Starting page
- `page_count` - Number of pages
- `parsha` - Torah portion (if applicable)
- `external_url` - Link to external viewer
- `external_system` - External system name
- `external_id` - ID in external system
- `metadata` - JSON with additional data

## Example Configs

- `likkutei-sichos.config.mjs` - Working example with berel.me data
- `tanya.config.ts` - Template for Tanya (needs data source)

## Citation Integration

After import, sources can be cited using the enhanced citation modal:
- **Browse**: Drill down Root → Volume → Sicha
- **Search**: Search by title, parsha, etc.
- **Smart Lookup**: Enter "vol 4, page 345" → auto-resolves to exact source

The hierarchy API endpoint is at `/api/sources/hierarchy`.
