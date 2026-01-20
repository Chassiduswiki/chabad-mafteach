# Enhanced v1.md Ingestion Design

## Current DB State

**Authors**: 2 records (Alter Rebbe, Mittler Rebbe)
**Sources**: 0 records (empty)
**Topics**: 14 records (from initial ingestion, all `content_status: "partial"`, `documents_count: 0`)

## Problem with Current Approach

Current ingestion only creates **topics** records with 5 fields populated:
- canonical_title
- canonical_title_transliteration
- slug
- description
- overview

**Missing**: 10+ fields that could be populated:
- description_en
- practical_takeaways
- historical_context
- content_status (set to "partial" but should reflect actual content depth)
- status_label
- badge_color
- sources_count
- documents_count

**Missing relationships**:
- No documents created (archival of full entry)
- No paragraphs created (structured sections)
- No statements created (extractable claims)
- No sources created (citations)
- No statement_topics created (linking statements to topics)
- No source_links created (linking sources to statements)

## Enhanced Data Mapping Strategy

### 1. Document Creation (Per Entry)

Each v1.md entry becomes a **Document** record:

```
v1.md Entry: "Avodah – עבודה"
  ↓
Document:
  - title: "Avodah (עבודה) - Dictionary Entry"
  - doc_type: "entry"
  - original_lang: "he"
  - status: "published"
  - source_format: "manual_entry"
  - category: ["chassidus"]
  - metadata: {
      source: "v1.md",
      hebrew_term: "עבודה",
      transliteration: "Avodah",
      entry_category: "General Concepts"
    }
  - topic: 9 (link to Avodah topic)
```

### 2. Paragraph Creation (Per Section)

Each section within an entry becomes a **Paragraph**:

```
Document: Avodah
  ├─ Paragraph 1 (Definition)
  │   - order_key: "1_definition"
  │   - text: "1. Divine service, especially davening..."
  │   - status: "published"
  │
  ├─ Paragraph 2 (Mashal)
  │   - order_key: "2_mashal"
  │   - text: "1. A farmer plowing and sowing a field..."
  │   - status: "published"
  │
  ├─ Paragraph 3 (Personal Nimshal)
  │   - order_key: "3_personal_nimshal"
  │   - text: "Any time we work to improve, this is Avodah..."
  │   - status: "published"
  │
  ├─ Paragraph 4 (Global Nimshal)
  │   - order_key: "4_global_nimshal"
  │   - text: "The goal of creation is to make the world..."
  │   - status: "published"
  │
  └─ Paragraph 5 (Sources)
      - order_key: "5_sources"
      - text: "Kuntres Inyan Hatefilah, Likkutei Diburim..."
      - status: "published"
```

### 3. Statement Creation (Key Claims)

Extract statements from paragraphs with importance scoring:

```
Paragraph: Definition
  ├─ Statement 1
  │   - text: "Avodah means Divine service, especially davening"
  │   - importance_score: 0.95 (core definition)
  │   - status: "published"
  │
  └─ Statement 2
      - text: "Avodah involves working on one's character and self-improvement"
      - importance_score: 0.90
      - status: "published"

Paragraph: Personal Nimshal
  ├─ Statement 3
  │   - text: "Avodah has two stages: cultivation and transformation"
  │   - importance_score: 0.85
  │   - status: "published"
  │
  └─ Statement 4
      - text: "The first stage cultivates hidden potential without changing nature"
      - importance_score: 0.75
      - status: "published"
```

### 4. Source Creation (Citations)

Parse "Sources:" section and create Source records:

```
Sources section: "Kuntres Inyan Hatefilah, Likkutei Diburim (basar, nefesh), Habaim Yashreish"
  ├─ Source 1
  │   - title: "Kuntres Inyan Hatefilah"
  │   - external_system: "sefaria" (if available)
  │   - metadata: { source_type: "kuntres" }
  │
  ├─ Source 2
  │   - title: "Likkutei Diburim"
  │   - external_system: "sefaria"
  │   - metadata: { sections: ["basar", "nefesh"] }
  │
  └─ Source 3
      - title: "Habaim Yashreish"
      - external_system: null (unknown)
```

### 5. Statement-Topic Junction (Relevance Scoring)

Create **statement_topics** records linking statements to topics:

```
Statement: "Avodah means Divine service"
  ↓
statement_topics:
  - statement_id: 1
  - topic_id: 9 (Avodah)
  - relevance_score: 0.95 (core definition)
  - is_primary: true
```

