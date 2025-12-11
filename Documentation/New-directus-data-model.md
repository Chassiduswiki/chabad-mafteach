# Complete Directus Setup Guide
## Jewish Encyclopedia & Seforim Database with Layered Commentary System

This guide walks you through implementing the complete schema in Directus, step by step. This version includes the new layered commentary system (Al HaTorah-style) with content_blocks replacing paragraphs and block_commentaries for multiple commentaries per content block.

---

## Prerequisites

### 1. Install Directus

```bash
# Using npm
npx create-directus-project my-encyclopedia

# Or using Docker
docker run -d \
  -p 8055:8055 \
  -e DB_CLIENT=postgres \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_DATABASE=encyclopedia \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e KEY=your-secret-key \
  -e SECRET=your-secret-key \
  directus/directus:latest
```

### 2. Initial Setup
- Navigate to `http://localhost:8055`
- Create your admin account
- Log in to the Directus dashboard

---

## Phase 1: Create Collections (Tables)

### **Important Directus Concepts:**
- **Collections** = Database tables
- **Fields** = Table columns
- **Relationships** = Foreign keys
- Directus auto-creates UUIDs for `id` fields
- Directus tracks `date_created` and `user_created` automatically

## Step-by-Step Collection Creation

### **Important Directus Concepts:**
- **Collections** = Database tables
- **Fields** = Table columns
- **Relationships** = Foreign keys
- Directus auto-creates UUIDs for `id` fields
- Directus tracks `date_created` and `user_created` automatically
- **NEW:** Layered commentary system allows multiple commentaries per content block

---

## Step-by-Step Collection Creation

### **1. Users Collection (Built-in)**

Directus comes with a `directus_users` system collection. We'll extend it:

**Settings → Data Model → System Collections → Directus Users**

Add custom fields:
1. Click **"Create Field"**
2. Add field: `role_extended`
   - Type: **Dropdown (Single)**
   - Options: `admin`, `editor`, `scholar`, `viewer`
   - Default: `viewer`
3. Add field: `is_active`
   - Type: **Boolean**
   - Default: `true`

> **Note:** Use `directus_users` for the `created_by`, `verified_by`, etc. foreign keys.

---

### **2. Authors Collection**

**Settings → Data Model → Create Collection**

**Collection Setup:**
- Collection Name: `authors`
- Primary Key Field: `id` (UUID, auto)
- ✅ Optional System Fields: Check all (adds timestamps automatically)

**Add Fields:**

| Field Name | Type | Interface | Options/Validation |
|------------|------|-----------|-------------------|
| `canonical_name` | String | Input | Required, Max: 255 |
| `birth_year` | Integer | Input | Optional |
| `death_year` | Integer | Input | Optional |
| `era` | Dropdown (Single) | Dropdown | Options: `rishonim`, `acharonim`, `contemporary` |
| `bio_summary` | Text | Textarea | Optional, WYSIWYG |

**After creation:**
- Settings → Data Model → `authors`
- **Advanced tab → Singleton:** No
- **Display Template:** `{{canonical_name}}`

---

### **3. Documents Collection**

**Create Collection:** `documents`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `title` | String | Input | Required, Max: 500 |
| `doc_type` | Dropdown | Dropdown | Options: `entry`, `sefer` |
| `original_lang` | Dropdown | Dropdown | Options: `en`, `he`, `ar`, etc. (ISO 639-1) |
| `status` | Dropdown | Dropdown | Options: `draft`, `reviewed`, `published`, `archived`. Default: `draft` |
| `has_ocr` | Boolean | Toggle | Default: `false` |
| `ocr_confidence` | Decimal | Input | Min: 0, Max: 1, Precision: 2 |
| `page_count` | Integer | Input | Optional |
| `source_format` | Dropdown | Dropdown | Options: `pdf`, `html`, `docx`, `manual_entry` |
| `metadata` | JSON | JSON | Optional |
| `published_at` | DateTime | Datetime | Optional |
| `topic` | 
| `parent_id` | M2O | Tree View | Self-reference to `documents` |

**Relationships:**
1. Field: `created_by`
   - Type: **Many to One (M2O)**
   - Related Collection: `directus_users`
   - Display template: `{{first_name}} {{last_name}}`

