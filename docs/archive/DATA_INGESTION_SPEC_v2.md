# Data Ingestion Specification v2 (Strict Alignment)

**Purpose**: Define the exact format for data ingestion, strictly aligned with `New-directus-data-model.md`.
**Status**: Finalized for Data Team.

---

## 🧠 Content Hierarchy & Logic

Before preparing files, understand how the pieces fit together:

1. **`documents` (The Container)**
   - Represents a whole book (e.g., "Tanya") or a standalone article.
   - It's the root parent. It doesn't hold text directly, just metadata.

2. **`paragraphs` (The Structure)**
   - Chunks of text (Chapters, Sections, or actual paragraphs).
   - **Order Key** (`1:000`) keeps them sorted logically (e.g., Perek 1, Paragraph 1).
   - Holds the raw text for reading flow.

3. **`statements` (The Atomic Unit)**
   - The smallest unit of meaning (usually a sentence or phrase).
   - This is what gets **tagged** with topics and **cited** by other sources.
   - Granular control: allows us to say "This specific sentence talks about Ahavas Yisroel."

4. **`topics` (The Concept)**
   - Abstract ideas (e.g., "Bittul").
   - They don't "contain" text; they **tag** statements via a junction table (`statement_topics`).
   - When a user views a Topic page, we pull all Statements tagged with that Topic.

**Visual Flow:**
`Document (Tanya)` → contains `Paragraphs (Chapters)` → broken into `Statements (Sentences)` ← tagged by `Topics (Concepts)`

---

## 1. TOPICS Collection

**Directus Collection**: `topics`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `canonical_title` | String | ✅ Yes | English name. |
| `slug` | String | ✅ Yes | URL-safe unique identifier. |
| `topic_type` | Dropdown | ✅ Yes | `person`, `concept`, `place`, `event`, `mitzvah`, `sefirah`. |
| `description` | Text | ❌ No | Short description/definition. |
| `original_lang` | Dropdown | ❌ No | ISO code (`en`, `he`). |
| `metadata` | JSON | ❌ No | Store rich content (`overview`, `article`) here for now. |

**JSON Example (`topics.json`)**:
```json
[
  {
    "canonical_title": "Ahavas Yisroel",
    "slug": "ahavas-yisroel",
    "topic_type": "concept",
    "description": "Love of a fellow Jew.",
    "original_lang": "en",
    "metadata": {
      "overview": "Full overview text...",
      "definition_positive": "What it is...",
      "aliases": ["Love of Israel"]
    }
  }
]
```

---

## 2. DOCUMENTS Collection (Content Root)

**Directus Collection**: `documents`
*Note: Does NOT have an `author` field directly. Authors are tracked in metadata or linked via `sources`.*

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | ✅ Yes | Full title (e.g., "Tanya"). |
| `doc_type` | Dropdown | ❌ No | `entry`, `sefer`. |
| `original_lang` | Dropdown | ❌ No | ISO code. |
| `status` | Dropdown | ❌ No | `draft`, `reviewed`, `published`, `archived`. |
| `has_ocr` | Boolean | ❌ No | Default `false`. |
| `ocr_confidence` | Decimal | ❌ No | 0.0 to 1.0. |
| `page_count` | Integer | ❌ No | |
| `source_format` | Dropdown | ❌ No | `pdf`, `html`, `docx`, `manual_entry`. |
| `metadata` | JSON | ❌ No | Store author name here if not using `sources` link yet. |
| `published_at` | DateTime | ❌ No | |

**JSON Example (`documents.json`)**:
```json
[
  {
    "title": "Tanya – Likutei Amarim",
    "doc_type": "sefer",
    "original_lang": "he",
    "status": "published",
    "source_format": "manual_entry",
    "metadata": {
      "author_name": "Rabbi Schneur Zalman of Liadi"
    }
  }
]
```

---

## 3. PARAGRAPHS Collection (Structure)

**Directus Collection**: `paragraphs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `doc_id` | UUID | ✅ Yes | ID of parent Document. |
| `order_key` | String | ✅ Yes | Sort key (e.g., "1:000"). |
| `text` | Text | ✅ Yes | Paragraph content. |
| `original_lang` | Dropdown | ❌ No | ISO code. |
| `status` | Dropdown | ❌ No | `draft`, `reviewed`, `published`. |
| `page_number` | Integer | ❌ No | |
| `column_number` | Integer | ❌ No | |
| `metadata` | JSON | ❌ No | |

**JSON Example (`paragraphs.json`)**:
```json
[
  {
    "doc_id": "uuid-of-tanya-doc",
    "order_key": "1:000",
    "text": "תניא [בסוף פרק ג דנדה]...",
    "original_lang": "he",
    "status": "published"
  }
]
```

---

## 4. STATEMENTS Collection (Granular Text)

**Directus Collection**: `statements`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `paragraph_id` | UUID | ✅ Yes | ID of parent Paragraph. |
| `order_key` | String | ✅ Yes | Sort key (e.g., "1:000:000"). |
| `text` | Text | ✅ Yes | Statement content. |
| `original_lang` | Dropdown | ❌ No | ISO code. |
| `status` | Dropdown | ❌ No | `draft`, `reviewed`, `published`. |
| `importance_score` | Decimal | ❌ No | 0.0 to 1.0. |
| `is_deleted` | Boolean | ❌ No | Default `false`. |
| `is_disputed` | Boolean | ❌ No | Default `false`. |
| `metadata` | JSON | ❌ No | |

**JSON Example (`statements.json`)**:
```json
[
  {
    "paragraph_id": "uuid-of-paragraph",
    "order_key": "1:000:000",
    "text": "תניא...",
    "original_lang": "he",
    "status": "published",
    "importance_score": 1.0
  }
]
```

---

## 5. TRANSLATIONS Collection

**Directus Collection**: `translations`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `entity_type` | Dropdown | ✅ Yes | `document`, `paragraph`, `statement`, `topic`. |
| `entity_id` | UUID | ✅ Yes | ID of the entity. |
| `field_name` | String | ✅ Yes | Field being translated (e.g., "text", "description"). |
| `target_lang` | Dropdown | ✅ Yes | ISO code (e.g., "en"). |
| `translated_text` | Text | ✅ Yes | The translation. |
| `translation_quality` | Dropdown | ❌ No | `unverified`, `human_verified`, etc. |

**JSON Example (`translations.json`)**:
```json
[
  {
    "entity_type": "statement",
    "entity_id": "uuid-of-statement",
    "field_name": "text",
    "target_lang": "en",
    "translated_text": "We have learned...",
    "translation_quality": "human_verified"
  }
]
```

---

## 6. SOURCES Collection (Metadata)

**Directus Collection**: `sources`
*Used for bibliographic data, linked to authors.*

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | ✅ Yes | Source title. |
| `original_lang` | Dropdown | ❌ No | ISO code. |
| `publication_year` | Integer | ❌ No | |
| `publisher` | String | ❌ No | |
| `is_external` | Boolean | ❌ No | |
| `metadata` | JSON | ❌ No | |

**JSON Example (`sources.json`)**:
```json
[
  {
    "title": "Tanya – Likutei Amarim",
    "original_lang": "he",
    "publication_year": 1797
  }
]
```
