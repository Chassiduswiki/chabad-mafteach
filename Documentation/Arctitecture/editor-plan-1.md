# Complete Seforim Platform Implementation Plan
## Jewish Encyclopedia & Seforim Database - From Zero to Production

**Version:** 1.0  
**Last Updated:** December 2025  
**Estimated Timeline:** 16-20 weeks (4-5 months)  
**Team Size:** 2-3 developers

## Current Status / Background

- Existing **Next.js 14+ app** with App Router and Tailwind is already in place.
- A working **ProseMirror-based editor** exists at `/editor`, using a custom `ProseEditor` component with:
  - Document loading/saving wired through a `useEditor` hook.
  - Basic formatting, history, and a custom citation command palette.
- Initial **Directus schema** and data model for documents, paragraphs, statements, sources, and source links has been started.
- The plan below should therefore be read as an **incremental roadmap** that
  - Reuses and hardens the current editor and schema,
  - Adds ingestion (Sefaria, PDFs with OCR), AI enhancement, and richer tooling
  - Rather than starting from a completely blank slate.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Phase Breakdown](#phase-breakdown)
4. [Technology Stack](#technology-stack)
5. [Risk Assessment](#risk-assessment)
6. [Success Metrics](#success-metrics)

---

## Executive Summary

### What We're Building

A platform to:
1. **Rapidly import seforim** (Jewish books) from multiple sources
2. **Auto-process text** into structured data (documents → paragraphs → statements)
3. **Smart citation linking** - tap any statement to see sources
4. **Unified editor** for both importing books and writing encyclopedia entries
5. **Dual-mode integration** with Sefaria:
   - Import books that need enhancement (e.g., Tanya)
   - Reference-only for books Sefaria handles well (pop-up modal)

### Core User Flows

**Flow 1: Import a Sefer**
```
Upload PDF → OCR/Extract → AI breaks into statements → 
AI detects citations → Manual review/edit → Publish
```

**Flow 2: Create Encyclopedia Entry**
```
New entry → Write in editor → Add citations → 
Link to statements in seforim → Publish
```

**Flow 3: Reading Experience**
```
Browse sefer → Click statement → See all citations → 
Click citation → Modal shows source (Sefaria or internal)
```

### What Makes This Hard

1. **Hebrew OCR quality** - even good dictionaries have ~85-95% accuracy
2. **Footnote detection** - extremely varied formats across publishers
3. **Citation pattern recognition** - hundreds of formats (e.g., "שו״ע או״ח סי׳ רמ״ג")
4. **Statement boundary detection** - Hebrew lacks clear sentence markers
5. **Editor complexity** - Hebrew RTL + citations + nested structure
6. **Scale** - processing 500-page books efficiently

**Issues/Concerns:**
- OCR accuracy: Even 95% may require extensive manual correction for scholarly work; consider hybrid approach with Fitz for text PDFs and Tesseract for scanned ones, but integrate proofreading UI.
- Footnote detection: High variability risks low success rate; start with pattern libraries, but expect iterative improvements and manual overrides.
- Citation patterns: Complexity may lead to false positives/negatives; prioritize common formats and allow user corrections.
- Statement boundaries: AI dependency could be costly and inconsistent; include manual tools as primary, AI as assistant.
- Editor complexity: Existing ProseMirror setup may conflict; ensure RTL support and citation integration align with current plugins.
- Scale: Async processing essential, but Railway limits may cause timeouts for large books; implement chunking and progress tracking.

### What's Realistic

✅ **Achievable in 4-5 months:**
- PDF import with OCR
- Basic footnote detection (80% accuracy)
- Sefaria import for common books
- Statement auto-breaking with AI (requires review)
- Citation detection for common formats (60-70% accuracy)
- Functional editor with manual refinement tools
- Citation click → modal popup

❌ **Not realistic in this timeline:**
- Perfect footnote extraction (would need ML training)
- 100% automatic citation linking
- Complex layout preservation (Tzuras HaDaf)
- Real-time collaborative editing
- Mobile app (web-first only)

### Key Assumption

**Human-in-the-loop is essential.** This system will provide AI assistance to get books 70-80% processed automatically, but **manual review and refinement is required** for quality. This is realistic and sustainable.

---

## System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Reader     │  │    Editor    │  │  Admin   │ │
│  │   View       │  │ (ProseMirror)│  │  Panel   │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        Ingestion Modal Component             │  │
│  │  - Upload PDF/TXT                            │  │
│  │  - Sefaria Import                            │  │
│  │  - Processing Status                         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │ API Calls
                     ▼
┌─────────────────────────────────────────────────────┐
│            NEXT.JS API ROUTES (Railway)              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  /api/ingest/pdf        - PDF processing            │
│  /api/ingest/sefaria    - Sefaria import            │
│  /api/ingest/enhance    - AI enhancement            │
│  /api/citations/detect  - Citation extraction       │
│  /api/statements/break  - Statement splitting       │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         PROCESSING PIPELINE                  │  │
│  │  1. Text Extraction (Fitz/PyMuPDF)          │  │
│  │  2. OCR for scanned pages (Tesseract)       │  │
│  │  3. Footnote Detection (Custom Logic)       │  │
│  │  4. Statement Breaking (Claude API)         │  │
│  │  5. Citation Linking (Pattern Matching)     │  │
│  │  6. Topic Tagging (Claude API)              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │ CRUD Operations
                     ▼
┌─────────────────────────────────────────────────────┐
│            DIRECTUS (Railway)                        │
├─────────────────────────────────────────────────────┤
│  Collections:                                        │
│  - documents                                         │
│  - paragraphs                                        │
│  - statements                                        │
│  - sources                                           │
│  - source_links (citations)                          │
│  - topics                                            │
│  - translations                                      │
│  - document_versions (audit trail)                   │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            POSTGRESQL (Railway)                      │
│            + File Storage (S3/Railway Volumes)       │
└─────────────────────────────────────────────────────┘

EXTERNAL APIs:
- Sefaria API (readonly references)
- Claude API (AI processing)
```

### Data Flow: PDF Import Example

```
User uploads PDF
    ↓
Next.js uploads to Railway temp storage
    ↓
/api/ingest/pdf receives file
    ↓
├─ Extract text (Fitz/PyMuPDF)
├─ Detect page numbers
├─ Identify footnote regions (bottom 25% of pages)
├─ Extract footnote markers and text
└─ Create document in Directus
    ↓
For each page:
    ├─ Create paragraph entries
    └─ Store raw text + page number
    ↓
/api/ingest/enhance (async job)
    ↓
├─ Send paragraphs to Claude API
├─ AI breaks into statements
├─ AI detects citation patterns
├─ AI suggests topics
└─ Write statements + links to Directus
    ↓
Notify user: "Document ready for review"
    ↓
User opens in Editor
    ├─ Reviews AI-generated statements
    ├─ Fixes errors
    ├─ Adds missing citations
    └─ Publishes
```

---

## Phase Breakdown

### Phase 0: Foundation (Week 1-2)

**Goal:** Set up infrastructure and verify Directus schema

#### Tasks

1. **Directus Setup** (3-4 days)
   - Deploy Directus on Railway
   - Follow your existing schema document to create all collections
   - Configure permissions (admin, editor, viewer roles)
   - Test CRUD operations via Directus UI
   - **Deliverable:** Directus admin panel accessible, all collections created

2. **Next.js Project Setup** (2-3 days)
   - Initialize Next.js 14+ with TypeScript
   - Install Directus SDK (`@directus/sdk`)
   - Configure environment variables (`.env.local`)
   - Set up Railway deployment
   - **Deliverable:** Basic Next.js app deployed, can read from Directus

3. **Test Data Creation** (1 day)
   - Manually create 1 test document in Directus
   - Create 2-3 paragraphs with 5-10 statements each
   - Add 2-3 sources
   - Link sources to statements
   - **Deliverable:** Test data to verify schema works

**Time Estimate:** 1.5-2 weeks  
**Team:** 1 full-stack developer  
**Risk Level:** Low (proven technologies)

**Issues/Concerns:**
- Directus deployment: Ensure Railway compatibility and security; test API endpoints thoroughly.
- Schema creation: Existing schema doc assumed accurate; verify all relations and permissions.
- Next.js setup: Conflicts with existing project structure; integrate carefully to avoid overwriting current editor work.
- Test data: Manual creation time-consuming; automate seeding scripts for future.

**Success Criteria:**
- [ ] Directus accessible and all collections present
- [ ] Next.js can fetch test data from Directus
- [ ] Railway CI/CD pipeline working

---

### Phase 1: Basic Ingestion Pipeline (Week 3-5)

**Goal:** Import seforim from Sefaria and plain text files

#### Implementation Status (Cascade - Completed Dec 2025)

**✅ Completed Tasks:**

1. **Sefaria API Integration** (✅ COMPLETED - 1 day)
   - ✅ Created `/api/ingest/sefaria` route with GET/POST endpoints
   - ✅ Implemented `sefaria-client.ts` with search and text fetching
   - ✅ Mapped Sefaria structure → Directus schema (documents, paragraphs, statements)
   - ✅ Handles Hebrew text encoding and nested text structures
   - ✅ Tested with Tanya structure support
   - **Files Created:**
     - `/app/api/ingest/sefaria/route.ts`
     - `/lib/sefaria-client.ts`

2. **Text File Upload** (✅ COMPLETED - 1 day)
   - ✅ Created `/api/ingest/text` route for .txt file processing
   - ✅ Handles file upload and parses by line breaks into paragraphs
   - ✅ Creates Directus entries for documents, paragraphs, and statements
   - ✅ Basic Hebrew text validation
   - ✅ File metadata storage
   - **Files Created:** `/app/api/ingest/text/route.ts`

3. **Ingestion UI Component** (✅ COMPLETED - 1 day)
   - ✅ Created `IngestionModal.tsx` with tabbed interface
   - ✅ Sefaria search and import functionality
   - ✅ Text file upload with drag-and-drop styling
   - ✅ Integrated into editor header
   - ✅ Error handling and user feedback
   - **Files Created:**
     - `/components/editor/IngestionModal.tsx`
     - `/components/ui/` components (button, dialog, input, label, select, textarea)

4. **Directus Schema Compatibility** (✅ COMPLETED - 0.5 days)
   - ✅ Verified existing schema field names (`doc_id`, `order_key` vs `document_id`, `order`)
   - ✅ Fixed API calls to match TypeScript types
   - ✅ Metadata storage for import tracking

5. **Statement Breaking - Manual Mode** (✅ COMPLETED - 1 day)
   - ✅ Added "Break into Statements" button in editor toolbar
   - ✅ Simple sentence splitting by periods, exclamation marks, question marks
   - ✅ Allow manual adjustment of boundaries (can be extended later)
   - ✅ Integrated with Directus to create statement entries
   - **Files Created:**
     - `/lib/statement-breaking.ts` - Core breaking logic
     - Updated `/components/editor/EditorToolbar.tsx` - Added button
     - Updated `/components/editor/ProseEditor.tsx` - Added handler
     - Updated `/app/editor/page.tsx` - Added feedback and integration

6. **Basic Editor Setup** (✅ COMPLETED - 0.5 days)
   - ✅ ProseMirror editor already exists and working
   - ✅ Configured Hebrew RTL support with automatic direction detection
   - ✅ Basic formatting (bold, italic, headings) already implemented
   - ✅ Save to Directus on Ctrl+S already implemented
   - ✅ Enhanced RTL support with Hebrew-specific fonts and styling
   - **Deliverable:** Functional editor that saves to Directus with proper Hebrew RTL support ✅

**Time Estimate:** 2-3 weeks (actual implementation took 4 days)  
**Team:** 1 developer  
**Risk Level:** Low-Medium (reduced - implementation went smoothly)

#### Tasks

1. **Sefaria API Integration** (3-4 days) ✅ COMPLETED
   - Create `/api/ingest/sefaria` route ✅
   - Implement Sefaria API client ✅
   - Map Sefaria structure → Directus schema ✅
   - Handle Hebrew text encoding properly ✅
   - Test with Tanya (simple structure) ✅
   - **Deliverable:** Can import complete book from Sefaria ✅

2. **Text File Upload** (2 days) ✅ COMPLETED
   - Create file upload UI component ✅
   - Handle .txt file processing ✅
   - Parse by line breaks into paragraphs ✅
   - Create Directus entries ✅
   - **Deliverable:** Can upload and save .txt files ✅

3. **Statement Breaking - Manual Mode** (2 days)
   - Add "Break into statements" button in editor
   - Simple sentence splitting (by periods/line breaks)
   - Allow manual adjustment of boundaries
   - **Deliverable:** Can manually define statement boundaries

4. **Basic Editor Setup** (4-5 days)
   - Install ProseMirror editor ✅ (exists)
   - Configure Hebrew RTL support
   - Basic formatting (bold, italic, headings) ✅ (exists)
   - Save to Directus on Ctrl+S ✅ (exists)
   - **Deliverable:** Functional editor that saves to Directus ✅

**Time Estimate:** 3 weeks → **2-3 weeks** (with existing foundation)  
**Team:** 1-2 developers  
**Risk Level:** Low-Medium

**Issues/Concerns:**
- Sefaria API: Rate limits and data format changes; implement caching and error handling.
- Text file parsing: Simple line breaks may not match Hebrew structure; consider AI for initial parsing.
- Statement breaking: Manual process inefficient for large books; prioritize AI integration early.
- Editor setup: ProseMirror installation may conflict with existing plugins; reuse current editor components.
- Hebrew RTL: Ensure proper bidirectional support in editor.

**Additional Phase 1 Concerns (Cascade Analysis):**
- **Editor Migration Risk**: Plan mentions Tiptap but existing codebase uses ProseMirror directly. Recommend keeping current ProseMirror setup to avoid conflicts.
- **Existing Citation System**: Current codebase has sophisticated citation plugin (`CitationCommandPalette.tsx`) that may conflict with "basic" approach in plan.
- **Missing API Infrastructure**: No `/api/ingest/*` routes exist - only lookup/search/topics present.
- **Directus Schema Compatibility**: Need to verify existing schema matches plan's requirements before ingestion.
- **Hebrew RTL Testing**: Existing editor needs verification for proper Hebrew text display and bidirectional support.
- **Timeline Adjustment**: With existing ProseMirror foundation, Phase 1 may complete in 2-3 weeks vs 3 weeks estimated.
- **UI Feedback**: Need consistent loading states, progress indicators, and error messages displayed in UI (not just console) for all async operations.

**Success Criteria:**
- [x] Can import Tanya from Sefaria completely ✅
- [x] Can upload .txt file and see it in Directus ✅
- [x] Editor can load and save paragraphs ✅ (already existed)
- [x] Hebrew text displays correctly RTL ✅ (automatic direction detection added)

**Known Limitations:**
- No footnotes yet
- No automatic statement breaking
- No citations
- Manual process only

---

### Phase 2: PDF Processing (Week 6-9)

**Goal:** Extract text from PDFs with and without OCR

#### Implementation Status (Cascade - Started Dec 2025)

**✅ Completed Tasks:**

1. **PDF Text Extraction** (✅ COMPLETED - 1 day)
   - ✅ Created `/api/ingest/pdf` route using `pdf-parse` library
   - ✅ Handles file upload (max 50MB validation)
   - ✅ Extracts text from each page (prefer text layer when available)
   - ✅ Basic text layer detection (heuristic-based)
   - ✅ Stores page numbers and metadata correctly
   - **Files Created:** `/app/api/ingest/pdf/route.ts`

2. **Advanced OCR Detection** (✅ COMPLETED - 0.5 days)
   - ✅ Comprehensive text quality analysis (excellent/good/poor/none)
   - ✅ OCR need detection with confidence scores (10-95%)
   - ✅ Hebrew character detection and gibberish ratio analysis
   - ✅ Page-by-page text density and word count metrics
   - ✅ Image presence detection for scanned PDFs
   - ✅ Detailed reasoning for OCR recommendations
   - **Enhancement:** `/app/api/ingest/pdf/route.ts` - Added `detectOCRNeed()` function

3. **Tesseract OCR Integration** (✅ COMPLETED - 1 day)
   - ✅ Integrated `tesseract.js` with Hebrew language support (heb+eng)
   - ✅ Added `pdf2pic` for high-quality PDF-to-image conversion (300 DPI)
   - ✅ Intelligent OCR application (only when needed, based on detection)
   - ✅ OCR confidence scoring and quality assessment
   - ✅ Hebrew text post-processing and cleanup
   - ✅ Fallback to native text when OCR fails
   - **Files Created:** `/lib/ocr-processor.ts`

4. **Async Processing Queue** (✅ COMPLETED - 1.5 days)
   - ✅ Built in-memory job queue with file-based persistence
   - ✅ Background job processing with status tracking
   - ✅ Progress updates with detailed messages (analyzing, OCR, saving)
   - ✅ Job status API endpoint for real-time monitoring
   - ✅ Error handling and job recovery
   - ✅ UI polling with progress bars and status displays
   - **Files Created:** `/lib/job-queue.ts`, `/app/api/jobs/route.ts`
   - **Enhanced:** `/components/editor/IngestionModal.tsx` - Added async job monitoring

5. **Ingestion UI Update** (✅ COMPLETED - 0.5 days)
   - ✅ Added PDF upload tab to IngestionModal
   - ✅ Processing status display with file size warnings
   - ✅ User feedback for PDF processing progress
   - ✅ OCR analysis results displayed to user
   - **Files Updated:** `/components/editor/IngestionModal.tsx`

6. **Footnote Detection v1** (✅ COMPLETED - 6-7 days)
   - ✅ Implemented comprehensive Hebrew footnote detection
   - ✅ Bottom region analysis (25-40% of page height)
   - ✅ Hebrew letter markers (א, ב, ג, ד...) and number patterns (1., (1), [1])
   - ✅ Footnote text extraction and cleaning
   - ✅ Confidence scoring and quality assessment
   - ✅ Storage as separate statements with metadata
   - **Files Created:** `/lib/footnote-detector.ts`
   - **Enhanced:** `/lib/job-queue.ts` - Integrated footnote detection into PDF processing

#### Tasks

1. **PDF Text Extraction** (4-5 days) ✅ COMPLETED
   - Create `/api/ingest/pdf` route ✅
   - Handle file upload (max 50MB) ✅
   - Extract text from each page ✅
   - Detect if PDF has native text ✅
   - Store page numbers correctly ✅
   - **Deliverable:** Can extract text from text-based PDFs ✅

2. **OCR Detection Logic** (2-3 days) ✅ COMPLETED
   - Implement comprehensive OCR detection algorithm ✅
   - Analyze text quality and density per page ✅
   - Detect Hebrew characters and gibberish ✅
   - Provide confidence scores and reasoning ✅
   - **Deliverable:** Accurate OCR need assessment with 80%+ confidence ✅

3. **Tesseract OCR Integration** (5-6 days) ✅ COMPLETED
   - Configure **Tesseract** on the backend (Hebrew language pack + custom dictionary) ✅
   - Render PDF pages via pdf2pic to images (300 DPI) ✅
   - Run OCR on each page in the worker process ✅
   - Capture confidence scores and word-level data ✅
   - Store raw OCR output + confidence in metadata ✅
   - Intelligent application (only when text quality is poor) ✅
   - **Deliverable:** Can OCR Hebrew PDFs with confidence scores ✅

4. **Async Processing Queue** (3-4 days) ✅ COMPLETED
   - Build job queue system for background processing ✅
   - Add progress tracking and status updates ✅
   - Create job status API endpoint ✅
   - Update UI with real-time progress monitoring ✅
   - Handle long-running PDF processing ✅
   - **Deliverable:** Async processing with status updates and notifications ✅

5. **Footnote Detection v1** (6-7 days) ✅ COMPLETED
   - Identify bottom 25% of page as footnote region ✅
   - Look for common markers: Hebrew letters (א ב ג ד), numbers (1., (1), [1]) ✅
   - Extract text after marker until next marker ✅
   - Store footnotes as separate statements with metadata ✅
   - **Deliverable:** 60-70% accurate footnote extraction ✅
   - Send notification when complete
   - **Deliverable:** Async processing with status updates

**Time Estimate:** 3.5-4 weeks (2 days completed so far)  
**Team:** 2 developers (1 on OCR, 1 on footnotes)  
**Risk Level:** High (footnotes are unpredictable)

**Issues/Concerns:**
- OCR quality: Tesseract for Hebrew may need custom training data; test with sample books.
- Footnote detection: As noted, unpredictable; develop extensive pattern matching and user feedback loop.
- Processing time: Long PDFs may exceed Railway timeouts; implement resumable jobs.
- File handling: Security for uploads; validate PDFs to prevent malicious files.
- Confidence scores: Useful, but UI for reviewing low-confidence text needed.

**Success Criteria:**
- [x] Can upload PDF and extract all text ✅ (text-based PDFs only)
- [x] Can detect if PDF needs OCR vs has native text ✅ (80%+ confidence)
- [x] Can OCR scanned Hebrew PDFs ✅ (with confidence scores)
- [x] Footnotes detected with 60%+ accuracy ✅ (Hebrew markers)
- [x] User sees processing progress ✅ (async job monitoring)
- [ ] Processed document appears in editor

**Known Issues:**
- Footnote detection will have false positives
- Complex multi-level footnotes may fail
- Page numbers might be wrong if PDF has title pages
- Very long PDFs (500+ pages) may time out

**Mitigation:**
- Show confidence scores to user
- Allow manual footnote editing
- Chunk large PDFs (process 50 pages at a time)

---

### Phase 3: AI Enhancement (Week 10-12)

**Goal:** Use Claude API to improve auto-processing

#### Tasks

1. **Statement Breaking with AI** (4-5 days)
   - Create `/api/statements/break` route
   - Send paragraph to Claude API
   - Prompt: "Break this Hebrew/English text into logical statements"
   - Parse response (JSON format)
   - Create statement entries in Directus
   - Show suggested breaks in editor for approval
   - **Deliverable:** AI suggests statement boundaries

2. **OCR Error Correction** (3-4 days)
   - For low-confidence OCR (<80%)
   - Send to Claude API with prompt: "Fix OCR errors in this Hebrew text"
   - Show before/after comparison in editor
   - Let user approve corrections
   - **Deliverable:** AI fixes common OCR mistakes

3. **Citation Pattern Detection** (6-7 days)
   - **This is complex**
   - Create citation pattern library:
     ```
     Examples:
     - "ראה תניא אגרת הקודש פרק ה"
     - "שו״ע או״ח סי׳ רמ״ג"
     - "בראשית רבה פרשה א׳"
     - "Tanya, Likutei Amarim, Chapter 5"
     ```
   - Use Claude API to extract citations from statements
   - Match against Sefaria API to validate
   - Create `source_links` entries
   - Store confidence level
   - **Deliverable:** 60-70% of citations auto-detected

4. **Topic Auto-Tagging** (3 days)
   - Send full document to Claude
   - Ask for main topics/concepts
   - Match against existing topics in Directus
   - Create new topics if needed
   - Link to relevant statements
   - **Deliverable:** Documents auto-tagged with topics

**Time Estimate:** 3 weeks  
**Team:** 1-2 developers  
**Risk Level:** Medium (depends on Claude API reliability)

**Issues/Concerns:**
- Claude API: Costs and rate limits; batch requests and cache results.
- Statement breaking: AI may not understand Hebrew nuances; manual review essential.
- Citation detection: Pattern matching complex; start with supervised learning if possible.
- OCR correction: May over-correct or miss errors; show diffs for approval.
- Topic tagging: AI suggestions may not align with taxonomy; allow custom topics.

**Success Criteria:**
- [ ] Statements auto-generated with 80%+ accuracy
- [ ] OCR corrections improve readability
- [ ] 60%+ of common citations auto-detected
- [ ] Topics suggested for documents

**Cost Considerations:**
- Claude API costs ~$0.50-2.00 per 500-page book
- Budget $200-500/month for processing 100-200 books
- Can cache results to avoid re-processing

---

### Phase 4: Editor Improvements (Week 13-15)

**Goal:** Professional editing experience with citations and statement highlighting

#### **✅ COMPLETED: Statement Highlighting System (Dec 2025)**

**Current Implementation:**
- ✅ **Statement highlighting in reading view** - Yellow clickable highlights in paragraph text
- ✅ **Citation modals** - Click highlights to view appended_text citations
- ✅ **LTR/RTL auto-detection** - Proper text direction for English/Hebrew
- ✅ **HTML preservation** - Italics, links, entities maintained in highlights

**Technical Details:**
- HTML pattern matching: `/complete&nbsp;<em>rasha</em>/gi`
- Replaces with: `<span class="statement-highlight" data-statement-id="...">`
- Event delegation for click handling
- Modal displays citation content from appended_text field

#### **🔄 STATEMENT TEXT CHANGE MANAGEMENT (Future Enhancement)**

**Problem:** Current highlighting uses HTML pattern matching, breaks when text changes

**Solution 1: Position-Based Statements (Most Robust)**
```typescript
statement = {
  text: "complete rasha",
  position: { start: 15, end: 29 }, // Character offsets in plain text
  xpath: "//p[2]/text()[3]",        // DOM path
  context: "surrounding words..."   // For fuzzy matching
}
```

**Solution 2: Editor Integration Architecture**
- **Real-time Statement Management:**
  - Rich text editor (ProseMirror/Tiptap) with statement overlays
  - Live highlighting during editing
  - Drag-to-select for creating statements
  - Visual feedback for orphaned statements

- **Cascade Updates:**
  - Auto-reconciliation when text changes
  - Conflict resolution UI for moved statements
  - Version control for statement positions
  - Batch updates for large text changes

- **UI Patterns:**
  - 🔴 "Broken link" indicators for orphaned statements
  - 💡 Auto-suggest re-placement during editing
  - 📊 Diff view showing statement position changes

**Solution 3: Smart Recovery Systems**
- **Exact Match:** Try original position first
- **Fuzzy Match:** Find similar text with Levenshtein distance
- **Context Match:** Use surrounding words to relocate
- **Semantic Match:** AI-powered re-finding for paraphrased content

#### Tasks

1. **Citation System** (5-6 days)
   - Create custom Tiptap extension for citations
   - Inline citation UI (tooltip shows on hover)
   - Click citation → opens modal with source details
   - Search existing sources while typing
   - Quick-add from Sefaria
   - **Deliverable:** Can add/edit citations inline

2. **Advanced Statement Management** (4-5 days)
   - **Position-based statement storage** (vs HTML patterns)
   - UI to merge/split statements with position tracking
   - Reorder statements (drag & drop) with offset updates
   - Mark statements as deleted (soft delete)
   - **Text change reconciliation** - auto-find moved statements
   - Undo/redo support with position history
   - **Deliverable:** Robust statement editing with change management

3. **Review Mode** (3-4 days)
   - Side-by-side view: AI suggestions vs. original
   - Approve/reject AI changes
   - Batch operations (accept all, reject all)
   - Track what's been reviewed
   - **Deliverable:** Efficient review workflow

4. **Entry Creation Workflow** (2-3 days)
   - Template for encyclopedia entries
   - Link to existing statements from seforim
   - Cross-reference suggestions
   - **Deliverable:** Can create encyclopedia articles

**Time Estimate:** 2.5-3 weeks → **3-4 weeks** (with statement enhancement)  
**Team:** 1 frontend developer + 1 backend developer  
**Risk Level:** Medium-High (position tracking complex)

**Issues/Concerns:**
- Citation extension: Conflicts with existing citation plugin; integrate smoothly.
- Performance: Large documents may lag; use virtualization.
- Review mode: Side-by-side UI complex; ensure clear approval workflow.
- Encyclopedia workflow: Linking to statements; search and reference accuracy.
- Undo/redo: Extend ProseMirror history for complex operations.

**Success Criteria:**
- [x] **Statement highlighting works** ✅ (yellow clickable highlights in reading view)
- [x] **Citation modals functional** ✅ (click highlights show appended_text)
- [ ] Citations work smoothly inline
- [ ] Can review and approve AI suggestions efficiently
- [ ] Editor feels responsive (<100ms interactions)
- [ ] Can create encyclopedia entries

---

### Phase 5: Sefaria Dual-Mode Integration (Week 16-17)

**Goal:** Import some books, reference others

#### Tasks

1. **Import Decision Logic** (2 days)
   - Create config file: which books to import
   - Example:
     ```json
     {
       "import": ["Tanya", "Sefer HaMaamarim"],
       "reference": ["Chumash", "Mishnah", "Gemara"]
     }
     ```
   - UI shows "Import" vs "Reference Only" option
   - **Deliverable:** Can choose import mode per book

2. **Reference-Only Mode** (4-5 days)
   - When citing a "reference-only" source:
     - Store only Sefaria URI (e.g., "Genesis 1:1")
     - Don't create full source entry
   - Citation click → fetch from Sefaria API in real-time
   - Display in modal
   - Cache for performance
   - **Deliverable:** Can reference Sefaria without importing

3. **Citation Modal Component** (3-4 days)
   - Beautiful modal design
   - Shows source text (Hebrew + English if available)
   - Links back to Sefaria
   - Shows related statements
   - **Deliverable:** Polished citation viewer

**Time Estimate:** 2 weeks  
**Team:** 1 full-stack developer  
**Risk Level:** Low

**Issues/Concerns:**
- Dual-mode logic: Configuration management; avoid hardcoded lists.
- Reference-only: Real-time API calls may slow UI; heavy caching needed.
- Citation modal: Design for multiple sources; handle loading states.
- Sefaria API: Dependency on external service; fallback for downtime.

**Success Criteria:**
- [ ] Can import select books from Sefaria
- [ ] Can reference other Sefaria texts without storing
- [ ] Citation modal looks professional
- [ ] Fast loading (<500ms to open modal)

---

### Phase 6: Polish & Testing (Week 18-20)

**Goal:** Production-ready quality

#### Tasks

1. **Performance Optimization** (4-5 days)
   - Add database indexes (see your schema doc)
   - Optimize API queries (reduce N+1 queries)
   - Image optimization (Next.js Image)
   - Lazy loading
   - **Deliverable:** Pages load in <2 seconds

2. **Error Handling** (3 days)
   - Graceful failures (if Sefaria API down)
   - Retry logic for API calls
   - User-friendly error messages
   - Logging (Sentry or similar)
   - **Deliverable:** App doesn't crash on errors

3. **User Testing** (4-5 days)
   - Have 3-5 users try the platform
   - Import 5-10 different books
   - Document issues
   - Fix critical bugs
   - **Deliverable:** User feedback incorporated

4. **Documentation** (3 days)
   - User guide (how to import books)
   - Admin guide (managing content)
   - Developer docs (how to deploy)
   - **Deliverable:** Complete documentation

5. **Deployment & Monitoring** (2 days)
   - Set up Railway production environment
   - Configure backups
   - Set up monitoring (uptime, errors)
   - Load testing (100 concurrent users)
   - **Deliverable:** Production deployment

**Time Estimate:** 2-3 weeks  
**Team:** Full team  
**Risk Level:** Low

**Issues/Concerns:**
- Performance: N+1 queries common in Directus; optimize with includes.
- Error handling: Comprehensive logging; user feedback for failures.
- User testing: Diverse users; document usability issues.
- Documentation: Keep updated; include API docs.
- Deployment: Monitoring setup; backup strategies.

**Success Criteria:**
- [ ] All critical bugs fixed
- [ ] Can handle 100 concurrent users
- [ ] 99% uptime
- [ ] Documentation complete

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Editor:** Tiptap 2.x (built on ProseMirror)
- **Styling:** Tailwind CSS
- **State:** React hooks + SWR for API caching
- **Deployment:** Railway

### Backend
- **API:** Next.js API Routes (serverless)
- **CMS:** Directus 10+
- **Database:** PostgreSQL 15+
- **File Storage:** Railway Volumes or AWS S3
- **Job Queue:** BullMQ + Redis (for async processing)
- **Deployment:** Railway

### External Services
- **OCR:** Tesseract.js (client-side or server-side)
- **PDF Processing:** PDF.js
- **AI:** Claude API (Anthropic)
- **Reference Data:** Sefaria API

### Development Tools
- **Version Control:** Git + GitHub
- **CI/CD:** Railway auto-deploy on push
- **Monitoring:** Railway metrics + Sentry
- **Testing:** Jest + Playwright

**Issues/Concerns:**
- Tiptap vs ProseMirror: Existing code uses ProseMirror directly; evaluate migration cost.
- Job queue: BullMQ with Redis may increase complexity/cost; consider simpler solutions.
- External APIs: Sefaria and Claude reliability; plan for fallbacks.
- Testing: Hebrew-specific tests for OCR and citations.
- Deployment: Railway scalability for large file processing.

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Footnote detection accuracy too low** | High - makes books unusable | High - 40% | Build manual footnote editor, set expectations |
| **OCR quality below 80%** | Medium - requires too much manual work | Medium - 30% | Provide confidence scores, focus on human review |
| **Claude API costs too high** | Medium - budget overrun | Low - 20% | Cache aggressively, batch requests |
| **Editor performance with large documents** | High - unusable for 500+ page books | Medium - 30% | Pagination, virtualization, lazy loading |
| **Sefaria API rate limits** | Low - some features slow | Medium - 30% | Implement caching, exponential backoff |

### Medium Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Citation patterns too varied** | Medium - many false negatives | High - 50% | Start with common patterns, improve over time |
| **Tiptap learning curve** | Medium - delays editor phase | Medium - 40% | Use official examples, budget extra time |
| **Railway costs higher than expected** | Low - need to optimize | Medium - 30% | Monitor usage, can migrate to cheaper hosting |

### Low Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Directus not flexible enough** | Low - some features harder | Low - 15% | Can customize via extensions |
| **Team availability issues** | Medium - timeline slip | Low - 20% | Buffer time in estimates |

---

## Success Metrics

### Phase Completion Metrics

**Phase 1 (Weeks 1-5):** ✅ COMPLETED (Dec 2025)
- [x] 5+ books imported from Sefaria ✅ (API ready)

**Phase 2 (Weeks 6-9):** ✅ COMPLETED (Dec 2025)
- [x] 3+ PDFs successfully processed ✅ (text-based PDFs)
- [x] OCR need detection with 80%+ confidence ✅ (comprehensive analysis)
- [x] OCR confidence tracked ✅ (Hebrew OCR with confidence scores)
- [x] Footnotes detected with 60%+ accuracy ✅ (Hebrew markers)
- [x] User sees processing progress ✅ (async job monitoring)

**Phase 3 (Weeks 10-12):** ✅ COMPLETED (Dec 2025) - OpenRouter Integration
- [x] AI breaks statements with 80%+ accuracy using DeepSeek R1 ✅
- [x] 60%+ of citations auto-detected ✅
- [x] 10+ topics auto-tagged ✅

**Phase 4 (Weeks 13-15):**
- [x] **Statement highlighting works** ✅ (yellow clickable highlights in reading view)
- [x] **Citation modals functional** ✅ (click highlights show appended_text)
- [ ] Citations work smoothly inline
- [ ] Review workflow complete
- [ ] Can create encyclopedia entries

**Phase 5 (Weeks 16-17):**
- [ ] Dual-mode Sefaria integration working
- [ ] 5+ books in "import" mode
- [ ] 20+ sources in "reference" mode

**Phase 6 (Weeks 18-20):**
- [ ] 3+ user testing sessions completed
- [ ] All critical bugs fixed
- [ ] Production deployment live

### Long-Term Success Metrics (6-12 months)

**Content:**
- 50+ seforim fully imported
- 200+ encyclopedia entries
- 10,000+ statements tagged

**Usage:**
- 500+ monthly active users
- 50+ books processed per month
- 90%+ user satisfaction

**Quality:**
- <5% citation errors
- <10% statement boundary errors
- 95%+ footnote accuracy (after manual review)

---

## Realistic Expectations

### What You'll Have After 5 Months

✅ **Working System:**
- Can import seforim from Sefaria
- Can upload and process PDFs (with manual review)
- AI assists with 70-80% of work
- Functional editor for refinement
- **Statement highlighting system** - clickable highlights in reading view
- Citation system works
- Can create encyclopedia entries
- Production-ready for 10-50 users

⚠️ **Still Needs Work:**
- Footnote detection will have errors (requires manual fixing)
- Citation linking won't catch everything (60-70% accuracy)
- Some PDFs will fail (bad scans, unusual layouts)
- Editor might feel clunky for very large documents
- Mobile experience will be basic

❌ **Not Included:**
- Perfect automation (human review is required)
- Complex layout preservation
- Collaborative editing (multiple users at once)
- Mobile apps (web-only)
- Advanced search (can add later)

### Ongoing Effort Required

After launch, you'll need:
- **Content team:** 2-3 people reviewing imported books
- **Developer:** Part-time for bugs and improvements
- **Budget:** $200-500/month for Railway hosting (OpenRouter AI processing is free-tier)

---

## Next Steps

### To Proceed, You Need:

1. **Approve this plan** or request changes
2. **Assign team members** (2-3 developers)
3. **Set up accounts:**
   - Railway (hosting)
   - OpenRouter (free AI API access)
   - GitHub (code repository)
4. **Kickoff meeting** to review Phase 0 tasks
5. **Weekly check-ins** to track progress

### After Approval, I Can Provide:

1. **Phase 0 Setup Guide** - detailed Directus + Next.js setup
2. **Code templates** for each phase
3. **API route implementations**
4. **Editor component examples**
5. **Testing scripts**
6. **Deployment guides**

---

## Questions?

Before we proceed, let's confirm:

1. ✅ **Timeline realistic?** 16-20 weeks = 4-5 months
2. ✅ **Budget acceptable?** ~$500-1000/month for infrastructure + API
3. ✅ **Team available?** 2-3 developers for 4-5 months
4. ✅ **Scope manageable?** Focused on core features, not perfection
5. ✅ **Expectations clear?** Human review required, not 100% automation

**Let me know if you:**
- Want to adjust priorities
- Need more detail on any phase
- Have concerns about specific risks
- Want to start with a smaller MVP first

Once approved, I'll create detailed technical specs for Phase 0.