### 6. Source-Statement Links (Citation Tracking)

Create **source_links** records:

```
Statement: "Avodah has two stages..."
  ↓
source_links:
  - statement_id: 3
  - source_id: 1 (Kuntres Inyan Hatefilah)
  - relationship_type: "quotes"
  - confidence_level: "medium"
  - notes: "Referenced in entry sources"
```

### 7. Enhanced Topic Fields

Populate all topic fields:

```
Topic: Avodah (ID: 9)
  - canonical_title: "Avodah"
  - canonical_title_en: "Avodah"
  - canonical_title_transliteration: "Avodah"
  - slug: "avodah"
  - topic_type: "concept"
  - description: "Divine service, especially davening..."
  - description_en: "Divine service, especially davening..."
  - practical_takeaways: "<h3>Personal Application</h3><p>Any time we work to improve...</p>"
  - historical_context: "<h3>Global Meaning</h3><p>The goal of creation is to make...</p>"
  - content_status: "partial" (dictionary-sourced, not team-written)
  - status_label: "Dictionary Entry"
  - badge_color: "blue"
  - sources_count: 3 (auto-calculated from source_links)
  - documents_count: 1 (auto-calculated from documents)
  - metadata: {
      category: "General Concepts",
      hebrew_term: "עבודה",
      cross_references: [],
      entry_source: "v1.md"
    }
```

## New Data Usage Patterns (To Validate)

### Pattern 1: "Learning Path by Importance"
Display statements ordered by importance_score to show core concepts first:
```
Avodah Topic
├─ Core Concepts (importance_score > 0.85)
│  ├─ Statement 1: "Avodah means Divine service"
│  └─ Statement 2: "Avodah involves self-improvement"
├─ Supporting Concepts (0.70-0.85)
│  └─ Statement 3: "Two stages of Avodah"
└─ Details (< 0.70)
```

### Pattern 2: "Source-Backed Learning"
Show statements with their source citations:
```
Statement: "Avodah has two stages..."
  Sources:
  - Kuntres Inyan Hatefilah (confidence: medium)
  - Likkutei Diburim (confidence: high)
```

### Pattern 3: "Topic Depth Indicator"
Use documents_count + sources_count + statement_count to show content richness:
```
Avodah
├─ Content Depth: 4/5 (1 document, 3 sources, 8 statements)
├─ Status: "partial" (dictionary-sourced)
└─ [Upgrade to comprehensive] button
```

### Pattern 4: "Cross-Reference Navigation"
Use statement_topics to build knowledge graph:
```
Avodah
├─ Related Concepts (from statement_topics)
│  ├─ Nefesh (relevance: 0.8)
│  ├─ Mitzvos (relevance: 0.75)
│  └─ Mesiras Nefesh (relevance: 0.7)
└─ [Explore Related] button
```

### Pattern 5: "Structured Entry Browsing"
Navigate entry sections as paragraphs:
```
Avodah Entry
├─ Definition
├─ Mashal (Parable)
├─ Personal Application
├─ Global Meaning
└─ Sources
```

## Implementation Questions for User

**Q1**: Should we auto-extract statements using NLP or manually curate them?
- Option A: Parse definition/nimshal sections and extract sentences as statements
- Option B: Manually identify key claims (more accurate but slower)
- **Recommendation**: Start with Option A, allow manual refinement

**Q2**: How to handle source citations without Sefaria IDs?
- Option A: Create local Source records with `is_external: false`
- Option B: Attempt Sefaria API lookup for known sources
- **Recommendation**: Option A + B (try API, fallback to local)

**Q3**: Should statement_topics relevance_score be:
- Option A: Based on importance_score of statement
- Option B: Based on how central the statement is to the topic
- Option C: Manual curation
- **Recommendation**: Option B (how central to topic definition)

**Q4**: Should we create authors for cited sources?
- Option A: Extract author names from source titles
- Option B: Link to existing authors (Alter Rebbe, Mittler Rebbe)
- Option C: Leave author_id null for now
- **Recommendation**: Option B where possible, Option C otherwise

**Q5**: New usage pattern preferences?
- Which of the 5 patterns above would be most valuable?
- Any other patterns you'd like to explore?

## Implementation Roadmap

1. **Phase 1**: Enhanced parser (documents + paragraphs + statements)
2. **Phase 2**: Source extraction and creation
3. **Phase 3**: Junction table population (statement_topics, source_links)
4. **Phase 4**: Topic field enrichment
5. **Phase 5**: Frontend verification and new usage patterns