2. Field: `parent_id`
   - Type: **Many to One (M2O)**
   - Related Collection: `documents`
   - Display template: `{{title}}`
   - On Delete: **SET NULL** (or CASCADE depending on preference)

**Display Template:** `{{title}} ({{doc_type}})`

---

### **4. Content Blocks Collection** **[NEW - replaces paragraphs]**

**Create Collection:** `content_blocks`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `document_id` | Integer | Many-to-One | Related: `documents`, Display: `{{title}}` |
| `block_type` | Dropdown | Dropdown | Options: `heading`, `subheading`, `paragraph`, `section_break` |
| `order_key` | String | Input | Required, Max: 50 |
| `content` | Text | Textarea (WYSIWYG) | Required |
| `status` | Dropdown | Dropdown | `draft`, `reviewed`, `published` |
| `metadata` | JSON | JSON | Optional |

**Relationships:**
1. Field: `document_id`
   - Type: **Many to One (M2O)**
   - Related Collection: `documents`
   - Display: `{{title}}`
   - On Delete: **CASCADE**

**Display Template:** `{{block_type}}: {{content}} ({{order_key}})`

---

### **5. Block Commentaries Collection** **[NEW - layered commentary system]**

**Create Collection:** `block_commentaries`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `block_id` | Integer | Many-to-One | Related: `content_blocks`, Display: `{{content}}` |
| `commentary_text` | Text | Textarea (WYSIWYG) | Required |
| `author` | String/Integer | Input/Many-to-One | Can be text or foreign key to `authors` |
| `source` | String | Input | Max: 500 |
| `commentary_type` | Dropdown | Dropdown | Options: `commentary`, `translation`, `cross_reference`, `explanation` |
| `language` | Dropdown | Dropdown | ISO codes |
| `order_position` | Integer | Input | Optional, for display ordering |
| `is_official` | Boolean | Toggle | Default: `false` |
| `quality_score` | Decimal | Slider | Min: 0, Max: 1, Step: 0.01 |
| `moderation_status` | Dropdown | Dropdown | `pending`, `approved`, `rejected`, `flagged` |
| `reviewed_at` | DateTime | Datetime | Optional |
| `rejection_reason` | Text | Textarea | Optional |

**Relationships:**
1. Field: `block_id`
   - Type: **Many to One (M2O)**
   - Related Collection: `content_blocks`
   - On Delete: **CASCADE**

2. Field: `reviewed_by`
   - Type: **Many to One (M2O)**
   - Related Collection: `directus_users`
   - On Delete: **SET NULL**

**Display Template:** `{{commentary_type}}: {{commentary_text}}`

---

### **6. Statements Collection** **[UPDATED]**

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `order_key` | String | Input | Required, Max: 50 |
| `original_lang` | Dropdown | Dropdown | ISO codes |
| `text` | Text | Textarea | Required |
| `appended_text` | Text | Textarea (WYSIWYG) | Optional - for footnotes and additional content |
| `is_deleted` | Boolean | Toggle | Default: `false` |
| `status` | Dropdown | Dropdown | `draft`, `reviewed`, `published` |
| `is_disputed` | Boolean | Toggle | Default: `false` |
| `importance_score` | Decimal | Slider | Min: 0, Max: 1, Step: 0.01 |
| `metadata` | JSON | JSON | Optional |
| `deleted_at` | DateTime | Datetime | Optional |

**Relationships:**
1. Field: `block_id` **[CHANGED from paragraph_id]**
   - Type: **M2O**
   - Related: `content_blocks` **[CHANGED from paragraphs]**
   - On Delete: **CASCADE**

2. Field: `deleted_by`
   - Type: **M2O**
   - Related: `directus_users`
   - On Delete: **SET NULL**

**Display Template:** `{{text}} ({{status}})`

---

### **6. Sources Collection**

**Create Collection:** `sources`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `title` | String | Input | Required, Max: 500 |
| `original_lang` | Dropdown | Dropdown | ISO codes |
| `publication_year` | Integer | Input | Optional |
| `publisher` | String | Input | Max: 255 |
| `isbn` | String | Input | Max: 20 |
| `is_external` | Boolean | Toggle | Default: `false` |
| `external_system` | Dropdown | Dropdown | Options: `sefaria`, `wikisource`, `hebrewbooks` |
| `external_id` | String | Input | Max: 255 |
| `external_url` | String | Input (URL) | Optional |
| `citation_text` | Text | Textarea | Optional |
| `metadata` | JSON | JSON | Optional |

