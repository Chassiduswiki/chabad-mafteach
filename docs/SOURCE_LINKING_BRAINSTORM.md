# Source Linking System - Brainstorm Document

**Status**: Active brainstorm
**Started**: February 2026
**Goal**: Create a system to link users to Jewish texts across multiple platforms without hosting content

---

## Problem Statement

We need to link to specific locations in Jewish texts (chapters, pages, sections) across multiple hosting platforms. Each platform has different:
- URL structures
- Reference systems (chapter vs page vs folio)
- Content formats (PDF vs structured text)
- Strengths and weaknesses

**We are NOT scraping or hosting content** - just building a smart linking layer.

---

## Platform Analysis

### HebrewBooks.org ✅ DOCUMENTED
- **Type**: PDF scans
- **Strengths**: Most comprehensive, authoritative scans, reliable
- **Weaknesses**: PDF only, page numbers offset from printed pages, no text search
- **Reference Style**: PDF page number (requires offset calculation)
- **API**: No public API (as of Feb 2026), but official linking docs exist
- **Source**: https://github.com/hebrewbooks/developers.hebrewbooks.org

#### Official URL Patterns (from HebrewBooks developer docs)

**Book IDs**: 1-999,999 (no leading zeros)
**Page Numbers**: 1-9,999 (no leading zeros)

| Purpose | URL Pattern |
|---------|-------------|
| Book info page | `https://hebrewbooks.org/{book_id}` |
| Book thumbnail | `https://hebrewbooks.org/thumbs/{book_id}.png` |
| PDF page viewer | `https://hebrewbooks.org/pdfpager.aspx?req={book_id}&pgnum={page}` |
| Beta PDF viewer | `https://beta.hebrewbooks.org/pdfpager.aspx?req={book_id}&pgnum={page}` |
| Beta image reader | `https://beta.hebrewbooks.org/reader/reader.aspx?sfid={book_id}#p={page}` |

**Talmud special linking:**
```
https://hebrewbooks.org/shas.aspx?mesechta={tractate}&daf={page}&format={pdf|text}
```
- mesechta: 1-37 (no leading zeros)
- daf: page number, append 'b' for side b (e.g., `5b`)
- format: `pdf` for images, `text` for text

**Restrictions:**
- Do NOT add extra parameters
- Do NOT pad with leading zeros
- Do NOT link directly to raw PDFs/images
- Do NOT embed via iframe/webview

#### What's Missing
- No API for book metadata (title, page count, author)
- No way to programmatically determine page offset
- No table of contents data
- Offset must be manually determined per book

### Sefaria.org
- **Type**: Structured text database
- **URL Pattern**: `sefaria.org/{Book_Name}/{Section}?lang=bi`
- **Strengths**: Full API, structured references, bilingual, mobile-friendly
- **Weaknesses**: Own reference system doesn't match traditional Chabad citations, incomplete coverage
- **Reference Style**: Hierarchical sections (Book > Part > Chapter)
- **API**: Yes - https://developers.sefaria.org/

### Chabad.org ✅ FULLY DOCUMENTED
- **Type**: Structured content with internal CMS
- **Strengths**: English translations, accessible, authoritative for Chabad texts, **PUBLIC API**
- **Weaknesses**: Internal ID system, requires knowing root content IDs
- **Reference Style**: Numeric content IDs (article-id)
- **API**: **YES - Public, no auth required!**
- **Source**: https://github.com/awtsmoos/awtsmoos.com/blob/main/geelooy/webScrapers/GemaraSCrapter.js

#### API Endpoints (discovered!)

| Purpose | Endpoint |
|---------|----------|
| Book navigation/structure | `GET https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/{root_id}` |
| Content retrieval | `GET https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/{article_id}` |

**Navigation Response Structure:**
```javascript
{
  talmuds: [{
    children: [  // tractates
      {
        chapters: [{
          children: [  // pages
            {
              "article-id": 12345,      // USE THIS for content requests
              "native-title-2": "2a"    // page identifier
            }
          ]
        }]
      }
    ]
  }]
}
```

**Content Response Structure:**
```javascript
{
  verses: [
    { className: "Gemara Hebrew", textContent: "..." },
    { className: "Gemara English", textContent: "..." },
    { className: "Rashi", textContent: "..." },
    { className: "Tosafos", textContent: "..." }
  ]
}
```

