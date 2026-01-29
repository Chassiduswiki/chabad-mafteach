# Editor Interface Plan for Jewish Encyclopedia & Seforim

## 1. Overview
The goal is to build a specialized, user-friendly "Admin/Editor" interface within the Next.js application. This interface will allow authorized users (Editors, Scholars) to input and manage complex hierarchical data (Seforim, Entries, Authors, Citations) without interacting directly with the raw Directus dashboard.

## 2. Core User Experience (UX)

### A. The Dashboard (`/editor`)
- **Greeting**: "Welcome back, [User]"
- **My Drafts**: List of items the user is currently working on (filtered by `created_by` or `assigned_to`).
- **Quick Actions**:
  - "Create New Entry" (Encyclopedia Article)
  - "Add New Sefer" (Book)
  - "Continue Recent Work"

### B. The Structure Builder (Sefer/Entry Setup)
- **Metadata Form**: Title, Author (with lookup/create), Language, Era.
- **Hierarchy Manager**:
  - Visual tree view to manage the structure of a Sefer.
  - **Proposed Schema Change**: Enable nesting in `documents` (e.g., Book -> Shaar -> Perek) or explicit `sections` collection.
  - Drag-and-drop reordering.

### C. The Content Editor (The Workspace)
- **Split-Screen / Focus Mode**:
  - **Center**: Rich Text Editor (The content).
  - **Left**: Navigation (Chapter/Section tree).
  - **Right**: Inspector/Tools (Metadata, Citations, Topics).
- **Block-Based Editing**:
  - The text is not just a blob. It is structured.
  - **Visual Paragraphs**: Correspond to `paragraphs` collection.
  - **Sentence/Statement Awareness**: Ability to highlight text and convert it into a "Statement" entity for granular citation/analysis.

## 3. Technical Architecture

### A. Routing
```
/editor                     (Dashboard)
/editor/books/new           (Wizard for new Book)
/editor/entries/new         (Wizard for new Entry)
/editor/workspace/[id]      (Main Editor for a Document)
```

### B. The Editor Engine
**Core Library**: **ProseMirror** (The underlying engine of Tiptap).
- **Why?** 
  - Complete control over the editing experience.
  - Zero cost (MIT License).
  - "What Tiptap is based off of" - direct access to the metal.
- **Architecture**:
  - **Schema**: Define custom nodes (`paragraph`, `citation`, `topic_tag`) in a `schema.ts`.
  - **State Management**: `EditorState` holds the document and selection.
  - **View**: `EditorView` renders the state to the DOM.
  - **React Integration**: A wrapper component (`ProseEditor`) that manages the lifecycle of the `EditorView`.
- **Custom Nodes Needed**:
  - `paragraph`: Maps to a `paragraph` record. ID stored in attributes.
  - `citation`: Inline node for references. Stores `source_id` and `page_number`.
  - `topic_tag`: Inline node for `topics`.

### C. Data Synchronization (The "Hard Part")
- **Frontend State**: Use `TanStack Query` (React Query) to manage server state.
- **Auto-Save**: Debounced hooks to save changes to Directus to prevent data loss.
- **ID Matching**:
  - When a user types a new paragraph, generate a temporary ID.
  - On save, POST to `paragraphs`, get real ID, update local state.
  - Ideally, keep a local "Draft" structure in memory/local storage until explicit save, or use "Draft" status in Directus.

## 4. Feature Breakdown

### Phase 1: Authentication & Dashboard
- Protect `/editor` routes with a Higher-Order Component or Middleware checking `role_extended` (admin/editor/scholar).
- Create the Dashboard UI listing `documents` where `created_by` is current user.

### Phase 2: Author Management
- **Inline Creator**: When adding a book, if the author doesn't exist, pop up a modal.
- **Fields**: Canonical Name, Era, Bio.
- **Directus Interaction**: `POST /items/authors`.

### Phase 3: The "Sefer" Structure (Recursive Documents)
- **Schema Update**: We need to ensure `documents` can be nested.
  - Add `parent_id` (M2O to `documents`) to the `documents` collection.
- **UI**: A recursive tree component (like a file explorer) to create "Parts", "Chapters".
- **Action**: "Add Chapter" -> Creates a new `document` with `parent_id` set to the Book's ID.

### Phase 4: The Paragraph/Statement Editor
- **Input**: A clean writing surface.
- **Parsing**:
  - Detect "Enter" key -> Create new Paragraph.
  - Detect "Period" (optional setting) -> Delineate Statements.
- **Citations**:
  - Trigger: User types `@` or clicks "Cite".
  - UI: Popover to search `sources` collection.
  - Action: Select Source -> Enter Page/Verse -> Create `source_links` record linked to the current Statement/Paragraph.

### Phase 5: Topics & Metadata
- **Inspector Panel**: Context-aware sidebar.
- If cursor is in a Paragraph -> Show Paragraph Metadata.
- If cursor is on a Citation -> Show Citation details.
- **Topic Tagger**: Multi-select dropdown to tag the current statement with `topics` (Updates `statement_topics`).

## 5. Proposed Roadmap for Implementation

1.  **Setup**:
    - Verify `directus_users` has roles setup.
    - Add `parent_id` to `documents` schema (if missing).
    - Install `prosemirror-*` dependencies.
2.  **Prototype the Editor**:
    - Create `schema.ts` to define our data model.
    - Create a React wrapper for ProseMirror.
    - Connect it to load `paragraphs` from a hardcoded Document ID.
    - Implement "Save" to update `paragraphs` text.
3.  **Build the Dashboard**:
    - List view of Documents.
    - Create "New Document" wizard.
4.  **Implement Complexity**:
    - Add Citation functionality (Search Sources -> Insert Link).
    - Add Topic Tagging.
