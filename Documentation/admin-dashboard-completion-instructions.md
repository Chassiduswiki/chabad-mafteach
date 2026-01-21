# Admin Dashboard Completion Instructions

## Context

We've built a unified sources architecture where:
- **Single data source**: `source_links` table stores both topic-level bibliography and statement-level citations
- **Two UI patterns**: 
  - 📚 General Bibliography (topic-level, `statement_id` is null)
  - 📖 Inline Citations (statement-level, `statement_id` has value)
- **Bidirectional integration**: Topics ↔ Books ↔ Authors

## What's Already Complete

✅ Unified `source_links` table with `topic_id` field
✅ API routes updated (`/api/topics/[slug]/sources`)
✅ Dashboard list pages (`/admin/books`, `/admin/authors`)
✅ API routes for authors CRUD (`/api/authors`, `/api/authors/[id]`)
✅ Frontend displays both bibliography and inline citations

## What Needs to Be Built

### 1. Book Detail Page (`/admin/books/[id]/page.tsx`)

**Purpose**: Edit individual book metadata and manage author relationship

**Features**:
- Display and edit book fields:
  - Title (required)
  - Author (select from dropdown OR create new)
  - Publication year
  - Publisher
  - ISBN
  - External system (Sefaria, HebrewBooks, Wikisource)
  - External URL
  - Original language (Hebrew/English)
  - Citation text
- **Bidirectional linking**: 
  - Dropdown to select existing author
  - Button to "Create New Author" (opens modal, auto-links on save)
- Show all topics that reference this book
- Show all statements that cite this book
- Delete book (with confirmation)

**API Endpoint Needed**: 
```typescript
// GET /api/sources/[id]
// Returns book with expanded author_id relation
// Also returns: topics using this book, statements citing this book

// PATCH /api/sources/[id]
// Updates book metadata including author_id

// DELETE /api/sources/[id]
// Deletes book (cascade deletes source_links)
```

**Key Implementation Details**:
```typescript
// Fetch book with relations
const book = await directus.request(readItems('sources', {
  filter: { id: { _eq: bookId } },
  fields: [
    '*',
    { author_id: ['id', 'canonical_name', 'birth_year', 'death_year'] }
  ]
}));

// Fetch topics using this book (via source_links)
const topicLinks = await directus.request(readItems('source_links', {
  filter: { 
    _and: [
      { source_id: { _eq: bookId } },
      { statement_id: { _null: true } }
    ]
  },
  fields: [{ topic_id: ['id', 'canonical_title', 'slug'] }]
}));

// Fetch statements citing this book
const citationLinks = await directus.request(readItems('source_links', {
  filter: { 
    _and: [
      { source_id: { _eq: bookId } },
      { statement_id: { _nnull: true } }
    ]
  },
  fields: [{ statement_id: ['id', 'text'] }]
}));
```

---

### 2. Author Detail Page (`/admin/authors/[id]/page.tsx`)

**Purpose**: Edit author biography and manage their books

**Features**:
- Display and edit author fields:
  - Canonical name (required)
  - Birth year
  - Death year
  - Era (Rishonim, Acharonim, Contemporary)
  - Bio summary (textarea)
- **Bidirectional linking**:
  - List all books by this author
  - Button to "Add New Book" (opens modal, auto-sets author_id)
  - Each book has "Edit" and "Unlink" buttons
- Delete author (with confirmation, only if no books linked)

**API Endpoint**: Already exists at `/api/authors/[id]`
- Returns author + books by this author

**Key Implementation Details**:
```typescript
// The API already fetches books by author
// On "Add New Book" click:
// 1. Open modal with book form
// 2. Pre-populate author_id with current author
// 3. POST to /api/sources with author_id set
// 4. Refresh books list
```

---

### 3. New Book Form (`/admin/books/new/page.tsx`)

**Purpose**: Create a new book

**Features**:
- Form with all book fields
- Author selection:
  - Dropdown of existing authors
  - OR "Create New Author" inline (shows name/year fields)
- External system selection (Sefaria/HebrewBooks/Wikisource)
- Auto-populate from Sefaria if URL provided
- Submit creates book and optionally creates author