**Relationships:**
1. Field: `author_id`
   - Type: **M2O**
   - Related: `authors`
   - On Delete: **SET NULL**

**Display Template:** `{{title}} ({{publication_year}})`

---

### **7. Source Links Collection**

**Create Collection:** `source_links`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `relationship_type` | Dropdown | Dropdown | `quotes`, `paraphrases`, `references`, `supports`, `contradicts`, `refutes`, `discusses`, `alludes_to` |
| `page_number` | String | Input | Max: 20 |
| `verse_reference` | String | Input | Max: 100 |
| `section_reference` | String | Input | Max: 255 |
| `confidence_level` | Dropdown | Dropdown | `low`, `medium`, `high`, `verified`. Default: `medium` |
| `notes` | Text | Textarea | Optional |
| `verified_at` | DateTime | Datetime | Optional |

**Relationships:**
1. Field: `statement_id`
   - Type: **M2O**
   - Related: `statements`
   - On Delete: **CASCADE**

2. Field: `source_id`
   - Type: **M2O**
   - Related: `sources`
   - On Delete: **CASCADE**

3. Field: `verified_by`
   - Type: **M2O**
   - Related: `directus_users`
   - On Delete: **SET NULL**

4. Field: `created_by`
   - Type: **M2O**
   - Related: `directus_users`
   - On Delete: **RESTRICT**

---

### **8. Topics Collection**

**Create Collection:** `topics`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `canonical_title` | String | Input | Required, Max: 500 |
| `canonical_title_en` | String | Input | Optional, Max: 500 - English translation of Hebrew term |
| `canonical_title_transliteration` | String | Input | Optional, Max: 500 - Phonetic transliteration (e.g., "Tzadik") |
| `original_lang` | Dropdown | Dropdown | ISO codes |
| `slug` | String | Input (Slug) | Required, Unique, Max: 500 |
| `topic_type` | Dropdown | Dropdown | `person`, `concept`, `place`, `event`, `mitzvah`, `sefirah` |
| `description` | Text | Textarea (WYSIWYG) | Optional - Hebrew description |
| `description_en` | Text | Textarea (WYSIWYG) | Optional - English translation of description |
| `metadata` | JSON | JSON | Optional |

**Display Logic Priority:**
1. `canonical_title_en` (English translation) - Most accessible
2. `canonical_title_transliteration` (Transliteration) - Preserves Hebrew authenticity  
3. `canonical_title` (Hebrew original) - Always available fallback

**Display Template:** `{{canonical_title_en || canonical_title_transliteration || canonical_title}}`

---

### **9. Topic Relationships Collection**

**Create Collection:** `topic_relationships`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `relation_type` | Dropdown | Dropdown | `subcategory`, `instance_of`, `part_of`, `related_to`, `sefirah_hierarchy`, `chronological`, `conceptual_parent` |
| `strength` | Decimal | Slider | Min: 0, Max: 1, Default: 1.00 |
| `display_order` | Integer | Input | Optional |
| `description` | Text | Textarea | Optional |

**Relationships:**
1. Field: `parent_topic_id`
   - Type: **M2O**
   - Related: `topics`
   - Display: `{{canonical_title}}`
   - On Delete: **CASCADE**

2. Field: `child_topic_id`
   - Type: **M2O**
   - Related: `topics`
   - Display: `{{canonical_title}}`
   - On Delete: **CASCADE**

3. Field: `created_by`
   - Type: **M2O**
   - Related: `directus_users`

---

### **10. Statement Topics Collection (Junction)**

**Create Collection:** `statement_topics`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `relevance_score` | Decimal | Slider | Min: 0, Max: 1, Default: 1.00 |
| `is_primary` | Boolean | Toggle | Default: `false` |
| `notes` | Text | Textarea | Optional |
| `tagged_at` | DateTime | Datetime | Auto-set on create |

**Relationships:**
1. Field: `statement_id`
   - Type: **M2O**
   - Related: `statements`
   - On Delete: **CASCADE**

2. Field: `topic_id`
   - Type: **M2O**
   - Related: `topics`
   - On Delete: **CASCADE**

3. Field: `tagged_by`
   - Type: **M2O**
   - Related: `directus_users`

