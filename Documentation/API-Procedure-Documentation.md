# API Procedure Documentation

> **Updated to match New Directus Data Model (v2)** - This documentation now reflects the complete schema with version control, translations, comments, and audit logging.

## Database Connection & Data Entry Guide

### 1. Connection Setup

#### MCP Connection (Recommended)
```json
{
  "mcpServers": {
    "directus": {
      "command": "node",
      "args": [
        "/Users/yitzchok/Documents/Directus/directus-mcp-bridge.js"
      ],
      "env": {
        "DIRECTUS_URL": "https://directus-production-20db.up.railway.app",
        "DIRECTUS_TOKEN": "[REDACTED_ADMIN_TOKEN]"
      }
    }
  }
}
```

#### Direct API Connection
```bash
# Base URL
BASE_URL="https://directus-production-20db.up.railway.app"
TOKEN="[REDACTED_ADMIN_TOKEN]"

# Headers
HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
```

### 2. Database Schema Overview

#### Core Collections
- `authors` - Author information
- `documents` - Document content and metadata
- `content_blocks` - Unified content elements (headings, paragraphs, etc.) **[NEW - replaces paragraphs]**
- `block_commentaries` - Commentaries and translations for content blocks **[NEW]**
- `statements` - Statement/claim data with dispute tracking
- `sources` - Source materials with external system integration
- `source_links` - Source references with relationship types
- `topics` - Topic information with hierarchical types
- `topic_relationships` - Topic hierarchies and relationships
- `statement_topics` - Statement-topic mappings with relevance scoring
- `translations` - Multilingual content translations
- `document_versions` - Version control for documents
- `paragraph_versions` - Version control for paragraphs **[LEGACY - migrated to content_blocks]**
- `statement_versions` - Version control for statements
- `comments` - Threaded comments on content
- `audit_log` - Change tracking and audit trail
- `directus_users` - Extended user information (system collection)

### 3. Data Entry Order (Dependencies)

#### Phase 1: Foundation Data
1. **authors** - No dependencies
2. **sources** - May depend on authors
3. **topics** - No dependencies

#### Phase 2: Content Data
4. **documents** - No direct dependencies (can reference parent documents)
5. **content_blocks** - Depends on documents **[UPDATED - replaces paragraphs]**
6. **statements** - Depends on content_blocks **[UPDATED - references content_blocks instead of paragraphs]**

#### Phase 3: Commentary Data **[NEW]**
7. **block_commentaries** - Depends on content_blocks **[NEW - layered commentary system]**

#### Phase 4: Relationship Data
8. **source_links** - Depends on sources, statements
9. **statement_topics** - Depends on statements, topics
10. **topic_relationships** - Depends on topics

#### Phase 5: Enhanced Features
11. **translations** - Depends on any translatable entity
12. **comments** - Depends on statements
13. **audit_log** - Auto-generated during operations

### 4. Content Blocks-to-Statements Relationship Logic **[UPDATED]**

#### Overview
The system implements a hierarchical data structure: **documents > content_blocks > statements**, where content_blocks contain multiple statements and statements belong to exactly one content_block. This relationship enables granular topic mapping and citation tracking while supporting layered commentaries.

#### Two Relationship Approaches

##### 4.1 Topics API (Reading Existing Data)
**Purpose:** Display topic-related content by traversing existing relationships.

**Data Flow:**
```
topics → statement_topics (junction) → statements → content_blocks → documents
```

