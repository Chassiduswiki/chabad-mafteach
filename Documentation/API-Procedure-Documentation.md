# API Procedure Documentation

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
        "DIRECTUS_TOKEN": "ChassidusWikiAdminToken2025"
      }
    }
  }
}
```

#### Direct API Connection
```bash
# Base URL
BASE_URL="https://directus-production-20db.up.railway.app"
TOKEN="ChassidusWikiAdminToken2025"

# Headers
HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
```

### 2. Database Schema Overview

#### Core Collections
- `authors` - Author information
- `documents` - Document content
- `paragraphs` - Paragraph data
- `source_links` - Source references
- `sources` - Source materials
- `statements` - Statement data
- `statement_topics` - Statement-topic relationships
- `topics` - Topic information
- `topic_relationships` - Topic relationships

### 3. Data Entry Order (Dependencies)

#### Phase 1: Foundation Data
1. **authors** - No dependencies
2. **sources** - No dependencies  
3. **topics** - No dependencies

#### Phase 2: Content Data
4. **documents** - Depends on authors
5. **paragraphs** - Depends on documents
6. **statements** - Depends on documents

#### Phase 3: Relationship Data
7. **source_links** - Depends on sources, documents, paragraphs
8. **statement_topics** - Depends on statements, topics
9. **topic_relationships** - Depends on topics

### 4. API Procedures by Collection

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
# Create source
curl -X POST $HEADERS "$BASE_URL/items/sources" \
  -d '{
    "title": "Source Title",
    "publication_year": 1820,
    "type": "sefer",
    "language": "hebrew",
    "publisher": "Publisher Name"
  }'
```

#### Topics Collection
```bash
# Create topic
curl -X POST $HEADERS "$BASE_URL/items/topics" \
  -d '{
    "name": "Topic Name",
    "description": "Topic description",
    "category": "philosophy"
  }'
```

#### Documents Collection
```bash
# Create document
curl -X POST $HEADERS "$BASE_URL/items/documents" \
  -d '{
    "title": "Document Title",
    "author_id": 1,
    "source_id": 1,
    "language": "hebrew",
    "year_written": 1825,
    "summary": "Document summary"
  }'
```

#### Paragraphs Collection
```bash
# Create paragraph
curl -X POST $HEADERS "$BASE_URL/items/paragraphs" \
  -d '{
    "document_id": 1,
    "paragraph_number": 1,
    "content": "Paragraph content in Hebrew or English",
    "translation": "English translation if needed"
  }'
```

#### Statements Collection
```bash
# Create statement
curl -X POST $HEADERS "$BASE_URL/items/statements" \
  -d '{
    "document_id": 1,
    "paragraph_id": 1,
    "content": "Statement text",
    "type": "halachic",
    "importance": "high"
  }'
```

#### Source Links Collection
```bash
# Create source link
curl -X POST $HEADERS "$BASE_URL/items/source_links" \
  -d '{
    "source_id": 1,
    "document_id": 1,
    "paragraph_id": 1,
    "page_number": 123,
    "reference_text": "Exact quote reference"
  }'
```

#### Statement Topics Collection
```bash
# Link statement to topic
curl -X POST $HEADERS "$BASE_URL/items/statement_topics" \
  -d '{
    "statement_id": 1,
    "topic_id": 1,
    "relevance_score": 0.8
  }'
```

#### Topic Relationships Collection
```bash
# Create topic relationship
curl -X POST $HEADERS "$BASE_URL/items/topic_relationships" \
  -d '{
    "parent_topic_id": 1,
    "child_topic_id": 2,
    "relationship_type": "subtopic",
    "strength": 0.7
  }'
```

### 5. Batch Operations

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

### 6. Query Examples

#### Get Document with Author
```bash
curl $HEADERS "$BASE_URL/items/documents?fields=*,authors.*&filter={author_id:{_eq:1}}"
```

#### Get Paragraphs with Statements
```bash
curl $HEADERS "$BASE_URL/items/paragraphs?fields=*,statements.*&filter={document_id:{_eq:1}}"
```

#### Get Topics with Statement Count
```bash
curl $HEADERS "$BASE_URL/items/topics?fields=*,statement_topics.statements.*"
```

### 7. Error Handling

#### Common Errors
- `400 Bad Request`: Invalid JSON or missing required fields
- `401 Unauthorized`: Invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Collection or item doesn't exist
- `422 Unprocessable Entity`: Validation error

#### Validation Rules
- `authors.canonical_name`: Required, unique
- `documents.author_id`: Must exist in authors table
- `paragraphs.document_id`: Must exist in documents table
- `statements.document_id`: Must exist in documents table

### 8. MCP Tool Usage

#### Available Tools
- `collections` - Manage collections
- `fields` - Manage fields  
- `relations` - Manage relationships
- `items` - CRUD operations
- `schema` - View complete schema