---

### **11. Translations Collection**

**Create Collection:** `translations`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `entity_type` | Dropdown | Dropdown | `document`, `paragraph`, `statement`, `topic`, `author`, `source` |
| `entity_id` | UUID | Input (UUID) | Required |
| `field_name` | String | Input | Required, Max: 50 |
| `target_lang` | Dropdown | Dropdown | ISO codes |
| `translated_text` | Text | Textarea | Required |
| `translation_quality` | Dropdown | Dropdown | `unverified`, `machine`, `human_draft`, `human_verified`, `professional`. Default: `unverified` |
| `metadata` | JSON | JSON | Optional |
| `translated_at` | DateTime | Datetime | Auto |
| `verified_at` | DateTime | Datetime | Optional |

**Relationships:**
1. Field: `translated_by`
   - Type: **M2O**
   - Related: `directus_users`
   - On Delete: **SET NULL**

2. Field: `verified_by`
   - Type: **M2O**
   - Related: `directus_users`
   - On Delete: **SET NULL**

**Note:** In Directus, you cannot create FK constraints across multiple collections for `entity_id`. This must be validated in application logic.

---

### **12. Version Collections**

#### **A. Document Versions**

**Create Collection:** `document_versions`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `version_number` | Integer | Input | Required |
| `title` | String | Input | Max: 500 |
| `doc_type` | Dropdown | Dropdown | `entry`, `sefer` |
| `original_lang` | Dropdown | Dropdown | ISO codes |
| `status` | Dropdown | Dropdown | Status options |
| `metadata` | JSON | JSON | Snapshot |
| `change_type` | String | Input | Max: 50 |
| `change_summary` | Text | Textarea | Optional |
| `justification` | Text | Textarea | Optional |
| `approval_status` | Dropdown | Dropdown | `pending`, `approved`, `rejected` |
| `approved_at` | DateTime | Datetime | Optional |
| `rejection_reason` | Text | Textarea | Optional |

**Relationships:**
1. `document_id` → `documents` (M2O, CASCADE)
2. `approved_by` → `directus_users` (M2O, SET NULL)
3. `created_by` → `directus_users` (M2O, RESTRICT)

#### **B. Paragraph Versions**

Repeat same structure as document_versions, but:
- Field: `paragraph_id` → `paragraphs`
- Field: `text` (Text) for snapshot
- Field: `order_key` (String)

#### **C. Statement Versions**

Same structure, but:
- Field: `statement_id` → `statements`
- Field: `text` (Text)
- Field: `order_key` (String)
- Field: `is_deleted` (Boolean)
- Field: `related_statement_ids` (JSON array)

---

### **13. Comments Collection**

**Create Collection:** `comments`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `text` | Text | Textarea (WYSIWYG) | Required |
| `status` | Dropdown | Dropdown | `open`, `resolved`, `archived`, `deleted` |
| `thread_depth` | Integer | Input | Default: 0, Min: 0, Max: 9 |
| `version_type` | Dropdown | Dropdown | `document`, `paragraph`, `statement` |
| `version_id` | UUID | Input | Optional |
| `resolved_at` | DateTime | Datetime | Optional |

**Relationships:**
1. `statement_id` → `statements` (M2O, CASCADE)
2. `parent_comment_id` → `comments` (M2O, CASCADE) - **Self-reference**
3. `created_by` → `directus_users` (M2O, RESTRICT)
4. `resolved_by` → `directus_users` (M2O, SET NULL)

**Self-Reference Setup:**
- When creating `parent_comment_id` field:
  - Type: **M2O**
  - Related Collection: `comments` (same collection)
  - Display: `{{text}}`

---

### **14. Audit Log Collection**

**Create Collection:** `audit_log`

**Add Fields:**

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `action_timestamp` | DateTime | Datetime | Auto, indexed |
| `action_type` | String | Input | Max: 50 |
| `entity_type` | String | Input | Max: 30 |
| `entity_id` | UUID | Input | Required |
| `changes` | JSON | JSON | Before/after |
| `ip_address` | String | Input | Max: 45 (IPv6) |
| `user_agent` | Text | Textarea | Optional |
| `session_id` | UUID | Input | Optional |
| `request_id` | UUID | Input | Optional |

**Relationships:**
1. `user_id` → `directus_users` (M2O, RESTRICT)