**Logic Steps:**
1. **Fetch topic** by slug
2. **Query statement_topics** junction table for matching topic
3. **Expand relations** to get statements and content_blocks **[UPDATED]**
4. **Filter orphaned records** (skip statements that don't exist)
5. **Group statements** under their parent content_blocks **[UPDATED]**
6. **Sort content_blocks** by `order_key` **[UPDATED]**

**API Endpoint:** `GET /api/topics/[slug]`

**Key Behavior:**
- Skips orphaned `statement_topics` records where referenced statements don't exist
- Groups statements under content_blocks for hierarchical display **[UPDATED]**
- Returns empty content_blocks array if no valid relationships found **[UPDATED]**

##### 4.2 Layered Commentary System **[NEW]**
**Purpose:** Display content with multiple commentaries side-by-side (Al HaTorah style).

**Data Flow:**
```
content_blocks → block_commentaries (multiple per block)
```

**Logic Steps:**
1. **Fetch content_blocks** for a document
2. **Load associated block_commentaries** for each content_block
3. **Filter commentaries** by type (commentary, translation, etc.)
4. **Sort commentaries** by order_position and author
5. **Apply quality filters** (official vs community)
6. **Display layered view** with base content and commentaries

**API Endpoint:** `GET /api/documents/[id]/layered`

**Display Structure:**
```
Content Block (base text)
├── Commentary 1 (author, type, language)
├── Commentary 2 (author, type, language)
└── Commentary 3 (author, type, language)
```

##### 4.3 Statement Breaking (Creating New Entries)
**Purpose:** Generate statement records from content_block text using AI.

**Data Flow:**
```
content_blocks → statements (create new records)
```

**Logic Steps:**
1. **Fetch content_blocks** for a document **[UPDATED]**
2. **Apply sentence boundary detection** on content_block text **[UPDATED]**
3. **Delete existing statements** for each content_block **[UPDATED]**
4. **Create new statement entries** with metadata
5. **Track creation metrics**

**API Endpoint:** `POST /api/statements/break` (via `breakDocumentIntoStatements` function)

**Sentence Boundary Patterns:**
```typescript
// Hebrew/English sentence detection
const sentencePatterns = [
  /(?<=[.!?])\s+(?=\p{L}[\p{L}\s]*[\u0590-\u05FF])/u,  // After punctuation + Hebrew
  /(?<=
S[.!?])\s+(?=\p{L})/u,  // After punctuation + any letter
  /(?<=
\w[.!?])\s+(?=\w)/,  // Standard English boundaries
];
```

**Generated Metadata:**
```json
{
  "auto_generated": true,
  "confidence": 0.3-1.0,
  "source": "statement_breaking"
}
```

#### Key Differences

| Aspect | Topics API (Reading) | Statement Breaking (Creating) |
|--------|---------------------|--------------------------------|
| **Direction** | topics → statements → paragraphs | paragraphs → statements |
| **Purpose** | Display topic-related content | Generate granular statements |
| **Data integrity** | Skip orphaned records | Delete/recreate entries |
| **Relationships** | Many-to-many via junction | One-to-many direct |

#### Usage Examples

**Reading Topic Content:**
```bash
# Get all paragraphs/statements for a topic
curl $HEADERS "$BASE_URL/api/topics/free-will"
```

**Creating Statements from Paragraphs:**
```bash
# Break document paragraphs into statements
curl -X POST $HEADERS "$BASE_URL/api/statements/break" \
  -d '{"document_id": "uuid-of-document"}'
```

#### Data Integrity Considerations
- **Foreign Key Constraints:** Directus doesn't enforce database-level FK constraints
- **Orphaned Records:** Topics API gracefully skips invalid statement references
- **Version Control:** Statement breaking creates new versions when updating existing statements
- **Audit Trail:** All operations are logged in `audit_log` collection

### 5. API Procedures by Collection

#### Authors Collection
```bash
# List authors
curl $HEADERS "$BASE_URL/items/authors"

# Create author
curl -X POST $HEADERS "$BASE_URL/items/authors" \
  -d '{
    "canonical_name": "Author Name",
    "birth_year": 1800,
    "death_year": 1850,
    "era": "acharonim",
    "bio_summary": "Brief biography"
  }'

# Update author
curl -X PATCH $HEADERS "$BASE_URL/items/authors/{id}" \
  -d '{"birth_year": 1801}'
```

#### Sources Collection
```bash
# List sources
curl $HEADERS "$BASE_URL/items/sources"

# Create source
curl -X POST $HEADERS "$BASE_URL/items/sources" \
  -d '{
    "title": "Source Title",
    "original_lang": "he",
    "publication_year": 1820,
    "publisher": "Publisher Name",
    "isbn": "978-1234567890",
    "is_external": false,
    "author_id": "uuid-of-author"
  }'

# Create external source
curl -X POST $HEADERS "$BASE_URL/items/sources" \
  -d '{
    "title": "External Source",
    "original_lang": "he",
    "is_external": true,
    "external_system": "sefaria",
    "external_id": "sefaria-identifier",
    "external_url": "https://sefaria.org/...",
    "citation_text": "Citation reference"
  }'

# Update source
curl -X PATCH $HEADERS "$BASE_URL/items/sources/{id}" \
  -d '{"publication_year": 1821}'
```

#### Topics Collection
```bash
# List topics
curl $HEADERS "$BASE_URL/items/topics"

# Create topic
curl -X POST $HEADERS "$BASE_URL/items/topics" \
  -d '{
    "canonical_title": "Topic Name",
    "original_lang": "en",
    "slug": "topic-name",
    "topic_type": "concept",
    "description": "Topic description"
  }'

# Update topic
curl -X PATCH $HEADERS "$BASE_URL/items/topics/{id}" \
  -d '{"description": "Updated description"}'
```

#### Documents Collection
```bash
# List documents
curl $HEADERS "$BASE_URL/items/documents"

# Create document
curl -X POST $HEADERS "$BASE_URL/items/documents" \
  -d '{
    "title": "Document Title",
    "doc_type": "sefer",
    "original_lang": "he",
    "status": "draft",
    "has_ocr": false,
    "page_count": 100,
    "source_format": "pdf",
    "metadata": {"key": "value"}
  }'

# Create child document (subsection)
curl -X POST $HEADERS "$BASE_URL/items/documents" \
  -d '{
    "title": "Chapter Title",
    "doc_type": "entry",
    "parent_id": "uuid-of-parent-document",
    "status": "draft"
  }'

# Update document
curl -X PATCH $HEADERS "$BASE_URL/items/documents/{id}" \
  -d '{"status": "reviewed"}'
```

#### Content Blocks Collection **[NEW - replaces paragraphs]**

**Collection Name:** `content_blocks`  
**Description:** Unified container for headings, paragraphs, and other content elements

**Key Fields:**
- `id` (integer, auto-increment) - Primary key
- `document_id` (integer) - Foreign key to documents
- `block_type` (string) - 'heading', 'subheading', 'paragraph', 'section_break'
- `order_key` (string) - Sorting key (e.g., "1:001", "1:002:001")
- `content` (text) - The actual content text
- `page_number` (string) - Physical page reference (e.g., "17a", "23b") **[NEW]**
- `chapter_number` (integer) - Chapter number **[NEW]**
- `halacha_number` (integer) - Halacha/Siman number **[NEW]**
- `daf_number` (string) - Talmud folio (e.g., "3b:6") **[NEW]**
- `section_number` (integer) - Section within larger work **[NEW]**
- `citation_refs` (json) - Alternative citation formats **[NEW]**
- `metadata` (json) - Additional data (heading level, etc.)

```bash
# List content blocks
curl $HEADERS "$BASE_URL/items/content_blocks"

# Create content block
curl -X POST $HEADERS "$BASE_URL/items/content_blocks" \
  -d '{
    "document_id": 1,
    "block_type": "paragraph",
    "order_key": "001",
    "content": "Content text here",
    "metadata": {"migrated": true}
  }'

# Create content block with citations
curl -X POST $HEADERS "$BASE_URL/items/content_blocks" \
  -d '{
    "document_id": 1,
    "block_type": "paragraph",
    "order_key": "001",
    "content": "Content text here",
    "page_number": "17a",
    "chapter_number": 2,
    "halacha_number": 5,
    "citation_refs": {
      "sefaria": "Shabbat.17a",
      "traditional": "סימן ה"
    }
  }'

# Create commentary with citation source
curl -X POST $HEADERS "$BASE_URL/items/block_commentaries" \
  -d '{
    "block_id": 1,
    "commentary_text": "This commentary explains...",
    "author": "Alter Rebbe",
    "commentary_type": "commentary",
    "language": "en",
    "citation_source": 123,
    "citation_page": "45b",
    "citation_reference": "Likkutei Sichos Vol 2, p. 123"
  }'
```

#### Block Commentaries Collection **[NEW]**

**Collection Name:** `block_commentaries`  
**Description:** Commentaries and translations for content blocks (layered commentary system)

**Key Fields:**
- `id` (integer, auto-increment) - Primary key
- `block_id` (integer) - Foreign key to content_blocks
- `commentary_text` (text) - The commentary content
- `author` (string/integer) - Author (string or foreign key to authors)
- `source` (string) - Source reference
- `commentary_type` (string) - 'commentary', 'translation', 'cross_reference', 'explanation'
- `language` (string) - Language code
- `order_position` (integer) - Display order
- `is_official` (boolean) - Official vs community contribution
- `quality_score` (decimal) - 0-1 quality rating
- `moderation_status` (string) - 'pending', 'approved', 'rejected', 'flagged'
- `citation_source` (integer) - Link to source document **[NEW]**
- `citation_page` (string) - Page reference in source **[NEW]**
- `citation_reference` (string) - Full citation string **[NEW]**

```bash
# List commentaries for a content block
curl $HEADERS "$BASE_URL/items/block_commentaries?filter[block_id][_eq]=1"

# Create commentary
curl -X POST $HEADERS "$BASE_URL/items/block_commentaries" \
  -d '{
    "block_id": 1,
    "commentary_text": "This commentary explains...",
    "author": "Alter Rebbe",
    "source": "Tanya",
    "commentary_type": "commentary",
    "language": "en",
    "order_position": 1,
    "is_official": true,
    "quality_score": 0.95
  }'

# Get approved commentaries only
curl $HEADERS "$BASE_URL/items/block_commentaries?filter[moderation_status][_eq]=approved"

# Update commentary quality
curl -X PATCH $HEADERS "$BASE_URL/items/block_commentaries/{id}" \
  -d '{"quality_score": 0.9, "moderation_status": "approved"}'
```

#### Statements Collection **[UPDATED]**

**Key Changes:**
- `block_id` (integer) - **NEW:** Foreign key to content_blocks (replaces `paragraph_id`)
- All other fields remain the same

```bash
# List statements
curl $HEADERS "$BASE_URL/items/statements?filter[is_deleted][_eq]=false"

# Create statement **[UPDATED]**
curl -X POST $HEADERS "$BASE_URL/items/statements" \
  -d '{
    "block_id": 1,  // CHANGED from paragraph_id
    "order_key": "stmt_001_001_a",
    "original_lang": "he",
    "text": "Statement text",
    "status": "draft",
    "importance_score": 0.8,
    "is_disputed": false
  }'

# Get statements with content blocks **[UPDATED]**
curl $HEADERS "$BASE_URL/items/statements?fields=*,block_id.*"
```

#### Documents Collection **[UPDATED]**

**No structural changes, but now includes layered commentary API:**

```bash
# Get document with layered commentary view **[NEW]**
curl $HEADERS "$BASE_URL/api/documents/1/layered"

# Response includes content_blocks with associated commentaries
{
  "document": {...},
  "content_blocks": [
    {
      "id": 1,
      "content": "Base text...",
      "block_type": "paragraph",
      "block_commentaries": [
        {
          "commentary_text": "Translation...",
          "author": "Alter Rebbe",
          "commentary_type": "translation"
        },
        {
          "commentary_text": "Commentary...",
          "author": "Rebbe",
          "commentary_type": "commentary"
        }
      ]
    }
  ]
}
```
```bash
# List statements
curl $HEADERS "$BASE_URL/items/statements?filter={is_deleted:{_eq:false}}"

# Create statement
curl -X POST $HEADERS "$BASE_URL/items/statements" \
  -d '{
    "order_key": "stmt_001_001_a",
    "original_lang": "he",
    "text": "Statement text",
    "status": "draft",
    "importance_score": 0.8,
    "is_disputed": false,
    "paragraph_id": "uuid-of-paragraph"
  }'

# Mark statement as disputed
curl -X PATCH $HEADERS "$BASE_URL/items/statements/{id}" \
  -d '{"is_disputed": true}'

# Soft delete statement
curl -X PATCH $HEADERS "$BASE_URL/items/statements/{id}" \
  -d '{"is_deleted": true, "deleted_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}'
```

#### Source Links Collection
```bash
# List source links
curl $HEADERS "$BASE_URL/items/source_links"

# Create source link
curl -X POST $HEADERS "$BASE_URL/items/source_links" \
  -d '{
    "relationship_type": "quotes",
    "page_number": "123a",
    "confidence_level": "high",
    "notes": "Direct citation from Talmud",
    "statement_id": "uuid-of-statement",
    "source_id": "uuid-of-source"
  }'

# Create verse reference
curl -X POST $HEADERS "$BASE_URL/items/source_links" \
  -d '{
    "relationship_type": "references",
    "verse_reference": "Berachot 17a",
    "confidence_level": "medium",
    "statement_id": "uuid-of-statement",
    "source_id": "uuid-of-source"
  }'

# Verify source link
curl -X PATCH $HEADERS "$BASE_URL/items/source_links/{id}" \
  -d '{"verified_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}'
```

#### Statement Topics Collection
```bash
# List statement topics
curl $HEADERS "$BASE_URL/items/statement_topics"

# Link statement to topic
curl -X POST $HEADERS "$BASE_URL/items/statement_topics" \
  -d '{
    "statement_id": "uuid-of-statement",
    "topic_id": "uuid-of-topic",
    "relevance_score": 0.8,
    "is_primary": true,
    "notes": "Primary topic for this statement"
  }'

# Update relevance score
curl -X PATCH $HEADERS "$BASE_URL/items/statement_topics/{id}" \
  -d '{"relevance_score": 0.9}'
```

#### Topic Relationships Collection
```bash
# List topic relationships
curl $HEADERS "$BASE_URL/items/topic_relationships"

# Create topic relationship
curl -X POST $HEADERS "$BASE_URL/items/topic_relationships" \
  -d '{
    "parent_topic_id": "uuid-of-parent-topic",
    "child_topic_id": "uuid-of-child-topic",
    "relation_type": "subcategory",
    "strength": 0.8,
    "display_order": 1,
    "description": "Tzaddik is a subcategory of Beinoni"
  }'

# Update relationship strength
curl -X PATCH $HEADERS "$BASE_URL/items/topic_relationships/{id}" \
  -d '{"strength": 0.9}'
```

#### Translations Collection
```bash
# List translations
curl $HEADERS "$BASE_URL/items/translations"

# Create translation
curl -X POST $HEADERS "$BASE_URL/items/translations" \
  -d '{
    "entity_type": "statement",
    "entity_id": "uuid-of-statement",
    "field_name": "text",
    "target_lang": "en",
    "translated_text": "English translation of the statement",
    "translation_quality": "human_verified"
  }'

# Update translation quality
curl -X PATCH $HEADERS "$BASE_URL/items/translations/{id}" \
  -d '{"translation_quality": "professional"}'
```

#### Document Versions Collection
```bash
# List document versions
curl $HEADERS "$BASE_URL/items/document_versions?filter={document_id:{_eq:\"uuid-of-document\"}}"

# Create document version (usually auto-generated via Flows)
curl -X POST $HEADERS "$BASE_URL/items/document_versions" \
  -d '{
    "document_id": "uuid-of-document",
    "version_number": 2,
    "title": "Updated Title",
    "change_type": "title_updated",
    "change_summary": "Corrected title spelling"
  }'
```

#### Paragraph Versions Collection
```bash
# List paragraph versions
curl $HEADERS "$BASE_URL/items/paragraph_versions?filter={paragraph_id:{_eq:\"uuid-of-paragraph\"}}"

# Create paragraph version
curl -X POST $HEADERS "$BASE_URL/items/paragraph_versions" \
  -d '{
    "paragraph_id": "uuid-of-paragraph",
    "version_number": 1,
    "text": "Updated paragraph content",
    "change_type": "content_edited"
  }'
```

#### Statement Versions Collection
```bash
# List statement versions
curl $HEADERS "$BASE_URL/items/statement_versions?filter={statement_id:{_eq:\"uuid-of-statement\"}}"

# Create statement version
curl -X POST $HEADERS "$BASE_URL/items/statement_versions" \
  -d '{
    "statement_id": "uuid-of-statement",
    "version_number": 1,
    "text": "Updated statement text",
    "change_type": "text_edited"
  }'
```

#### Comments Collection
```bash
# List comments for a statement
curl $HEADERS "$BASE_URL/items/comments?filter={statement_id:{_eq:\"uuid-of-statement\"}}"

# Create comment
curl -X POST $HEADERS "$BASE_URL/items/comments" \
  -d '{
    "statement_id": "uuid-of-statement",
    "text": "This statement needs verification",
    "status": "open",
    "thread_depth": 0
  }'

# Reply to comment
curl -X POST $HEADERS "$BASE_URL/items/comments" \
  -d '{
    "statement_id": "uuid-of-statement",
    "parent_comment_id": "uuid-of-parent-comment",
    "text": "I agree, let's check the source",
    "thread_depth": 1
  }'

# Resolve comment
curl -X PATCH $HEADERS "$BASE_URL/items/comments/{id}" \
  -d '{"status": "resolved"}'
```

#### Audit Log Collection
```bash
# List audit entries (read-only, auto-generated)
curl $HEADERS "$BASE_URL/items/audit_log?filter={entity_type:{_eq:\"statement\"}}&sort=-action_timestamp"

# Note: Audit log entries are created automatically via Flows or hooks
```

### 6. Batch Operations

#### Bulk Create Authors
```bash
curl -X POST $HEADERS "$BASE_URL/items/authors" \
  -d '[
    {"canonical_name": "Author 1", "era": "rishonim"},
    {"canonical_name": "Author 2", "era": "acharonim"}
  ]'
```

#### Bulk Import from File
```bash
# Create CSV file: authors.csv
# canonical_name,birth_year,death_year,era,bio_summary
# "Author Name",1800,1850,acharonim,"Bio text"

curl -X POST "$BASE_URL/import/authors" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@authors.csv"
```

### 7. Query Examples

#### Get Document with Author (via Sources)
```bash
curl $HEADERS "$BASE_URL/items/documents?fields=*,sources.authors.*&filter={sources:{author_id:{_eq:\"uuid-of-author\"}}}"
```

#### Get Content Blocks with Statements **[UPDATED]**
```bash
curl $HEADERS "$BASE_URL/items/content_blocks?fields=*,statements.*&filter[document_id][_eq]=1"
```

#### Get Topics with Content Blocks **[UPDATED]**
```bash
curl $HEADERS "$BASE_URL/items/topics?fields=*,statement_topics.statements.block_id.*"
```

#### Get Statement with Content Block and Commentaries **[NEW]**
```bash
curl $HEADERS "$BASE_URL/items/statements?fields=*,block_id.*,block_id.block_commentaries.*&filter[id][_eq]=1"
```

#### Get Document Hierarchy with Layered Content **[NEW]**
```bash
curl $HEADERS "$BASE_URL/items/documents?fields=*,content_blocks.statements.*,content_blocks.block_commentaries.*&filter[id][_eq]=1"
```

### 8. Error Handling

#### Common Errors
- `400 Bad Request`: Invalid JSON or missing required fields
- `401 Unauthorized`: Invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Collection or item doesn't exist
- `422 Unprocessable Entity`: Validation error

#### Validation Rules **[UPDATED]**
- `content_blocks.document_id`: Must exist in documents table
- `content_blocks.block_type`: Must be one of ['heading', 'subheading', 'paragraph', 'section_break']
- `block_commentaries.block_id`: Must exist in content_blocks table
- `block_commentaries.author`: Can be string or foreign key to authors table
- `block_commentaries.quality_score`: Min: 0, Max: 1 **[NEW]**
- `block_commentaries.commentary_type`: Must be one of ['commentary', 'translation', 'cross_reference', 'explanation']
- `statements.block_id`: Must exist in content_blocks table **[UPDATED from paragraph_id]**
- `source_links.statement_id`: Must exist in statements table
- `source_links.source_id`: Must exist in sources table
- `statement_topics.statement_id`: Must exist in statements table
- `statement_topics.topic_id`: Must exist in topics table
- `topic_relationships.parent_topic_id`: Must exist in topics table
- `topic_relationships.child_topic_id`: Must exist in topics table
- `translations.entity_id`: Must exist in the specified entity_type table
- `comments.parent_comment_id`: Must exist in comments table (if provided)
- `ocr_confidence`: Min: 0, Max: 1
- `importance_score`: Min: 0, Max: 1
- `relevance_score`: Min: 0, Max: 1
- `strength`: Min: 0, Max: 1

### 9. Layered Commentary System Migration **[NEW]**

#### Migration Overview
On December 10, 2025, the system was migrated from a paragraph-based structure to a unified content_blocks system with layered commentary support (Al HaTorah-style).

#### What Changed
- **paragraphs** collection → **content_blocks** collection (unified content elements)
- **NEW:** block_commentaries collection (commentaries and translations)
- **statements.paragraph_id** → **statements.block_id** (references content_blocks)
- Added quality score validation and moderation workflow

#### Migration Results
- ✅ **71 paragraphs** migrated to content_blocks
- ✅ **1 statement** updated to reference content_blocks  
- ✅ **70/71** content_blocks successfully mapped
- ✅ **Quality score validation** active (0-1 range)
- ✅ **Layered commentary system** operational

#### Data Structure Migration
```typescript
// OLD structure
documents > paragraphs > statements > statement_topics

// NEW structure  
documents > content_blocks > statements > statement_topics
                     ↓
              block_commentaries (multiple per block)
```

#### API Changes
- `GET /api/topics/[slug]` now returns content_blocks instead of paragraphs
- `POST /api/statements/break` now works with content_blocks
- `GET /api/documents/[id]/layered` - **NEW:** layered commentary view

#### Backward Compatibility
- Original `paragraphs` table renamed to `paragraphs_backup`
- All existing data preserved in backup
- Migration is one-way (no rollback capability)

#### Testing the New System
```bash
# Test content_blocks creation
curl -X POST $HEADERS "$BASE_URL/items/content_blocks" \
  -d '{"document_id": 1, "block_type": "paragraph", "order_key": "test", "content": "Test content"}'

# Test commentary creation
curl -X POST $HEADERS "$BASE_URL/items/block_commentaries" \
  -d '{"block_id": 1, "commentary_text": "Test commentary", "author": "Test Author", "commentary_type": "commentary", "language": "en", "quality_score": 0.8}'

# Test layered view
curl $HEADERS "$BASE_URL/items/content_blocks?fields=*,block_commentaries.*&filter[document_id][_eq]=1"
```

### 10. MCP Tool Usage **[UPDATED]**

### 10. Performance Tips

#### Efficient Data Loading
1. Use batch operations for multiple items
2. Load in dependency order
3. Use field selection to reduce payload size
4. Implement proper indexing on frequently queried fields

#### Recommended Workflow
1. Start with foundation data (authors, sources, topics)
2. Add content (documents, paragraphs, statements)
3. Create relationships last
4. Validate data integrity after each phase

### 11. Security Considerations

#### Token Management
- Store tokens securely
- Use environment variables in production
- Rotate tokens regularly
- Implement proper access controls

#### Data Validation
- Validate input data before API calls
- Use proper escaping for special characters
- Implement client-side validation
- Handle API errors gracefully

### 12. Tanya Perek 1 Import Templates **[UPDATED]**

#### 12.1 Content Blocks (Hebrew + English) **[UPDATED]**

Collection: `content_blocks`

**CSV headers (tanya_perek1_content_blocks.csv)**

```text
order_key,block_type,content,document_id,page_number,chapter_number,section_number,citation_refs,metadata
```

**Notes**
- `order_key` (required): shared key for Heb/Eng pairs, e.g. `tanya_1_001`, `tanya_1_002`, …
- `block_type`: `paragraph` for regular content, `heading` for section titles
- `content`: full content text (Directus rich-text HTML is allowed, but plain text is fine)
- `document_id`: Integer ID of `Tanya – Likutei Amarim` in `documents`
- `page_number`: Physical page reference (e.g., "1a", "2b")
- `chapter_number`: Chapter number within the work
- `section_number`: Section number (e.g., 1 for Likutei Amarim)
- `citation_refs`: JSON array of alternative citation formats
- `metadata`: JSON string (optional), e.g. `{"perek":1, "original_lang":"he"}`

**Example rows (conceptual)**

```text
order_key,block_type,content,document_id,page_number,chapter_number,section_number,citation_refs,metadata
"tanya_1_001","paragraph","<p>טַנְיָא, בְּסוֹף פֶּרֶק...</p>",123,"1a",1,1,"[{""system"":""sefaria"",""reference"":""Tanya.1a""}]","{""perek"":1,""original_lang"":""he""}"
"tanya_1_001","paragraph","<p>It is written in the end of chapter...</p>",123,"1a",1,1,"[{""system"":""sefaria"",""reference"":""Tanya.1a""}]","{""perek"":1,""original_lang"":""en""}"
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/content_blocks" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_content_blocks.csv"
```

#### 12.2 Statements (extracted claims / footnotes)

Collection: `statements`

Key available fields:
- `order_key` (required)
- `original_lang` (`he` | `en`)
- `text` (required)
- `status` (`draft` | `reviewed` | `published`)
- `is_deleted` (boolean, default `false`)
- `is_disputed` (boolean)
- `importance_score` (float 0–1)
- `appended_text` (text, for footnotes)
- `metadata` (json)
- `block_id` (integer FK → `content_blocks.id`) **[UPDATED from paragraph_id]**

**CSV headers (tanya_perek1_statements.csv)**

```text
order_key,original_lang,text,status,is_deleted,is_disputed,importance_score,appended_text,metadata,block_id
```

**Example rows (conceptual)**

```text
order_key,original_lang,text,status,is_deleted,is_disputed,importance_score,appended_text,metadata,block_id
"stmt_1_001_a","he","הַצַּדִּיק הוּא ...","draft",false,false,0.9,"<div class=""footnote"">1.1 Footnote content...</div>","{""note"":""core definition""}",123
"stmt_1_001_b","en","The tzaddik is defined as ...","draft",false,false,0.9,"<div class=""footnote"">1.1 Footnote content...</div>","{""note"":""EN paraphrase""}",124
```

Replace `123`/`124` with real integer IDs from `content_blocks` after importing content blocks.

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_statements.csv"
```

#### 12.3 Source Links (citations for statements)

Collection: `source_links`

Key available fields:
- `relationship_type` (`quotes` | `references`)
- `page_number` (string; can hold daf/siman, e.g. `Berachot 17a`)
- `confidence_level` (`low` | `medium` | `high`, default `medium`)
- `notes` (text)
- `statement_id` (UUID, M2O → `statements.id`)
- `source_id` (UUID, M2O → `sources.id`)

**CSV headers (tanya_perek1_source_links.csv)**

```text
relationship_type,page_number,confidence_level,notes,statement_id,source_id
```

**Example rows (conceptual)**

```text
relationship_type,page_number,confidence_level,notes,statement_id,source_id
"quotes","Berachot 17a","high","Direct citation of Gemara.","uuid-statement-a","uuid-gemara-source"
"references","Hilchot Teshuva 3:1","medium","Conceptual parallel in Rambam.","uuid-statement-b","uuid-rambam-source"
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/source_links" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_source_links.csv"
```

#### 12.4 Statement Topics (mapping Tanya statements to topics)

Collection: `statement_topics`

Key available fields:
- `relevance_score` (float, default 1)
- `is_primary` (boolean, default true)
- `statement_id` (UUID FK → `statements.id`)
- `topic_id` (UUID FK → `topics.id`)

**CSV headers (tanya_perek1_statement_topics.csv)**

```text
relevance_score,is_primary,statement_id,topic_id
```

**Example rows (conceptual)**

```text
relevance_score,is_primary,statement_id,topic_id
1,true,"uuid-statement-tzaddik-def","uuid-topic-tzaddik"
0.8,false,"uuid-statement-tzaddik-def","uuid-topic-beinoni"
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/statement_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_statement_topics.csv"

---

### 13. Chabad Library Data Population

#### 13.1 Chabad Library Structure
The Chabad Library scraper extracts books with hierarchical structure:
- **Top Level:** Section titles (e.g., "ליקוטי אמרים" - Likutei Amarim)
- **Headings:** Hebrew folio markings (e.g., "א, א" = Folio 1a, "א, ב" = Folio 1b)
- **Content:** HTML text with `<h2>` section titles and footnote references
- **Notes:** Structured footnote content with `[ftn_X_Y]` markers

#### 13.2 Population Script
**Location:** `scripts/populate_chabad_book.js`

**Usage:**
```bash
node scripts/populate_chabad_book.js <book_id> "<Book Title>"
```

**Example:**
```bash
node scripts/populate_chabad_book.js 3400000000 "Tanya - Complete Edition"
```

#### 13.3 Data Transformation

**Hierarchical Document Structure:**
- **Main Document**: `doc_type: "sefer"` - The complete book
- **Section Documents**: `doc_type: "entry"` - Major sections like "ליקוטי אמרים", "שער היחוד והאמונה"
- **Chapter Paragraphs**: Under each section document
- **Statements**: Under each paragraph with footnote extraction

**Folio Number Conversion:**
- Hebrew folio markings like "א, א" → Standard notation "1a" (Folio 1a)
- Hebrew letters map: א=a, ב=b, ג=c, ד=d, ה=e, ו=f, ז=g, ח=h, ט=i, י=j, כ=k, ל=l, מ=m, נ=n, ס=o, ע=p, פ=q, צ=r, ק=s, ר=t, ש=u, ת=v
- Formula: `folio_number + letter` (e.g., "א, א" = "1a", "ב, ב" = "2b")

**Section Title Extraction:**
- Parses `<h2>` tags from HTML content
- Stored in paragraph `metadata.section_title`

**Footnote Processing:**
- Extracts footnote references `[ftnref_X_Y]` from text
- Appends formatted footnotes to statement `appended_text` field
- Format: `<div class="footnote">X.Y footnote content</div>`

**Language Detection:**
- Analyzes character frequency (>10% Hebrew characters = 'he', else 'en')
- Applied to both paragraphs and statements

#### 13.4 Generated Hierarchical Structure

**Main Book Document:**
```json
{
  "title": "Tanya - Complete Edition",
  "doc_type": "sefer",
  "original_lang": "he",
  "source_format": "chabad_library",
  "metadata": {
    "source": "chabad_library",
    "scraped_id": 3400000000,
    "document_type": "main_book"
  }
}
```

**Section Documents (Children of Main Book):**
```json
{
  "title": "ליקוטי אמרים",
  "doc_type": "entry",
  "parent_id": "main-book-id",
  "original_lang": "he",
  "metadata": {
    "source": "chabad_library",
    "section_type": "major_section",
    "original_id": 3401310001
  }
}
```

**Chapter Paragraphs (Under Section Documents):**
```json
{
  "order_key": "001",
  "original_lang": "he",
  "text": "<h2>ליקוטי אמרים</h2>תניא משביעים אותו...",
  "page_number": 1,
  "doc_id": "section-document-id",
  "metadata": {
    "source": "chabad_library",
    "original_id": 3401310006,
    "section_title": "ליקוטי אמרים",
    "heading_type": "folio_reference",
    "folio_notation": "1a",
    "chapter_type": "chapter"
  }
}
```

**Statements (Under Chapter Paragraphs):**
```json
{
  "order_key": "001",
  "original_lang": "he",
  "text": "Full chapter text",
  "appended_text": "<div class=\"footnote\">1.1 Footnote content...</div>",
  "metadata": {
    "source": "chabad_library",
    "auto_generated": true,
    "page_number": 1,
    "folio_notation": "1a",
    "section_title": "ליקוטי אמרים"
  }
}
```

#### 13.5 Navigation Structure
```
Tanya - Complete Edition (Main Document - sefer)
├── ליקוטי אמרים (Section Document - entry)
│   ├── פרק א (Chapter Paragraph + Statement)
│   ├── פרק ב (Chapter Paragraph + Statement)
│   └── ... (51 more chapters)
├── שער היחוד והאמונה (Section Document - entry)
│   └── [Chapters under this section]
├── אגרת התשובה (Section Document - entry)
│   └── [Chapters under this section]
├── אגרת הקדש (Section Document - entry)
│   └── [Chapters under this section]
└── קונטרס אחרון (Section Document - entry)
    └── [Chapters under this section]
```

This hierarchical structure allows for proper organization of complex books with multiple major sections, each containing their own chapters.

### 13. AI API Endpoints (Phase 3)

### 13.1 OpenRouter Integration

The system now includes AI-powered processing using OpenRouter API with free-tier DeepSeek models for Hebrew text processing.

**Environment Setup:**
```bash
# Add to .env.local
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Available Models:** DeepSeek R1 (free tier, excellent for reasoning tasks)

### 13.2 Statement Breaking API

**Endpoint:** `POST /api/statements/break`

Breaks paragraph text into logical statements using AI.

**Request:**
```json
{
  "paragraph_id": 123,
  "document_id": 456
}
```

**Response:**
```json
{
  "success": true,
  "statements_created": 3,
  "statements": [...]
}
```

### 13.3 OCR Correction API

**Endpoint:** `POST /api/ocr/correct`

Corrects OCR errors in Hebrew text using AI.

**Request:**
```json
{
  "text": "text with potential OCR errors",
  "statement_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "original_text": "original",
  "corrected_text": "corrected",
  "confidence": 0.85,
  "changes_made": ["corrections list"]
}
```

### 13.4 Citation Detection API

**Endpoint:** `POST /api/citations/detect`

Detects Jewish source citations in text using AI pattern recognition.

**Request:**
```json
{
  "text": "text containing citations like תניא אגרת התשובה פרק ב׳"
}
```

**Response:**
```json
{
  "success": true,
  "citations_found": 2,
  "citations": [
    {
      "text": "תניא אגרת התשובה פרק ב׳",
      "type": "tanya",
      "confidence": 0.9
    }
  ]
}
```

### 13.5 Topic Tagging API

**Endpoint:** `POST /api/topics/tag`

Automatically tags documents with relevant Jewish philosophical topics.

**Request:**
```json
{
  "text": "document content for topic analysis"
}
```

**Response:**
```json
{
  "success": true,
  "topics_found": 5,
  "topics": [
    {
      "name": "Free Will",
      "hebrew_name": "בחירה חפשית",
      "category": "philosophy",
      "confidence": 0.8
    }
  ]
}
```

### 13.5 Grammar Check API

**Endpoint:** `POST /api/editor/grammar`

Corrects spelling and grammar errors in Hebrew text using AI analysis.

**Request:**
```json
{
  "text": "text with potential Hebrew grammar or spelling errors",
  "statement_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "issues_found": 2,
    "corrections": [
      {
        "type": "grammar",
        "original": "אני הולך לבית",
        "corrected": "אני הולך לבית",
        "explanation": "Proper preposition usage"
      }
    ],
    "suggestions": [
      "Consider using more formal Hebrew",
      "Check for consistent verb conjugation"
    ]
  }
}
```

### 13.6 Paraphrase API

**Endpoint:** `POST /api/editor/paraphrase`

Improves text clarity, flow, and academic writing quality using AI.

**Request:**
```json
{
  "text": "text to improve and paraphrase",
  "style": "academic",
  "statement_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "original_text": "original text",
    "improved_text": "enhanced version with better clarity",
    "changes_made": 3,
    "improvements": [
      {
        "type": "clarity",
        "original": "unclear phrase",
        "improved": "clearer version",
        "reason": "improves readability"
      }
    ],
    "confidence": 0.85,
    "style_applied": "academic writing style"
  }
}
```

**Cost:** Free tier DeepSeek R1 model, perfect for development and testing.

### 14. Citation System Enhancement

#### 14.1 Overview
The citation system has been enhanced to automatically associate quotes and sources with existing books in the database, with Sefaria integration as fallback for external sources.

#### 14.2 New Hooks and Components

##### `useDocumentSearch` Hook
**Location:** `lib/hooks/useDocumentSearch.ts`

**Purpose:** Fuzzy search across documents for citation association.

**API:**
```typescript
const {
  searchDocuments,
  isLoading,
  error,
  results
} = useDocumentSearch();
```

**Usage:**
```typescript
// Search for documents
await searchDocuments("Tanya");

