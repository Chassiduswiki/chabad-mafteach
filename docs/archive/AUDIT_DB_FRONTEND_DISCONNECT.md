# Audit: DB ↔ Frontend Disconnect

## Problem Summary

The frontend is displaying the entire article content in one block instead of showing structured sections (overview, sources, etc.). The root cause is a **three-way mismatch**:

1. **Data Model** defines fields that don't match **DB schema**
2. **DB schema** has fields that **frontend doesn't use**
3. **Frontend** expects fields that **don't exist in DB**

---

## 1. Data Model vs DB Schema Mismatch

### Data Model (`Documentation/New-directus-data-model.md`)

Topics collection should have:
- `canonical_title` ✅
- `original_lang` ✅
- `slug` ✅
- `topic_type` ✅
- `description` ✅
- `metadata` ✅

**Missing from data model**: `overview`, `practical_takeaways`, `historical_context`, `content_status`, `badge_color`, etc.

### Actual DB Schema (via MCP)

Topics collection actually has:
- `canonical_title` ✅
- `original_lang` ✅
- `slug` ✅
- `topic_type` ✅
- `description` ✅
- `metadata` ✅
- `canonical_title_en` ✅
- `canonical_title_transliteration` ✅
- `description_en` ✅
- **`practical_takeaways`** ✅ (not in data model)
- **`historical_context`** ✅ (not in data model)
- **`content_status`** ✅ (not in data model)
- **`status_label`** ✅ (not in data model)
- **`badge_color`** ✅ (not in data model)
- **`sources_count`** ✅ (not in data model)
- **`documents_count`** ✅ (not in data model)

**Conclusion**: DB schema is more advanced than the data model document.

---

## 2. DB Data vs Frontend Expectations

### Current DB Data (Topic ID 24: Levushim)

```
description: "1. The three abilities of thought, speech, and action... [ENTIRE ARTICLE CONCATENATED]"
practical_takeaways: "• The soul itself is spiritual and cannot interact directly..."
historical_context: "" (empty)
content_status: "partial"
```

### Frontend Code (TopicArticle.tsx)

```typescript
export function TopicArticle({ topic }: TopicArticleProps) {
    if (!topic.overview) {  // ❌ FIELD DOESN'T EXIST IN DB
        return <div>No article content available</div>;
    }
    return <MarkdownContent content={topic.overview} />;  // ❌ DISPLAYS NOTHING
}
```

**Problem**: Frontend looks for `topic.overview` which doesn't exist in DB.

**Current Result**: The entire `description` field is being displayed as the article (because it contains all concatenated content).

---

## 3. Data Population Issue

### What's Happening in Ingestion

The enhanced ingestion script populates:

```typescript
// From ingest-v1-enhanced.ts
const doc: DirectusDocument = {
    title: `${entry.englishTerm} (${entry.hebrewTerm}) - Dictionary Entry`,
    // ...
};

// Topic gets:
description: entry.definition.join(' ') + entry.mashal.join(' ') + ...  // ❌ CONCATENATED
overview: this.formatOverview(entry)  // ❌ NEVER USED - FIELD DOESN'T EXIST
```

**Result**: 
- `description` = entire article (wrong)
- `overview` = formatted HTML (never saved, field doesn't exist)
- `practical_takeaways` = not populated
- `historical_context` = not populated

---

## 4. What Should Happen

### Correct Data Mapping

```
v1.md Entry: "Avodah"
    ├─ definition[0] → description (first definition only)
    ├─ definition + mashal → practical_takeaways (formatted HTML)
    ├─ globalNimshal → historical_context (formatted HTML)
    └─ Document → documents table (full entry archival)
```

### Correct Frontend Display

```
Topic Detail Page
├─ Header: canonical_title
├─ Overview Section: description (brief definition)
├─ Practical Takeaways: practical_takeaways (formatted)
├─ Historical Context: historical_context (formatted)
├─ Sources Section: source_links (linked to statements)
└─ Related Concepts: statement_topics (knowledge graph)
```

---

## 5. Current Issues

| Issue | Location | Impact |
|-------|----------|--------|
| `description` field contains entire article | DB ingestion | Frontend shows wall of text |
| `overview` field doesn't exist in DB | Data model vs schema | Frontend displays nothing |
| `practical_takeaways` not populated | Ingestion script | Field unused |
| `historical_context` not populated | Ingestion script | Field unused |
| Frontend expects `topic.overview` | Frontend code | Mismatch with DB |
| Sources not visible | Frontend/DB | No source display |
| No structured sections | Frontend | No tabs/sections |

---

## 6. Root Cause Analysis

### Why This Happened

1. **Data model was created first** (theoretical)
2. **DB schema evolved** with additional fields (practical)
3. **Ingestion script** didn't follow either (hybrid approach)
4. **Frontend** was built against data model (outdated)
5. **No sync** between all three

### The Real Problem

The ingestion is putting **all content into `description`** because:
- The enhanced parser creates `overview` (which doesn't exist in DB)
- The old simple ingestion just concatenates everything into `description`
- No one validated that the fields actually match

---

## 7. Solution Required

### Option A: Fix Ingestion to Match DB Schema

Update `ingest-v1-enhanced.ts` to populate:
```typescript
const topic = {
    canonical_title: entry.englishTerm,
    description: entry.definition[0],  // FIRST DEFINITION ONLY
    practical_takeaways: formatPractical(entry.personalNimshal),
    historical_context: formatHistorical(entry.globalNimshal),
    content_status: 'partial',
    metadata: { /* ... */ }
};
```

### Option B: Fix Frontend to Match DB Schema

Update `TopicArticle.tsx`:
```typescript
export function TopicArticle({ topic }: TopicArticleProps) {
    return (
        <section className="space-y-6">
            <div>
                <h3>Overview</h3>
                <MarkdownContent content={topic.description} />
            </div>
            {topic.practical_takeaways && (
                <div>
                    <h3>Practical Application</h3>
                    <MarkdownContent content={topic.practical_takeaways} />
                </div>
            )}
            {topic.historical_context && (
                <div>
                    <h3>Historical Context</h3>
                    <MarkdownContent content={topic.historical_context} />
                </div>
            )}
        </section>
    );
}
```

### Option C: Update Data Model Document

Make `Documentation/New-directus-data-model.md` match actual DB schema:
- Add `practical_takeaways`, `historical_context`, `content_status`, etc.
- Document the actual field structure

---

## 8. Recommendation

**Do all three**:

1. **Fix ingestion** - Populate fields correctly (not concatenated)
2. **Fix frontend** - Use actual DB fields, not non-existent `overview`
3. **Update data model** - Document what actually exists

This ensures:
- ✅ Data flows correctly from v1.md → DB
- ✅ Frontend displays structured sections
- ✅ Sources are visible and linked
- ✅ All documentation is accurate

---

## Files to Update

1. `scripts/ingest-v1-enhanced.ts` - Fix data mapping
2. `components/topics/TopicArticle.tsx` - Fix frontend display
3. `Documentation/New-directus-data-model.md` - Fix documentation
4. Any other frontend components using `topic.overview`

---

## Current Data (Example: Topic 24)

**DB Record**:
```json
{
  "id": 24,
  "canonical_title": "Levushim (shel HaNefesh)",
  "description": "[ENTIRE ARTICLE - 2000+ chars]",
  "practical_takeaways": "[FORMATTED TEXT]",
  "historical_context": "",
  "content_status": "partial"
}
```

**Frontend Displays**: `description` (entire article) because `overview` doesn't exist

**Should Display**: `description` (brief) + `practical_takeaways` (formatted) + `historical_context` (if available)