---

## Phase 2: Configure Relationships in Reverse

Directus automatically creates reverse relationships (O2M - One to Many). Configure display:

### Example: Documents → Content Blocks **[UPDATED]**

1. Go to **Documents collection**
2. Click **Create Field in Advanced**
3. Type: **One to Many (O2M)**
4. Related Collection: `content_blocks`
5. Foreign Key Field: `document_id`
6. Display: `{{block_type}}: {{order_key}}`
7. Interface: **List (with inline editing)**

### Example: Content Blocks → Block Commentaries **[NEW]**

1. Go to **Content Blocks collection**
2. Click **Create Field in Advanced**
3. Type: **One to Many (O2M)**
4. Related Collection: `block_commentaries`
5. Foreign Key Field: `block_id`
6. Display: `{{commentary_type}}: {{author}}`
7. Interface: **List (with inline editing)**

Repeat for:
- `content_blocks` → `statements` (O2M) **[UPDATED from paragraphs]**
- `statements` → `source_links` (O2M)
- `statements` → `statement_topics` (O2M)
- `topics` → `statement_topics` (O2M)
- `topics` → `topic_relationships` as parent (O2M)
- `topics` → `topic_relationships` as child (O2M)
- `statements` → `comments` (O2M)
- `comments` → `comments` as replies (O2M)

---

## Phase 3: Set Permissions & Access Control

**Settings → Access Control**

### Create Roles:

#### **1. Admin Role**
- Full CRUD on all collections
- Can approve versions
- Can manage users

### **4. Editor Role**
- Full CRUD on: `documents`, `content_blocks`, `statements`, `topics` **[UPDATED - replaced paragraphs]**
- Create: `block_commentaries` (pending moderation) **[NEW]**
- Read-only: `authors`, `sources`
- Create: `comments`, `translations`, `source_links`
- Cannot: Approve commentaries, manage users **[UPDATED]**

### **5. Scholar Role**
- Create/Read/Update: `statements`, `comments`, `source_links`, `translations`
- Read: `content_blocks`, `block_commentaries` (approved only) **[UPDATED]**
- Read-only: Everything else
- Cannot: Delete anything, change status to `published`

### **6. Commentator Role** **[NEW]**
- Create: `block_commentaries` (community contributions)
- Read: All content and approved commentaries
- Cannot: Edit existing content, moderate commentaries

**Per Collection Permissions:**

Example for `block_commentaries` collection: **[NEW]**

| Role | Create | Read | Update | Delete | Fields Access |
|------|--------|------|--------|--------|---------------|
| Admin | ✅ | ✅ All | ✅ All | ✅ | All fields |
| Editor | ✅ | ✅ All | ✅ Where `created_by = $CURRENT_USER` | ✅ Own items | All fields |
| Scholar | ✅ | ✅ Approved only | ❌ | ❌ | Read-only |
| Commentator | ✅ | ✅ Approved only | ✅ Own items | ✅ Own items | Limited fields |
| Viewer | ❌ | ✅ Approved only | ❌ | ❌ | All fields read-only |

---

## Phase 4: Advanced Configurations

### **1. Configure Display Templates**

For each collection, set the display template for better UX:

**Settings → Data Model → [Collection] → Display Template**

Examples:
```
documents: {{title}} ({{doc_type}})
content_blocks: {{block_type}}: {{order_key}} in {{document_id.title}}
block_commentaries: {{commentary_type}} by {{author}}
statements: {{text}} [{{status}}]
topics: {{canonical_title}} ({{topic_type}})
authors: {{canonical_name}} ({{era}})
```

### **2. Set Up Validation Rules**

**Field-level validation:**

1. Go to each field's settings
2. **Validation tab:**
   - `content_blocks.document_id`: Must exist in documents table
   - `content_blocks.block_type`: Must be one of ['heading', 'subheading', 'paragraph', 'section_break']
   - `block_commentaries.block_id`: Must exist in content_blocks table
   - `block_commentaries.quality_score`: Min: 0, Max: 1 **[NEW]**
   - `statements.block_id`: Must exist in content_blocks table **[UPDATED from paragraph_id]**
   - `canonical_name` in authors: Required, Regex: `^[^0-9]+$` (no numbers)
   - `slug` in topics: Required, Unique, Regex: `^[a-z0-9-]+$` (URL-safe)
   - `email` in users: Email format
   - `ocr_confidence`: Min: 0, Max: 1
   - `importance_score`: Min: 0, Max: 1
   - `relevance_score`: Min: 0, Max: 1