// Results include fuzzy-matched documents with confidence scores
results = [
  {
    id: 123,
    title: "Tanya (Likkutei Amarim)",
    score: 0.95, // High confidence match
    type: "sefer"
  }
]
```

##### Enhanced `useCreateSource` Hook
**Location:** `lib/hooks/useCreateSource.ts`

**Enhancements:**
- Automatic document association during source creation
- Fuzzy matching against existing document titles
- Support for external sources from Sefaria

**New Parameters:**
```typescript
interface CreateSourceInput {
  title: string;
  author?: string;
  documentId?: number; // NEW: Direct document association
  externalSource?: {   // NEW: External source data
    system: 'sefaria' | 'wikisource' | 'hebrewbooks';
    id: string;
    url: string;
    data?: any;
  };
}
```

**Usage:**
```typescript
// Create source linked to existing document
await createSource({
  title: "Tanya - Chapter 1",
  author: "Rabbi Shneur Zalman of Liadi",
  documentId: 123 // Links to existing Tanya document
});

// Create external source from Sefaria
await createSource({
  title: "Mishneh Torah",
  author: "Maimonides",
  externalSource: {
    system: 'sefaria',
    id: 'Mishneh_Torah',
    url: 'https://sefaria.org/Mishneh_Torah'
  }
});
```

##### `CitationCommandPalette` Component
**Location:** `components/editor/CitationCommandPalette.tsx`

**Enhancements:**
- Unified search interface for documents, sources, and external content
- Visual indicators: green (documents), blue (sources), purple (Sefaria)
- Smart selection logic prioritizing local content

**New Features:**
```typescript
// Combined search results
const combinedResults = [
  // Documents from library (highest priority)
  { type: 'document', title: 'Tanya', score: 0.95, badge: '🟢' },
  // Existing sources
  { type: 'source', title: 'Likkutei Sichos', score: 0.8, badge: '🔵' },
  // Sefaria fallback
  { type: 'sefaria', title: 'Search Sefaria', badge: '🟣' }
];
```

##### `SefariaSearchModal` Component
**Location:** `components/editor/SefariaSearchModal.tsx`

**Purpose:** External source discovery and import from Sefaria.

**Features:**
- Live preview of Hebrew/English text
- Direct import of Sefaria sources
- Citation formatting for external sources

**API:**
```typescript
// Search Sefaria
const results = await searchSefaria("Mishneh Torah");

