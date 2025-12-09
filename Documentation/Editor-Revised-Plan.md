# Editor Roadmap: A Pragmatic, Vertical-Slice Approach

This document outlines a revised, more cautious roadmap for developing the editor, incorporating critical feedback on complexity, scalability, and UX pitfalls. The core principle is to **ship a complete, robust feature first** before undertaking a large-scale refactor.

## Guiding Principles (Based on Feedback)

1.  **Feature First, Refactor Later**: Deliver the end-to-end citation workflow before refactoring the entire architecture.
2.  **Avoid Premature Optimization**: Solve for real performance issues as they arise, rather than building complex solutions (e.g., OT, custom state management) for problems we don't have yet.
3.  **Safety Over Optimism**: Avoid optimistic UI updates for critical creation steps to prevent data integrity issues. A slightly slower, more reliable UX is better than a fast, broken one.
4.  **Leverage Existing Libraries**: Use battle-tested libraries like `cmdk` and `Fuse.js` (both already in `package.json`) to handle complex UI patterns.

---

## Phase 1: The Citation Vertical Slice (End-to-End)

**Goal**: Implement the complete citation workflow, from typing `@` to saving a `source_link` in the database.

### Step 1.1: Command Palette UI (`cmdk`)
- **Action**: Replace the simple `CitationPicker` with a `cmdk`-based command palette.
- **Trigger**: The existing `suggestionPlugin` will be adapted to open the `cmdk` dialog.
- **Benefit**: `cmdk` handles keyboard navigation, filtering, and async loading states out of the box, solving focus management issues.

### Step 1.2: Fast, Debounced Search
- **Action**: Create a `useSourceSearch` hook.
- **Implementation**:
    - On initial load, fetch a list of all source titles.
    - Use `Fuse.js` for instant client-side filtering as the user types.
    - After a 300ms debounce, trigger a network search to catch sources not in the initial list.
- **Benefit**: Solves the search performance risk, providing an instant-feeling UI.

### Step 1.3: Inline Creation Flow (Flattened UX)
- **Action**: Implement the "Create Source" flow directly within the `cmdk` palette.
- **Workflow**:
    1.  User types a source that doesn't exist.
    2.  The top `cmdk` item becomes: `+ Create source "My New Book"`.
    3.  User selects it.
    4.  The `cmdk` dialog's content morphs into a minimal form: `[Title]`, `[Author (search/create)]`.
- **Benefit**: Flattens the UI, avoiding the "modal-on-modal" tab-trap nightmare.

### Step 1.4: Safe Async Creation (No Optimistic UI)
- **Action**: When the user clicks "Create & Cite" in the creation form:
    1.  Show a loading state **within the palette**.
    2.  POST to the `authors` and/or `sources` collections in Directus.
    3.  **Only after a successful response**, close the palette and insert the citation node into ProseMirror with the *real* ID.
- **Benefit**: This completely avoids the risk of "phantom" citations with temporary IDs that fail to resolve.

### Step 1.5: Manual Save Only (No Auto-Save)
- **Action**: We will stick with the existing manual "Save Changes" button.
- **Benefit**: This sidesteps all race conditions and conflict resolution problems associated with auto-save for now.

---

## Phase 2: Incremental Refactor & UX Polish

**Goal**: With the citation feature shipped, we can now safely clean up the codebase.

### Step 2.1: Extract Citation Plugin
- **Action**: Move the citation-related logic (the `cmdk` palette, the suggestion trigger, the node insertion logic) from `ProseEditor.tsx` into a self-contained ProseMirror plugin in `components/editor/plugins/citations/`.
- **Benefit**: Improves modularity and adheres to ProseMirror's intended architecture.

### Step 2.2: Extract `useEditor` Hook
- **Action**: Consolidate the data-fetching, state management, and save logic from `app/editor/page.tsx` into a single `useEditor(docId)` custom hook.
- **Benefit**: Makes the page component cleaner and isolates the editor's core logic.

---

## Phase 3: Advanced Features (Future Work)

- **Author Disambiguation**: When creating an author, use fuzzy matching (`Fuse.js`) on existing authors to show a "Did you mean...?" prompt, mitigating the duplicate data risk.
- **Contextual Editing**: Re-evaluate the "Context Rail". A better approach may be to make the citation chips themselves clickable, opening a small `Popover` for quick edits (e.g., changing the page number).
- **Collaboration**: Acknowledge that this requires a significant architectural shift to Operational Transformation (OT) or CRDTs and is a major project for the future.

---

This revised plan is more resilient and focuses on delivering user value incrementally. I am ready to begin **Phase 1, Step 1.1: Integrating `cmdk`**.