#### URL Patterns (web)

| Purpose | URL Pattern |
|---------|-------------|
| Torah texts | `chabad.org/torah-texts/{content_id}` |
| Library articles | `chabad.org/library/article_cdo/aid/{article_id}/jewish/{Title}.htm` |

**Examples:**
- Derech Mitzvosecha main: `/torah-texts/5580713`
- Derech Mitzvosecha Ch.1: `/torah-texts/5878273`

#### Key Insight
The navigation API lets you **programmatically discover all article-ids** for a book!
1. Call navigation endpoint with root book ID
2. Parse response to get all chapter/page article-ids
3. Store mapping for future use

This means we can automate ID discovery if we know the root ID.

### ChabadLibrary.org
- **Type**: Digital library with traditional pagination
- **URL Pattern**: `chabadlibrary.org/books/{book_id}` (maintains folio numbers like 1a, 1b)
- **Strengths**: Preserves traditional page references, good for verification
- **Weaknesses**: Less well-known, unclear API access
- **Reference Style**: Traditional folio (1a, 1b, 2a, etc.)
- **API**: Unknown
- **Status**: Needs investigation

### Lahak.org ✅ PARTIALLY DOCUMENTED
- **Type**: Official Rebbe's Torah repository (Vaad Hanachos B'Lahak)
- **Strengths**: Authoritative source for Rebbe's sichos/maamarim, searchable, printable
- **Weaknesses**: Numeric IDs only, no public API documentation
- **Reference Style**: Numeric content IDs
- **API**: Unknown, but has internal search engine
- **Source**: Developed with Chabad.org assistance

#### URL Patterns (observed)

| Purpose | URL Pattern |
|---------|-------------|
| Content page | `lahak.org/{content_id}` |
| PDF download | `lahak.org/media/pdf/{folder}/{filename}.pdf` |
| Shop | `lahak.org/shop` |

**Examples:**
- Content: `lahak.org/4208606`, `lahak.org/4393176`
- PDF: `lahak.org/media/pdf/1127/jwco11278441.pdf`

#### Available Content
- 73+ volumes of Toras Menachem (5710-5733+)
- Sefer Ma'amarim Melukat (4 volumes)
- ~1000 archived kuntresim (from 5771)
- 1500+ Igros Kodesh
- 189 Reshimos booklets
- Rebbetzin Chana's memoirs (5 languages)

#### What's Missing
- No documented API
- Content ID discovery unclear
- No mapping between volume/page and content IDs

### Mafteiach.app 🔍 NEEDS INVESTIGATION
- **Type**: Index/navigation app for Rebbe's teachings
- **Strengths**: Comprehensive date-based index of sichos/maamarim, multiple formats
- **Weaknesses**: App-focused, unclear web linking capability
- **Reference Style**: Date-based organization
- **API**: None documented
- **Developer**: Mafteiach App LLC (partnership with RebbeDrive)

#### Features (from app description)
- Complete index of Rebbe's Sichos, Farbrengens, Ma'amorim by date
- Multiple formats: Hanacha Bilti Mugah, Mugah, Likkutei Sichos, Hagahos, Audio, Video
- Searchable table of contents for each Sicha in Likkutei Sichos

#### What's Missing
- Web URL patterns unknown
- No public API documentation
- Need to investigate mafteiach.app/maamorim structure

---

## Use Cases

### 1. Idea Chain Node Citations
When a scholar creates an idea chain node citing "Derech Mitzvosecha, Mitzvas Pru U'rvu":
- System should offer links to view on multiple platforms
- Let user/scholar choose preferred platform
- Store the canonical reference, generate platform links on-demand

### 2. Inline Document Citations
When citing a source in topic content:
- Quick preview might use Sefaria (structured text)
- "View original" might prefer HebrewBooks (authoritative scan)

### 3. Search/Discovery
When user searches for a text:
- Show availability across platforms
- Let user choose based on their needs (study vs verification vs mobile)

---

## Architectural Options

### Option A: Book Catalog with Platform Mappings

Create a registry mapping books to their identifiers on each platform:

```typescript
interface BookMapping {
  canonical_name: string;           // "Derech Mitzvosecha"
  alternate_names: string[];        // ["דרך מצוותיך", "Derech Mitzvotecha"]

  platforms: {
    hebrewbooks?: {
      book_id: number;              // 16082
      page_offset: number;          // 10 (PDF page 11 = printed page 1)
    };
    sefaria?: {
      slug: string;                 // "Derekh_Mitzvotekha"
      structure: 'chapter' | 'page' | 'section';
    };
    chabad_org?: {
      root_id: number;              // 5580713
      chapter_map?: Record<string, number>;  // { "chapter_1": 5878273 }
    };
    chabadlibrary?: {
      book_id: string;              // "2900000000"
      uses_folio: boolean;          // true for 1a/1b style
    };
  };
}
```

**Pros**: Clean, predictable, cacheable
**Cons**: Requires upfront cataloging work, maintenance burden

### Option B: Citation Resolver Service

Parse traditional citations and resolve to platform-specific URLs:

```typescript
// Input: "Derech Mitzvosecha, page 12a"
// Output: {
//   hebrewbooks: "https://hebrewbooks.org/pdfpager.aspx?req=16082&pgnum=33",
//   chabadlibrary: "https://chabadlibrary.org/books/2900000000/12a",
//   sefaria: null  // doesn't use page numbers
// }
```

**Pros**: Flexible, handles various citation formats
**Cons**: Complex parsing, error-prone

### Option C: Hybrid - Book Catalog + Link Templates + Scholar Contributions

1. **Core catalog**: Map major books to platforms (admin-maintained)
2. **Link templates**: Define URL patterns per platform
3. **Scholar contributions**: Let users add/verify links as they work
4. **Fallback**: HebrewBooks search URL if specific link unknown

**Pros**: Scales with community, starts simple
**Cons**: Inconsistent coverage initially

---

## Reference System Challenges

### The Page Number Problem

Traditional Chabad citations use printed page numbers, but:
- HebrewBooks PDFs include title pages, so page 1 might be PDF page 11
- Different printings have different pagination
- Some books use folio (1a, 1b) vs simple page numbers

### The Chapter Problem

- Sefaria uses hierarchical sections: `Book > Part > Chapter > Paragraph`
- Traditional citations might say "Chapter 3" but Sefaria calls it something else
- Some books have named sections, others are numbered

### The Edition Problem

- Multiple editions of same book
- Revised editions with different content
- Which edition does each platform host?

---

## Proposed Data Model (Revised)

Based on our research findings, here's the refined data model.

### Design Principles

1. **HebrewBooks is the foundation** - always has predictable URL math
2. **Chabad.org chapter IDs can be auto-fetched** via their API
3. **Chapter boundaries enable page↔chapter resolution**
4. **Minimal scholar input** - just root IDs and offsets, system does the rest

### Directus Collections

```
source_books
├── Basic Info
│   - id (uuid, PK)
│   - status (string: draft, published)
│   - canonical_name (string) ────────── "Derech Mitzvosecha"
│   - hebrew_name (string) ───────────── "דרך מצוותיך"
│   - alternate_names (json) ─────────── ["Derech Mitzvotecha", ...]
│   - author (string)
│   - year_written (int, nullable)
│   - category (string) ──────────────── chassidus, halacha, kabbalah, mussar
│   - reference_style (string) ───────── page, folio, chapter
│   - total_pages (int, nullable)
│   - notes (text)
│
├── HebrewBooks (PRIMARY - always populate this)
│   - hebrewbooks_id (int) ───────────── 16082
│   - hebrewbooks_offset (int) ───────── 10 (PDF page 11 = printed page 1)
│
├── Chabad.org
│   - chabad_org_root_id (int) ───────── 5580713
│   - chabad_org_synced_at (datetime) ── when chapters were last fetched
│
├── Lahak.org
│   - lahak_root_id (string, nullable)
│
├── ChabadLibrary
│   - chabadlibrary_id (string, nullable)
│
└── Sefaria
    - sefaria_slug (string, nullable) ── "Derekh_Mitzvotekha"


source_book_chapters
├── Identity
│   - id (uuid, PK)
│   - book_id (m2o -> source_books)
│   - sort (int) ─────────────────────── for ordering
│
├── Chapter Info
│   - chapter_number (int, nullable) ─── 1, 2, 3... (for numbered chapters)
│   - chapter_name (string) ──────────── "מצות פריה ורביה"
│   - chapter_name_english (string) ──── "The Mitzvah of Procreation"
│
├── Page Boundaries (enables page↔chapter resolution)
│   - start_page (int) ───────────────── 1 (printed page number)
│   - end_page (int) ─────────────────── 15
│
└── Platform-Specific IDs
    - chabad_org_article_id (int) ────── 5878273 (fetched via API)
    - lahak_content_id (string)
    - sefaria_ref (string) ───────────── "Derekh_Mitzvotekha,_Mitzvas_Peru_Urvu"
```

