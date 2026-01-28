# Chabad Library Scraping & Population System

## Overview

This system provides a powerful, hierarchical approach to scraping and populating Jewish texts from Chabad Library into Directus CMS. The system creates granular, citation-ready data structures that enable precise hover tooltips and semantic text navigation.

## Architecture

### Data Hierarchy

```
Chabad Library API
        ↓
    Scraper
        ↓
   JSON Cache
        ↓
  Population Script
        ↓
   Directus CMS
        ↓
   Frontend App
```

### Directus Schema

#### Documents Collection
- `title`: Book/section title
- `doc_type`: "sefer" (main books) or "entry" (sections)
- `parent_id`: Hierarchical relationships (null for root books)
- `original_lang`: Language code ("he", "en")
- `metadata`: Structured metadata

#### Paragraphs Collection
- `doc_id`: Links to parent document
- `order_key`: Sequential ordering ("001", "002", etc.)
- `text`: Full paragraph text
- `page_number`: Numeric page/folio
- `metadata.folio_notation`: Hebrew folio ("1a", "2b", etc.)

#### Statements Collection
- `paragraph_id`: Links to containing paragraph
- `order_key`: Sequential within paragraph ("001", "002", etc.)
- `text`: Text segment (granular for citations)
- `appended_text`: HTML-formatted footnote/citation
- `importance_score`: Citation priority (1.0 for citations, 0.5 for plain text)

## Scraping System

### Chabad Library API Structure

```javascript
// Raw API Response Structure
{
  "content": {
    "data": [
      {
        "heading": "Book Title",
        "id": 3400000000,
        "children": [...] // Recursive structure
      }
    ]
  }
}

// Leaf Node Structure
{
  "heading": "א, א", // Hebrew folio notation
  "id": 3400000001,
  "text": "Full Hebrew text content...",
  "notes": "[ftn_1_1] [dibur_maschil]Citation content[/dibur_maschil]..."
}
```

### Scraper Implementation

#### Sequential Scraping Strategy

```javascript
async function getEntireChabadLibraryBookSequential(idx) {
  // Process one item at a time to avoid rate limits
  // Depth-first traversal of hierarchical structure
  // Returns structured JSON with all content
}
```

#### Best Practices

1. **Sequential Processing**: Avoid Promise.all to prevent API rate limits
2. **Error Handling**: Continue processing even if individual items fail
3. **Caching**: Save to JSON files for development/testing
4. **Incremental Updates**: Support partial scraping for large books

## Population System

### Granular Statement Creation

#### Problem Statement

Traditional approach: One statement per paragraph with all footnotes appended
```
Paragraph: "Text with [ftnref_1_1] citation [ftnref_2_2] another"
Statement: {
  text: "Full paragraph text",
  appended_text: "<div>1.1 Citation 1</div><div>2.2 Citation 2</div>"
}
```

#### Solution: Granular Statements

```javascript
function parseFootnotesIntoStatements(text, notes) {
  // Split text by footnote references
  // Create individual statements for each text segment
  // Associate each footnote with its specific text segment

  return [
    { text: "Text before first footnote", appended_text: "" },
    { text: "Text segment 1", appended_text: "<div>1.1 Citation 1</div>" },
    { text: "Text segment 2", appended_text: "<div>2.2 Citation 2</div>" },
    { text: "Text after last footnote", appended_text: "" }
  ];
}
```

#### Benefits

- **Precise Citations**: Hover over specific words shows only relevant citation
- **Semantic Granularity**: Each text segment maintains its context
- **Frontend Flexibility**: Citation tooltips can be position-aware
- **Search Precision**: Citations linked to exact text segments

### Hebrew Text Processing

#### Folio Number Conversion

```javascript
function hebrewToNumber(hebrew) {
  // א=1, ב=2, ג=3, ... י=10, כ=20, ל=30, etc.
  // Supports multi-character numerals: קט=109
}

function parseFolioReference(heading) {
  // "א, א" → "1a", "קט, ב" → "109b"
}
```