// Import as external source
await importSefariaSource(selectedResult);
```

#### 14.3 Schema Changes

##### Sources Collection Enhancements
```json
{
  "document_id": {
    "type": "integer",
    "meta": {
      "interface": "many-to-one",
      "special": ["m2o"],
      "options": {
        "template": "{{title}}"
      }
    }
  },
  "is_external": {
    "type": "boolean",
    "default": false
  },
  "external_system": {
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Sefaria", "value": "sefaria"},
          {"text": "Wikisource", "value": "wikisource"},
          {"text": "HebrewBooks", "value": "hebrewbooks"}
        ]
      }
    }
  },
  "external_id": {
    "type": "string"
  },
  "external_url": {
    "type": "string",
    "meta": {
      "interface": "input",
      "options": {
        "placeholder": "https://..."
      }
    }
  }
}
```

#### 14.4 Search Priority Logic

1. **Local Documents** (Highest Priority - Green 🟢)
   - Books already in the Chabad Mafteach library
   - Direct association creates linked citations

2. **Existing Sources** (Medium Priority - Blue 🔵)
   - Previously created sources
   - May or may not be linked to documents

3. **External Sources** (Fallback - Purple 🟣)
   - Sefaria search when no local matches found
   - Creates external source records

#### 14.5 API Endpoints

##### Document Search
```bash
# Search documents for citation association
curl $HEADERS "$BASE_URL/items/documents?search=Tanya&fields=id,title,doc_type,metadata&filter={status:{_eq:'published'}}"
```

##### Enhanced Source Creation
```bash
# Create source with document association
curl -X POST $HEADERS "$BASE_URL/items/sources" \
  -d '{
    "title": "Tanya - Chapter 1",
    "author": "Rabbi Shneur Zalman of Liadi",
    "document_id": 123,
    "is_external": false
  }'