### URL Generation Logic

```typescript
// HebrewBooks - ALWAYS calculable if we have book ID + offset
function hebrewBooksUrl(book: SourceBook, page: number): string {
  const pdfPage = page + book.hebrewbooks_offset;
  return `https://hebrewbooks.org/pdfpager.aspx?req=${book.hebrewbooks_id}&pgnum=${pdfPage}`;
}

// Chabad.org - needs chapter article ID
function chabadOrgUrl(chapter: SourceBookChapter): string | null {
  if (!chapter.chabad_org_article_id) return null;
  return `https://www.chabad.org/torah-texts/${chapter.chabad_org_article_id}`;
}

// Lahak - needs content ID
function lahakUrl(chapter: SourceBookChapter): string | null {
  if (!chapter.lahak_content_id) return null;
  return `https://lahak.org/${chapter.lahak_content_id}`;
}

// Sefaria - needs ref
function sefariaUrl(chapter: SourceBookChapter): string | null {
  if (!chapter.sefaria_ref) return null;
  return `https://www.sefaria.org/${chapter.sefaria_ref}?lang=bi`;
}
```

### Page ↔ Chapter Resolution

```typescript
// "What chapter is page 45 in?"
function getChapterForPage(book: SourceBook, page: number): SourceBookChapter | null {
  return book.chapters.find(ch =>
    page >= ch.start_page && page <= ch.end_page
  );
}

// "What pages are in Chapter 3?"
function getPagesForChapter(chapter: SourceBookChapter): { start: number, end: number } {
  return { start: chapter.start_page, end: chapter.end_page };
}

