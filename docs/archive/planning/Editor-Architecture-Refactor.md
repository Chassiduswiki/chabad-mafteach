# Editor 2.0: Architecture & Vision

## 1. Executive Summary
The goal is to transform the current prototype editor into a robust, "Power User" CMS for Jewish texts. This interface will allow scholars to draft content, manage complex citations, and structure hierarchical books (Seforim) without leaving the writing flow.

## 2. The "Smart Citation" Workflow
The core innovation is the seamless `@` citation flow.

### User Journey
1.  **Trigger**: User types `@` in the text.
2.  **Search & Discovery**:
    - A `CommandPalette` (like Spotlight/cmd+k) appears at the cursor.
    - User types "Tanya".
    - Results show existing Seforim/Authors.
3.  **Scenario A: Book Exists**
    - User selects "Tanya (Alter Rebbe)".
    - **Detail Popover** appears immediately (keyboard accessible):
        - **Reference**: Input for "Chapter 12, p. 30".
        - **Connection**: Dropdown for "Quotes", "Supports", "Discusses".
        - **Note**: Textarea for "See also footnote 2".
    - User hits Enter. Citation is inserted.
4.  **Scenario B: Book Does Not Exist**
    - User types "My New Sefer".
    - Menu offers: `+ Create "My New Sefer"`.
    - **Quick-Create Modal** appears (overlay):
        - **Title**: Prefilled.
        - **Author**: Search/Create Author combo box.
        - **Era/Category**: Simple dropdown.
    - User clicks "Create & Cite".
    - System creates the `source` record in the background and proceeds to the **Detail Popover**.

### Technical Requirements
- **Global Data Context**: We need a React Context `SourceContext` to cache commonly used sources to avoid network waterfalls.
- **Async Creation**: The "Create" step must be optimistic. We insert the citation immediately with a temporary ID while the backend POSTs to Directus.

## 3. Architecture Refactor
To support this complexity, we must clean up the current codebase.

### A. Component Decoupling
Currently, `ProseEditor.tsx` does too much. We will split it:

```
components/editor/
├── core/
│   ├── ProseEditor.tsx       # Pure wrapper around ProseMirror view
│   ├── EditorToolbar.tsx     # Bold, Italic, Undo/Redo
│   └── EditorMenu.tsx        # The floating bubble menu (optional)
├── plugins/
│   ├── citations/
│   │   ├── citation-node.ts  # Schema definition
│   │   ├── CitationChip.tsx  # The blue pill in the text
│   │   └── CitationPopup.tsx # The search/create UI
│   ├── formatting/
│   └── shortcuts.ts
└── providers/
    └── EditorContext.tsx     # Holds the EditorView instance and shared state
```

### B. State Management (The "Mess" Fix)
We will move logic out of `page.tsx`:
- **Hook**: `useEditorState(docId)`
  - Handles loading `useEditorDocument`.
  - Handles parsing Directus -> ProseMirror (`transformToProseMirror`).
  - Handles saving logic (`syncEditorContent`).
- **Hook**: `useCitationManager`
  - Handles searching sources.
  - Handles creating new sources.

### C. Data Synchronization Strategy
Instead of the current monolithic `syncEditorContent` function, we will adopt a granular approach using a "Store" pattern.
- **DocumentStore**: Tracks the state of the document.
- **Save Strategy**: 
  - **Auto-Save**: Runs every 30s.
  - **Manual Save**: User triggers.
  - **Dirty State Tracking**: We only send modified paragraphs.

## 4. UI/UX Layout Vision
The screen will be divided into three distinct zones:

### Zone 1: Navigation (Left)
- **Hierarchy Tree**: The `StructureSidebar` we built.
- **Action**: Drag-and-drop to reorder chapters (Future).

### Zone 2: The Workbench (Center)
- **Zen Mode**: Distraction-free writing.
- **Block Handles**: Hovering to the left of a paragraph shows a "Drag handle" (::) to reorder paragraphs or change their type (e.g., Header, Blockquote).

### Zone 3: Context Rail (Right)
- **Topic Tagger**: A list of "Suggested Topics" based on the content.
- **Citation Inspector**: When you click a Citation Chip, its details open here (instead of a popup), allowing deep editing of metadata.
- **Statement Properties**: Toggle "Is Disputed", set "Importance Score".

## 5. Implementation Roadmap

### Phase 1: The Great Refactor (Clean Slate)
1.  Extract `useEditorLogic` custom hook.
2.  Move schema definitions to dedicated domain files.
3.  Establish `EditorContext` to avoid prop drilling.

### Phase 2: Enhanced Citation Engine
1.  Build the `CommandPalette` UI component.
2.  Implement the "Quick Create Source" API endpoint or hook.
3.  Connect the UI to the API.

### Phase 3: Context Rail & Topics
1.  Build the Right Sidebar.
2.  Implement Topic Search & Tagging.

## 6. Schema Adjustments Required
- Ensure `sources` table has minimal required fields to lower friction for creation.
- Ensure `authors` can be created on-the-fly.

---
**Status**: Ready to start Phase 1.
