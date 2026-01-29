# Enhanced Ingestion - Questions for Validation

## Current Status
- 14 topics created (IDs 9-27)
- All have `content_status: "partial"` and `documents_count: 0`
- No documents, paragraphs, statements, or sources created yet

## Design Questions

### Q1: Statement Extraction Strategy
**Current approach**: Auto-extract statements from definition/nimshal sections

**Options**:
- **A**: Parse sentences automatically (fast, may miss nuance)
- **B**: Manually curate key statements (accurate, slower)
- **C**: Hybrid - auto-extract + allow manual refinement

**Recommendation**: Start with A, iterate based on frontend results

---

### Q2: Source Citation Handling
**Current state**: Sources table is empty

**Options**:
- **A**: Create local Source records for all v1.md citations
- **B**: Attempt Sefaria API lookup for known sources first
- **C**: Only create sources for sources we can verify

**Recommendation**: A + B (try API, fallback to local)

---

### Q3: Statement-Topic Relevance Scoring
**How to calculate `relevance_score` in statement_topics**:

- **A**: Based on statement's `importance_score` (0.95 → 0.95)
- **B**: Based on how central statement is to topic definition (manual)
- **C**: Based on statement position in entry (first = higher)
- **D**: Hybrid approach

**Recommendation**: B (how central to topic definition)

---

### Q4: Author Linking
**Current authors**: Alter Rebbe, Mittler Rebbe

**Options**:
- **A**: Extract author names from source titles and link to existing authors
- **B**: Create new author records for cited authors
- **C**: Leave author_id null for now

**Recommendation**: A where possible (Alter Rebbe, Mittler Rebbe), C otherwise

---

### Q5: New Usage Patterns - Priority Ranking

Which patterns would be most valuable to implement first?

1. **Learning Path by Importance** - Show statements ordered by importance_score
2. **Source-Backed Learning** - Show statements with source citations
3. **Topic Depth Indicator** - Visual indicator of content richness
4. **Cross-Reference Navigation** - Knowledge graph via statement_topics
5. **Structured Entry Browsing** - Navigate entry sections as paragraphs

**Your preference**: Which 2-3 should we prioritize?

---

### Q6: Additional Data Patterns - New Ideas

**Pattern 6: "Comparative Analysis"**
Compare definitions across related concepts:
```
Avodah vs. Haskalah vs. Havanah
├─ Definition comparison table
├─ Shared concepts
└─ Unique aspects
```
**Useful?** Yes / No / Maybe

---

**Pattern 7: "Mashal (Parable) Library"**
Extract all parables and create searchable collection:
```
Avodah
├─ Mashal 1: Farmer plowing field
├─ Mashal 2: Tanning hides
└─ [Browse all Mashals] link
```
**Useful?** Yes / No / Maybe

---

**Pattern 8: "Concept Hierarchy"**
Build visual hierarchy from entry structure:
```
Avodah (General Concept)
├─ Definition (foundational)
├─ Mashal (illustrative)
├─ Personal Nimshal (practical)
└─ Global Nimshal (cosmic)
```
**Useful?** Yes / No / Maybe

---

## Implementation Plan (Pending Your Answers)

1. **Phase 1**: Enhanced parser
   - Create Document per entry
   - Create Paragraphs per section
   - Extract Statements with importance_score
   - Parse Sources from citations

2. **Phase 2**: Relationship population
   - Create statement_topics (with relevance_score)
   - Create source_links
   - Link authors to sources

3. **Phase 3**: Topic enrichment
   - Populate all topic fields
   - Calculate documents_count, sources_count
   - Set content_status based on depth

4. **Phase 4**: Frontend verification
   - Test knowledge graph navigation
   - Verify new usage patterns
   - Check data integrity

## Frontend Verification Checklist

- [ ] Topics display with all fields populated
- [ ] Documents appear in topic detail
- [ ] Paragraphs show entry structure
- [ ] Statements display with importance scores
- [ ] Sources linked to statements
- [ ] Cross-references navigate correctly
- [ ] Content depth indicator shows accurate counts
- [ ] New usage patterns render properly

---

## Please Answer These Questions

1. **Q1**: Which statement extraction strategy? (A/B/C)
2. **Q2**: Which source handling approach? (A/B/C)
3. **Q3**: How to calculate relevance_score? (A/B/C/D)
4. **Q4**: Author linking preference? (A/B/C)
5. **Q5**: Which 2-3 usage patterns to prioritize?
6. **Q6-Q8**: Which new patterns are useful? (Yes/No/Maybe)

Once you answer, I'll build the enhanced ingestion script and verify on the frontend.