### **3. Configure Interfaces**

Optimize data entry with better interfaces:

- **`content` fields in content_blocks:** Use **WYSIWYG (Rich Text Editor)** with Hebrew support **[UPDATED]**
- **`commentary_text` fields in block_commentaries:** Use **WYSIWYG (Rich Text Editor)** with Hebrew support **[NEW]**
- **`metadata` fields:** Use **JSON editor** with syntax highlighting
- **`order_key` fields:** Use **Input** with placeholder: `0|hzzzzz:`
- **`status` fields:** Use **Dropdown** with color-coding
- **`quality_score`:** Use **Slider** (0-1, step 0.01) **[NEW]**
- **`block_type`:** Use **Dropdown** with icons for different content types **[NEW]**

### **4. Set Up Presets (Default Values)**

**Settings → Presets**

Create presets for common tasks:

**Example: "New Encyclopedia Entry"**
- Collection: `documents`
- Preset values:
  - `doc_type`: `entry`
  - `status`: `draft`
  - `original_lang`: `en`
  - `created_by`: `$CURRENT_USER`
  - 'topic': 'topic_id'

### **5. Configure Search & Filters**

**Per collection:**

1. Settings → Data Model → [Collection]
2. **Advanced tab → Search Fields:** Add `title`, `text`, `canonical_title`, etc.
3. **Advanced tab → Filter Fields:** Add `status`, `doc_type`, `is_deleted`, `original_lang`

### **6. Set Up Workflows (Flows)**

Directus Flows can automate version creation:

**Settings → Flows → Create Flow**

**Example: Auto-create statement version on update**

1. **Trigger:** Event Hook
   - Collection: `statements`
   - Action: `items.update`

2. **Operation 1:** Read Data
   - Collection: `statement_versions`
   - Query: Get max version_number for this statement

3. **Operation 2:** Create Item
   - Collection: `statement_versions`
   - Data:
     ```json
     {
       "statement_id": "{{$trigger.key}}",
       "version_number": "{{$last.version_number + 1}}",
       "text": "{{$trigger.payload.text}}",
       "change_type": "text_edited",
       "created_by": "{{$accountability.user}}"
     }
     ```

---

## Phase 5: Custom Extensions (Optional)

### **1. Custom Interface for LexoRank Ordering**

Create a custom interface that automatically generates `order_key` values:

```bash
# In your Directus project
cd extensions
npx create-directus-extension@latest
# Choose: interface
# Name: lexorank-input
```

### **2. Custom Endpoint for Translation API**

Create custom endpoint to fetch translations:

```javascript
// extensions/endpoints/translations/index.js
export default (router, { services, exceptions }) => {
  const { ItemsService } = services;
  
  router.get('/:entity_type/:entity_id/:lang', async (req, res) => {
    const { entity_type, entity_id, lang } = req.params;
    
    const translationsService = new ItemsService('translations', {
      schema: req.schema,
      accountability: req.accountability
    });
    
    const translations = await translationsService.readByQuery({
      filter: { entity_type, entity_id, target_lang: lang },
      fields: ['field_name', 'translated_text']
    });
    
    res.json(translations);
  });
};
```

### **3. Custom Hook for Audit Logging**

Auto-log all changes:

```javascript
// extensions/hooks/audit-logger/index.js
export default ({ action }, { services, exceptions }) => {
  const { ItemsService } = services;
  
  action('items.update', async (input, { accountability, schema }) => {
    const auditService = new ItemsService('audit_log', {
      schema, accountability
    });
    
    await auditService.createOne({
      user_id: accountability.user,
      action_type: 'update',
      entity_type: input.collection,
      entity_id: input.keys[0],
      changes: input.payload,
      action_timestamp: new Date()
    });
  });
};
```

---

## Phase 6: Testing & Optimization

### **1. Create Test Data**

Use Directus API or interface to create:
- 2-3 test documents
- 5-10 paragraphs per document
- 10-20 statements per paragraph
- Link statements to sources
- Tag statements with topics
- Add translations

### **2. Performance Testing**

Monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;
```

### **3. Create Indexes via Raw SQL**

Directus doesn't expose full index control. Run via database client:

```sql
-- Example: Create composite index for translation lookups
CREATE INDEX idx_translations_lookup 
ON translations(entity_type, entity_id, field_name, target_lang);

-- Full-text search
CREATE INDEX idx_statements_text_fts 
ON statements USING gin(to_tsvector('english', text));
```

---

## Phase 7: Frontend Integration

### **Access Directus Data:**

```javascript
// Using Directus SDK
import { createDirectus, rest, readItems } from '@directus/sdk';

const client = createDirectus('http://localhost:8055').with(rest());

// Get statements with translations
const statements = await client.request(
  readItems('statements', {
    filter: { is_deleted: { _eq: false } },
    fields: ['*', 'translations.*'],
    limit: 100
  })
);

// Get full document hierarchy
const document = await client.request(
  readItems('documents', {
    filter: { id: { _eq: 'document-uuid' } },
    fields: [
      '*',
      'paragraphs.id',
      'paragraphs.text',
      'paragraphs.statements.id',
      'paragraphs.statements.text',
      'paragraphs.statements.source_links.source_id.*'
    ]
  })
);
```

---

## Common Issues & Solutions

### **Issue 1: UUID Foreign Keys Not Validating**
**Solution:** Use Directus Flows to validate entity_id references in translations table.

### **Issue 2: LexoRank Generation**
**Solution:** Use a custom interface extension or generate in application code before sending to Directus.

### **Issue 3: Circular Topic Hierarchy**
**Solution:** Implement validation in a Flow that checks for cycles before allowing relationship creation.

### **Issue 4: Version Triggers Not Firing**
**Solution:** Use Directus Flows instead of database triggers for better integration with Directus's permission system.

### **Issue 5: Performance with Deep Nesting**
**Solution:** Use GraphQL API instead of REST for complex nested queries.

---

## Final Checklist

- [ ] All collections created
- [ ] All fields added with correct types
- [ ] All relationships configured (M2O and O2M)
- [ ] Permissions set for all roles
- [ ] Display templates configured
- [ ] Validation rules set
- [ ] Search fields configured
- [ ] Indexes created (via SQL)
- [ ] Flows for auto-versioning created
- [ ] Test data loaded
- [ ] Frontend SDK integration tested
- [ ] Performance validated

---

## Next Steps

1. **Export Schema:** Settings → Data Model → Export Schema (for version control)
2. **Set Up Backups:** Configure automated database backups
3. **Monitor Performance:** Set up query logging and monitoring
4. **Document API:** Generate OpenAPI docs from Directus
5. **Build Frontend:** Use Directus SDK to build your application

Your database is now fully operational in Directus!

Statements vs Commentaries
Statements (Content Breakdown):
What: Logical subdivisions of content_blocks
Purpose: Break text into searchable claims/teachings
Example: Tanya paragraph → 3 statements (each claim)
Citation: appended_text shows sources the statement references
Relationships: Tagged with topics, linked to sources
Block Commentaries (Content Enhancement):
What: Explanations/translations layered on content_blocks
Purpose: Add insights without changing base text
Example: Tanya paragraph + Tzemach Tzedek commentary + translation
Citation: citation_source shows where commentary comes from
Relationships: Can cite other sources (rabbit hole following)
Key Differences:
Aspect	Statements	Commentaries
Granularity	Subdivides content_block	Enhances entire content_block
Citation Flow	Statement cites sources	Commentary cites its own sources
Display	Individual claims	Layered commentary view
Search	Core searchable units	Additional insights
Creation	AI/ML breaking	Manual/expert addition
Real Example:
Original Tanya Text (content_block):

"The tzaddik is defined as one who serves G-d with self-nullification"

Statements (breakdowns):

"The tzaddik serves G-d" (appended_text: "Tanya 1:1")
"Service is with self-nullification" (appended_text: "Tanya 1:2")
Block Commentaries (enhancements):

Type: commentary - "Alter Rebbe explains this means complete submission"
Type: translation - "The righteous one is defined as..."
Citation: Commentary from "Likkutei Sichos, Vol 2, p. 45"
Bottom Line: Statements break down text for search/analysis, commentaries enrich text with wisdom layers. Both enable citation chains, but serve different purposes in the learning journey.