#### MCP Examples
```bash
# List all items in collection
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"items","arguments":{"collection":"authors","method":"GET"}}}' | node directus-mcp-bridge.js

# Create item
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"items","arguments":{"collection":"authors","method":"POST","data":{"canonical_name":"Test Author"}}}}' | node directus-mcp-bridge.js
```

### 9. Performance Tips

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

### 10. Security Considerations

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

### 11. Tanya Perek 1 Import Templates

#### 11.1 Paragraphs (Hebrew + English)

Collection: `paragraphs`

**CSV headers (tanya_perek1_paragraphs.csv)**

```text
order_key,original_lang,text,status,page_number,column_number,metadata,doc_id
```

**Notes**
- `order_key` (required): shared key for Heb/Eng pairs, e.g. `tanya_1_001`, `tanya_1_002`, …
- `original_lang`: `he` for Hebrew, `en` for English
- `text`: full paragraph text (Directus rich-text HTML is allowed, but plain text is fine)
- `status`: e.g. `draft` or `reviewed`
- `page_number` / `column_number`: optional (page/column in Tanya)
- `metadata`: JSON string (optional), e.g. `{"perek":1}`
- `doc_id`: numeric ID of `Tanya – Likutei Amarim` in `documents`

**Example rows (conceptual)**

```text
order_key,original_lang,text,status,page_number,column_number,metadata,doc_id
"tanya_1_001","he","<p>טַנְיָא, בְּסוֹף פֶּרֶק...</p>","draft",1,1,"{\"perek\":1}",3
"tanya_1_001","en","<p>It is written in the end of chapter...</p>","draft",1,1,"{\"perek\":1}",3
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/paragraphs" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_paragraphs.csv"
```

#### 11.2 Statements (extracted claims / footnotes)

Collection: `statements`

Key available fields:
- `order_key` (required)
- `original_lang` (`he` | `en`)
- `text` (required)
- `is_deleted` (boolean, default `false`)
- `status` (`draft` | `reviewed` | `published`)
- `is_disputed` (boolean)
- `importance_score` (float 0–1)
- `metadata` (json)
- `paragraph_id` (integer FK → `paragraphs.id`)

**CSV headers (tanya_perek1_statements.csv)**

```text
order_key,original_lang,text,status,is_deleted,is_disputed,importance_score,metadata,paragraph_id
```

**Example rows (conceptual)**

```text
order_key,original_lang,text,status,is_deleted,is_disputed,importance_score,metadata,paragraph_id
"tanya_1_001_a","he","הַצַּדִּיק הוּא ...","draft",false,false,0.9,"{\"note\":\"core definition\"}",<PARAGRAPH_ID_HEBREW>
"tanya_1_001_b","en","The tzaddik is defined as ...","draft",false,false,0.9,"{\"note\":\"EN paraphrase\"}",<PARAGRAPH_ID_ENGLISH>
```

Replace `<PARAGRAPH_ID_HEBREW>` / `<PARAGRAPH_ID_ENGLISH>` with real IDs from `paragraphs` after importing paragraphs.

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_statements.csv"
```

#### 11.3 Source Links (citations for statements)

Collection: `source_links`

Key available fields:
- `relationship_type` (`quotes` | `references`)
- `page_number` (string; can hold daf/siman, e.g. `Berachot 17a`)
- `confidence_level` (`low` | `medium` | `high`, default `medium`)
- `notes` (text)
- `statement_id` (integer, M2O → `statements.id`)
- `source_id` (integer, M2O → `sources.id`)

**CSV headers (tanya_perek1_source_links.csv)**

```text
relationship_type,page_number,confidence_level,notes,statement_id,source_id
```

**Example rows (conceptual)**

```text
relationship_type,page_number,confidence_level,notes,statement_id,source_id
"quotes","Berachot 17a","high","Direct citation of Gemara.",<STATEMENT_ID_A>,<SOURCE_ID_GEMARA>
"references","Hilchot Teshuva 3:1","medium","Conceptual parallel in Rambam.",<STATEMENT_ID_B>,<SOURCE_ID_RAMBAM>
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/source_links" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_source_links.csv"
```

#### 11.4 Statement Topics (mapping Tanya statements to topics)

Collection: `statement_topics`

Key available fields:
- `relevance_score` (float, default 1)
- `is_primary` (boolean, default true)
- `statement_id` (integer FK → `statements.id`)
- `topic_id` (integer FK → `topics.id`)

**CSV headers (tanya_perek1_statement_topics.csv)**

```text
relevance_score,is_primary,statement_id,topic_id
```

**Example rows (conceptual)**

```text
relevance_score,is_primary,statement_id,topic_id
1,true,<STATEMENT_ID_TZADIK_DEF>,<TOPIC_ID_TZADIK>
0.8,false,<STATEMENT_ID_TZADIK_DEF>,<TOPIC_ID_BEINONI>
```

**Bulk import**

```bash
curl -X POST "$BASE_URL/import/statement_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tanya_perek1_statement_topics.csv"