#### Language Detection

```javascript
function detectLanguage(text) {
  const hebrewChars = text.match(/[\u0590-\u05FF]/g)?.length || 0;
  const totalChars = text.replace(/\s/g, '').length;
  return hebrewChars / totalChars > 0.1 ? 'he' : 'en';
}
```

## Usage Examples

### Full Book Population

```bash
# Scrape and populate complete book
node scripts/populate_chabad_book.js 3400000000 "Tanya - Complete Edition"
```

### Development Workflow

```bash
# 1. Scrape to JSON for testing
node scripts/scrapers/chabadlibraryScraper.js

# 2. Test population with JSON file
node scripts/populate_chabad_book.js 2800000000 "Test Book"

# 3. Verify data in Directus
curl "https://directus-production-20db.up.railway.app/items/documents"
```

### API Integration

```javascript
// Get hierarchical book structure
const books = await getEntireChabadLibraryBookSequential(3400000000);

// Populate to Directus
await populateChabadBook(3400000000, "Tanya");
```

## Performance Considerations

### Large Book Handling

- **Memory Management**: Process sections sequentially, not all at once
- **API Rate Limits**: Built-in delays between requests
- **Progress Tracking**: Detailed logging for long-running operations
- **Error Recovery**: Continue processing even if individual items fail

### Database Optimization

- **Batch Inserts**: Multiple records per API call when possible
- **Indexing**: Ensure proper indexes on foreign keys
- **Transaction Safety**: Atomic operations for data integrity

## Frontend Integration

### Citation Tooltips

```javascript
// Hover over text segment → show specific citation
const statement = await getStatementByPosition(textPosition);
const citation = statement.appended_text; // Only relevant footnote
```

### Hierarchical Navigation

```javascript
// Get book structure
const book = await getDocument(bookId);
const sections = await getChildDocuments(bookId);
const paragraphs = await getParagraphsByDocument(sectionId);
const statements = await getStatementsByParagraph(paragraphId);
```

## Schema Requirements

### Required Directus Fields

#### Documents Collection
```json
{
  "parent_id": {
    "type": "integer",
    "interface": "select-dropdown-m2o",
    "related_collection": "documents"
  }
}
```

#### API Permissions
- Full CRUD access to documents, paragraphs, statements collections
- Token-based authentication
- CORS configuration for frontend access

## Error Handling & Debugging

### Common Issues

1. **API Rate Limits**: Use sequential processing
2. **Memory Issues**: Process large books in sections
3. **Schema Mismatches**: Ensure Directus fields exist
4. **Encoding Issues**: Handle Hebrew text properly

### Debug Mode

```bash
# Enable detailed logging
DEBUG=true node scripts/populate_chabad_book.js 3400000000 "Debug Book"
```

## Future Enhancements

### Advanced Features
- **Incremental Updates**: Detect and update changed content
- **Multi-language Support**: Extended language detection
- **Citation Linking**: Cross-reference between texts
- **Search Optimization**: Full-text search with citations

### Performance Improvements
- **Parallel Processing**: Safe concurrency for API calls
- **Caching Layers**: Redis for frequently accessed content
- **CDN Integration**: Static content delivery

## Citation Cross-Referencing System

### Problem Statement

Traditional Jewish texts contain extensive cross-references between different books. When populating multiple books, citations should become clickable hyperlinks that navigate to the exact referenced location.

### Solution: Deferred Citation Linking

The system stores structured citation metadata alongside footnote content, enabling future resolution of links when target books are available.

#### Citation Reference Structure

```javascript
// Stored in statement metadata.citation_references
{
  type: 'book_reference' | 'folio_reference' | 'section_reference',
  text: 'ליקוטי תורה' | 'ק, א' | 'שער היחוד',
  confidence: 0.8, // 0-1 confidence score
  position: 45, // Character position in footnote
  context: 'ראה ליקוטי תורה על הפסוק...' // Surrounding context
}
```