# Create external source
curl -X POST $HEADERS "$BASE_URL/items/sources" \
  -d '{
    "title": "Mishneh Torah",
    "author": "Maimonides",
    "is_external": true,
    "external_system": "sefaria",
    "external_id": "Mishneh_Torah",
    "external_url": "https://sefaria.org/Mishneh_Torah"
  }'
```

#### 14.6 Performance Optimizations

- **Document search caching:** 60-second cache for document queries
- **Fuzzy search debouncing:** 300ms delay to prevent excessive API calls
- **Result limiting:** Maximum 15 combined results to maintain performance
- **Lazy loading:** Search components load only when needed

#### 14.7 Error Handling

```typescript
// Hook error states
const {
  searchDocuments,
  isLoading,
  error // "No documents found" | "Network error" | "Invalid search"
} = useDocumentSearch();

// Component error boundaries
try {
  await createSource(input);
} catch (error) {
  if (error.code === 'DUPLICATE_SOURCE') {
    // Handle duplicate source creation
  }
  if (error.code === 'DOCUMENT_NOT_FOUND') {
    // Handle invalid document association
  }
}
```

#### 14.8 Migration Notes

**Existing Citations:** All existing citation functionality remains unchanged. The enhancement is additive and backward compatible.

**Data Integrity:** Sources without document associations continue to work normally. New citations can optionally be linked to documents.

**External Sources:** Legacy external sources are automatically tagged with appropriate `external_system` values during upgrades.

---

**Last Updated:** December 2025
**Related Documentation:**
- [Citation System User Guide](Citation-User-Guide.md)
- [Citation System Enhancement Summary](Citation-System-Implementation-Summary.md)