// "Link me to page 45 on all platforms"
function getLinksForPage(book: SourceBook, page: number): PlatformLinks {
  const chapter = getChapterForPage(book, page);
  return {
    hebrewbooks: hebrewBooksUrl(book, page),           // exact page
    chabad_org: chapter ? chabadOrgUrl(chapter) : null, // chapter containing page
    lahak: chapter ? lahakUrl(chapter) : null,
    sefaria: chapter ? sefariaUrl(chapter) : null,
  };
}
```

### Workflow: Adding a New Book

**Scholar inputs (minimal):**
1. Book name + Hebrew name
2. HebrewBooks ID (from URL)
3. HebrewBooks offset (count pages to first content page)
4. Chabad.org root ID (from URL, if available)

**System automates:**
1. Fetch Chabad.org chapter structure via API
2. Create chapter records with article IDs
3. Scholar fills in page boundaries as they study

### Example: Derech Mitzvosecha

```json
{
  "source_book": {
    "canonical_name": "Derech Mitzvosecha",
    "hebrew_name": "דרך מצוותיך",
    "hebrewbooks_id": 16082,
    "hebrewbooks_offset": 10,
    "chabad_org_root_id": 5580713,
    "reference_style": "chapter"
  },
  "chapters": [
    {
      "sort": 1,
      "chapter_name": "מצות פריה ורביה",
      "start_page": 1,
      "end_page": 15,
      "chabad_org_article_id": 5878273
    },
    {
      "sort": 2,
      "chapter_name": "מצות מילה",
      "start_page": 16,
      "end_page": 28,
      "chabad_org_article_id": 5878274
    }
    // ... 79 more chapters
  ]
}
```

---

### Chabad.org Auto-Sync Process

When a book has a `chabad_org_root_id`, we can auto-populate chapters:

```typescript
async function syncChabadOrgChapters(book: SourceBook): Promise<void> {
  if (!book.chabad_org_root_id) return;

  // 1. Fetch navigation structure
  const response = await fetch(
    `https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/${book.chabad_org_root_id}`
  );
  const data = await response.json();

  // 2. Extract chapters from response
  // Structure: data.children[] contains article-id and hebrew-title
  for (const [index, child] of data.children.entries()) {
    await upsertChapter({
      book_id: book.id,
      sort: index + 1,
      chapter_name: child['hebrew-title'],
      chabad_org_article_id: child['article-id'],
      // start_page and end_page filled manually by scholar
    });
  }

  // 3. Update sync timestamp
  await updateBook(book.id, { chabad_org_synced_at: new Date() });
}
```

This means: **input the root ID once, get all 81 chapter IDs automatically**.

---

## Implementation Phases (Revised)

### Phase 0: Research ✅ MOSTLY COMPLETE
- [x] HebrewBooks: Official docs found, URL patterns documented
- [x] Chabad.org: **PUBLIC API discovered!** Navigation + Content endpoints, no auth
- [x] Chabad.org API tested with Derech Mitzvosecha - returns all 81 chapters
- [x] Lahak.org: URL patterns observed, numeric content IDs
- [ ] ChabadLibrary: Investigate URL structure
- [ ] Mafteiach.app: Investigate web URL structure (low priority)
- [ ] Sefaria: Investigate API (lowest priority per user)

### Phase 1: Core Data Model ✅ COMPLETE
- [x] Create `source_books` collection in Directus
- [x] Create `source_book_chapters` collection in Directus
- [x] Set up relationships (chapters -> books)
- [x] Build Chabad.org sync function (auto-fetch chapters)
- [x] Add TypeScript types to `lib/types/index.ts`
- [x] Create URL generation library `lib/source-links/index.ts`
- [x] Test with Derech Mitzvosecha (75 chapters auto-synced!)
- [ ] Build admin UI for adding books (can use Directus admin for now)
- [ ] Set up permissions for roles

### Phase 2: Link Generation API
- [ ] Create `/api/source-links/[bookSlug]` endpoint
- [ ] Implement URL generation for each platform
- [ ] Implement page → chapter resolution
- [ ] Implement chapter → pages resolution
- [ ] Add caching layer

### Phase 3: Integration
- [ ] Integrate with Idea Chain nodes
- [ ] Add source link picker UI
- [ ] Scholar workflow for adding page boundaries

### Phase 4: Expansion
- [ ] Add more books to catalog
- [ ] Scholar contribution workflow
- [ ] Coverage reporting dashboard

### Phase 1: Simple Book Catalog
- [ ] Create Directus collections
- [ ] Build admin UI to add book mappings
- [ ] Create link generator service
- [ ] Integrate with Idea Chain nodes

### Phase 2: Citation Resolver
- [ ] Parse common citation formats
- [ ] Handle page/folio/chapter references
- [ ] Generate multi-platform link sets

### Phase 3: Scholar Contributions
- [ ] UI for scholars to add/verify links
- [ ] Verification workflow
- [ ] Coverage reporting

---

## Open Questions

1. **Priority books**: Which books do we catalog first? Start with commonly cited ones?

2. **Edition handling**: How do we handle multiple editions? Tag links with edition?

3. **Broken link detection**: How do we know when platforms change URLs?

4. **Offline fallback**: What if a platform is down? Cache basic info?

5. **Sefaria integration**: Their API could help - worth deeper investigation?

6. **User preference**: Should users set a preferred platform? Per-book or global?

---

## Test Cases

### Derech Mitzvosecha (Example from initial discussion)

| Platform | Main URL | Chapter 1 URL | Notes |
|----------|----------|---------------|-------|
| Chabad.org | `/torah-texts/5580713` | `/torah-texts/5878273` | Internal IDs |
| Sefaria | `/Derekh_Mitzvotekha?tab=contents` | `/Derekh_Mitzvotekha%2C_The_commandment_of_procreation?lang=bi` | URL-encoded section names |
| HebrewBooks | `/16082` | `/pdfpager.aspx?req=16082&pgnum=11` | Page 1 = PDF page 11 |
| ChabadLibrary | `/books/2900000000` | `/books/2900630080` | Different ID per page? |

### Likkutei Sichos (Already working)

We have a working system for this - 39 volumes, chapter-level linking. Document what made it work and see if pattern applies.

### Tanya (Priority - frequently cited)

TODO: Document URLs across platforms

### Torah Ohr / Likkutei Torah (Priority)

TODO: Document URLs across platforms

---

## Related Features

- **Idea Chains**: Nodes need source links (primary use case)
- **Citation System**: Inline citations could use this resolver
- **Topic Sources**: Topic-level source attribution
- **Search**: "Find this source" across platforms

---

## Notes from Sessions

### Session 1 (Feb 2026)
- Initial brainstorm with Derech Mitzvosecha as example
- Identified four main platforms and their characteristics
- User wants linking, not scraping
- This is a multi-session project
- Need to balance upfront cataloging vs organic growth

### Session 1 Continued - HebrewBooks Research
- **Priority order established**: HebrewBooks > ChabadLibrary > Chabad.org > Sefaria
- HebrewBooks blocks automated web fetching (403)
- Found official developer docs: https://github.com/hebrewbooks/developers.hebrewbooks.org
- Official URL patterns documented (see Platform Analysis section)
- No public API for metadata - offset must be manually determined
- Key insight from user: Goal is chapter-level resolution
  - Given "Tanya page 45" → know which chapter
  - Given "Chapter 12" → know page range
  - This requires chapter boundary data per book

### Key Architecture Decision
- **Minimal scholar input**: Just HebrewBooks ID + page offset
- System calculates URLs automatically
- Chapter boundaries enable bidirectional resolution
- Start with HebrewBooks as canonical source, others as supplements

### Session 1 Continued - Chabad.org & Mafteiach Research

**Chabad.org findings:**
- Uses numeric content IDs in URLs (e.g., `/torah-texts/5580713`)
- ~~Has a REST API but requires HMAC-SHA1 authentication~~ **WRONG - see update below**
- Clojure client (github.com/rwillig/clj-chabad-client) may be for older/different API

**Chabad.org API BREAKTHROUGH** (from awtsmoos/GemaraSCrapter.js):
- **Public API exists at `/api/v2/chabadorg/torahtexts/`**
- NO authentication required!
- Navigation endpoint: `book-navigation/{root_id}` - returns full structure with all article-ids
- Content endpoint: `book-content/{article_id}` - returns actual text
- This means we can **programmatically discover all IDs** given just the root book ID!
- Game changer: Only need to find root IDs manually, API reveals the rest

**Lahak.org findings (new platform discovered):**
- Official repository for Rebbe's Torah (Vaad Hanachos B'Lahak)
- Uses numeric content IDs: `lahak.org/{id}`
- Has PDF downloads: `lahak.org/media/pdf/{folder}/{file}.pdf`
- 73+ volumes Toras Menachem, searchable
- Developed with Chabad.org assistance
- ~40,000 monthly visitors

**Mafteiach.app findings:**
- App-focused index of Rebbe's sichos/maamarim
- Organizes by date with multiple format links
- Partnership with RebbeDrive
- Web structure at mafteiach.app/maamorim needs investigation
- No public API documentation found

**Key insight:** Most platforms use numeric content IDs with no public discovery mechanism. This means:
1. We need to manually catalog content IDs for priority books
2. OR find a way to systematically map traditional references to IDs
3. HebrewBooks remains best for automation (documented URL patterns + page math)

### Platforms Summary

| Platform | URL Pattern | ID Discovery | API | Priority |
|----------|-------------|--------------|-----|----------|
| HebrewBooks | Documented, predictable | Book ID only | None (docs exist) | HIGH |
| Chabad.org | Numeric IDs | **Via API!** | **Yes, public!** | HIGH |
| Lahak.org | Numeric IDs | Manual | None known | HIGH (Rebbe's Torah) |
| ChabadLibrary | Unknown | Unknown | Unknown | MEDIUM |
| Mafteiach.app | Unknown | Unknown | None | LOW (app-focused) |
| Sefaria | Documented, hierarchical | Via API | Yes, public | LOW (limited Chabad) |

---

*This is a living document. Update as the project evolves.*