**API Endpoint Needed**:
```typescript
// POST /api/sources
{
  title: string;
  author_id?: number; // If existing author selected
  author_name?: string; // If creating new author
  author_birth_year?: number;
  author_death_year?: number;
  publication_year?: number;
  publisher?: string;
  isbn?: string;
  external_system?: 'sefaria' | 'wikisource' | 'hebrewbooks';
  external_url?: string;
  original_lang?: 'he' | 'en';
}

// Logic:
// 1. If author_name provided, create author first
// 2. Create book with author_id
// 3. Return created book
```

---

### 4. New Author Form (`/admin/authors/new/page.tsx`)

**Purpose**: Create a new author

**Features**:
- Simple form:
  - Canonical name (required)
  - Birth year
  - Death year
  - Era (dropdown)
  - Bio summary (textarea)
- Submit creates author
- Redirect to author detail page

**API Endpoint**: Already exists at `POST /api/authors`

---

### 5. Update Sources API (`/api/sources/route.ts`)

**Add POST endpoint** for creating new books:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    title, 
    author_id, 
    author_name, 
    author_birth_year, 
    author_death_year,
    author_era,
    publication_year,
    publisher,
    isbn,
    external_system,
    external_url,
    original_lang
  } = body;

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  let finalAuthorId = author_id;

  // Create author if author_name provided
  if (author_name && !author_id) {
    const newAuthor = await directus.request(createItem('authors', {
      canonical_name: author_name,
      birth_year: author_birth_year || null,
      death_year: author_death_year || null,
      era: author_era || null
    }));
    finalAuthorId = newAuthor.id;
  }

  // Create book
  const book = await directus.request(createItem('sources', {
    title,
    author_id: finalAuthorId || null,
    publication_year: publication_year || null,
    publisher: publisher || null,
    isbn: isbn || null,
    external_system: external_system || null,
    external_url: external_url || null,
    original_lang: original_lang || null
  }));

  return NextResponse.json({ success: true, book });
}
```

**Add GET endpoint** for individual book:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // Get single book with relations
    const books = await directus.request(readItems('sources', {
      filter: { id: { _eq: parseInt(id) } },
      fields: [
        '*',
        { author_id: ['id', 'canonical_name', 'birth_year', 'death_year'] }
      ],
      limit: 1
    }));

    if (books.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get topics using this book
    const topicLinks = await directus.request(readItems('source_links', {
      filter: { 
        _and: [
          { source_id: { _eq: parseInt(id) } },
          { statement_id: { _null: true } }
        ]
      },
      fields: [{ topic_id: ['id', 'canonical_title', 'slug'] }]
    }));

    // Get citations
    const citationLinks = await directus.request(readItems('source_links', {
      filter: { 
        _and: [
          { source_id: { _eq: parseInt(id) } },
          { statement_id: { _nnull: true } }
        ]
      },
      fields: [
        'id',
        'section_reference',
        'page_number',
        { statement_id: ['id', 'text'] }
      ]
    }));

    return NextResponse.json({ 
      book: books[0], 
      topics: topicLinks.map(l => l.topic_id),
      citations: citationLinks
    });
  }

  // List all books (existing logic)
  // ...
}
```

---

## UI Component Patterns

### Author Selector with "Create New" Option

```typescript
const [showNewAuthorForm, setShowNewAuthorForm] = useState(false);
const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);

{showNewAuthorForm ? (
  <div className="space-y-3">
    <input placeholder="Author name" />
    <input type="number" placeholder="Birth year" />
    <input type="number" placeholder="Death year" />
    <button onClick={() => setShowNewAuthorForm(false)}>
      Select Existing Instead
    </button>
  </div>
) : (
  <div className="space-y-3">
    <select value={selectedAuthorId} onChange={...}>
      <option value="">Select author...</option>
      {authors.map(a => <option value={a.id}>{a.canonical_name}</option>)}
    </select>
    <button onClick={() => setShowNewAuthorForm(true)}>
      + Create New Author
    </button>
  </div>
)}
```

### Book List on Author Page with "Add Book" Button

```typescript
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <h3>Books by {author.canonical_name}</h3>
    <button onClick={() => setShowAddBookModal(true)}>
      + Add New Book
    </button>
  </div>
  
  {books.map(book => (
    <div key={book.id} className="flex justify-between">
      <span>{book.title} ({book.publication_year})</span>
      <div>
        <Link href={`/admin/books/${book.id}`}>Edit</Link>
        <button onClick={() => unlinkBook(book.id)}>Unlink</button>
      </div>
    </div>
  ))}
</div>

{/* Modal for adding new book */}
<Modal open={showAddBookModal}>
  <BookForm 
    prefilledAuthorId={author.id}
    onSuccess={() => {
      setShowAddBookModal(false);
      refreshBooks();
    }}
  />
</Modal>
```