#### Citation Types

- **book_reference**: Direct book title mentions ("ליקוטי תורה", "תניא")
- **folio_reference**: Hebrew folio citations ("ק, א" → "100a")
- **section_reference**: Chapter/section references ("שער היחוד", "פרק ב")

### Implementation

#### Extraction Logic

```javascript
function extractCitationReferences(footnoteContent) {
  // Pattern matching for common Jewish text citation formats
  const bookPatterns = [
    /(ליקוטי תורה|תורה אור|ספר התניא|תניא|לקוטי אמרים|שער היחוד והאמונה)/g
  ];

  const folioPattern = /([א-ת]+),\s*([א-ת])/g; // "ק, א"
  const sectionPattern = /(שער|פרק|אות)\s*[\dא-ת]+/g; // "שער היחוד"

  // Extract and score references by confidence
}
```

#### Database Schema

```javascript
// Statement metadata includes citation references
{
  metadata: {
    citation_references: [
      {
        type: 'book_reference',
        text: 'ליקוטי תורה',
        confidence: 0.8,
        resolved_link: null // Future: link to target document
      }
    ]
  }
}
```

### Link Resolution Process

#### Phase 1: Citation Extraction (Current)
- Parse footnotes during population
- Store structured citation data
- Maintain confidence scores

#### Phase 2: Link Resolution (Future)
```javascript
async function resolveCitationLinks() {
  // Query all statements with citation_references
  // Match against available documents
  // Update resolved_link fields
  // Generate frontend navigation data
}
```

#### Phase 3: Frontend Integration (Future)
```javascript
// Frontend citation tooltip
const citation = statement.appended_text;
const resolvedLinks = statement.metadata.citation_references
  .filter(ref => ref.resolved_link)
  .map(ref => ({
    text: ref.text,
    url: ref.resolved_link,
    confidence: ref.confidence
  }));
```

### Benefits

- **Future-Proof**: Citations can be linked retroactively when books are added
- **Flexible Matching**: Confidence-based linking supports fuzzy matching
- **Incremental Updates**: New books automatically resolve pending citations
- **Rich Context**: Maintains citation context for accurate linking

### Usage Workflow

```bash
# 1. Populate Tanya (extracts citations to Likkutei Torah, etc.)
node scripts/populate_chabad_book.js 3400000000 "Tanya"

# 2. Later populate Likkutei Torah
node scripts/populate_chabad_book.js 1230000000 "Likkutei Torah"

# 3. Run link resolution
node scripts/resolve-citation-links.js

# 4. Citations in Tanya now hyperlink to Likkutei Torah locations
```

### Advanced Features

#### Fuzzy Matching
- Handle variations in book titles
- Support multiple language variants (Hebrew/English)
- Confidence scoring for link quality

#### Contextual Linking
- Consider surrounding text for disambiguation
- Support multiple possible targets with user selection
- Maintain link history for accuracy tracking

#### Performance Optimization
- Batch processing for large citation databases
- Caching of resolved links
- Incremental updates for new content

## Conclusion

This system provides a robust, scalable solution for Jewish text digitization with:

- **Hierarchical Organization**: Proper book → section → chapter structure
- **Granular Citations**: Precise text-footnote associations with individual statement segments
- **Citation Cross-Referencing**: Deferred linking system for inter-textual navigation
- **Semantic Richness**: Maintains traditional Jewish text formatting and folio notation
- **Frontend Ready**: Optimized for interactive reading experiences with hover tooltips
- **Future-Proof Architecture**: Supports incremental book addition and retroactive citation linking
- **Extensible Design**: Supports additional text sources and citation formats

The combination of sequential scraping, granular statement creation, hierarchical relationships, and citation cross-referencing enables powerful digital Jewish text experiences that preserve traditional scholarship while enabling modern interactive features and inter-textual navigation.