---

## Testing Checklist

After implementation, test these flows:

### Flow 1: Create Author → Add Book
1. Go to `/admin/authors`
2. Click "Add New Author"
3. Fill in author details, submit
4. On author detail page, click "Add New Book"
5. Fill in book details (author pre-selected)
6. Submit, verify book appears in author's book list

### Flow 2: Create Book → Create Author Inline
1. Go to `/admin/books`
2. Click "Add New Book"
3. Click "Create New Author" instead of selecting existing
4. Fill in both author and book details
5. Submit, verify both created and linked

### Flow 3: Edit Book → Change Author
1. Go to existing book detail page
2. Change author dropdown to different author
3. Save, verify author updated
4. Check old author's page - book should be gone
5. Check new author's page - book should appear

### Flow 4: View Book Usage
1. Go to book detail page
2. Verify "Used in Topics" section shows all topics linking this book
3. Verify "Inline Citations" section shows all statements citing this book
4. Click topic link, verify it goes to topic page

---

## File Structure Summary

```
app/
├── admin/
│   ├── books/
│   │   ├── page.tsx (✅ exists - list view)
│   │   ├── new/
│   │   │   └── page.tsx (❌ create this - new book form)
│   │   └── [id]/
│   │       └── page.tsx (❌ create this - edit book)
│   └── authors/
│       ├── page.tsx (✅ exists - list view)
│       ├── new/
│       │   └── page.tsx (❌ create this - new author form)
│       └── [id]/
│           └── page.tsx (❌ create this - edit author + books)
├── api/
│   ├── sources/
│   │   ├── route.ts (❌ update - add POST/GET for individual)
│   │   └── [id]/
│   │       └── route.ts (❌ create - PATCH/DELETE individual book)
│   └── authors/
│       ├── route.ts (✅ exists)
│       └── [id]/
│           └── route.ts (✅ exists)
```

---

## Key Database Schema Reference

```sql
-- sources table
id: integer (PK)
title: string
author_id: integer (FK to authors.id)
publication_year: integer
publisher: string
isbn: string
external_system: enum('sefaria', 'wikisource', 'hebrewbooks')
external_url: string
original_lang: enum('he', 'en')
citation_text: text

-- authors table
id: integer (PK)
canonical_name: string
birth_year: integer
death_year: integer
era: enum('rishonim', 'acharonim', 'contemporary')
bio_summary: text

-- source_links table (unified)
id: integer (PK)
topic_id: integer (FK to topics.id) - for bibliography
statement_id: integer (FK to statements.id) - for citations
source_id: integer (FK to sources.id)
relationship_type: string
page_number: string
verse_reference: string
section_reference: string
notes: text

-- When statement_id is NULL → topic-level bibliography
-- When statement_id has value → statement-level citation
```

---

## Implementation Priority

1. **POST /api/sources** - Create new books (with inline author creation)
2. **GET /api/sources?id=X** - Get individual book with relations
3. **PATCH /api/sources/[id]** - Update book
4. **/admin/books/new** - New book form
5. **/admin/books/[id]** - Edit book page
6. **/admin/authors/new** - New author form
7. **/admin/authors/[id]** - Edit author page with books list

---

## Tips

- Reuse the `SourceLinker` component patterns for UI consistency
- Use the existing `Source` and `Author` TypeScript interfaces from `/lib/types/index.ts`
- Follow the existing modal patterns from `SourceViewerModal` for "Add Book" modals
- Use the same styling classes as the topic pages for consistency
- Add loading states and error handling for all API calls
- Include confirmation dialogs for delete operations

---

## Expected Outcome

After completion, users should be able to:
1. ✅ Browse all books and authors from dashboard
2. ✅ Create new books with existing or new authors
3. ✅ Create new authors and add books to them
4. ✅ Edit book metadata and change author
5. ✅ Edit author bio and manage their books
6. ✅ See which topics use each book
7. ✅ See which statements cite each book
8. ✅ Delete books/authors (with proper validation)

The system will be fully integrated: Topics ↔ Books ↔ Authors, all using the unified `source_links` architecture.
