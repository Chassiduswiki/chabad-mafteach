/**
 * TOPIC ARTICLE SYSTEM - WORKING IMPLEMENTATION
 * =============================================
 *
 * STATEMENT HIGHLIGHTING: WORKING - Statements are highlighted substrings within paragraphs!
 * Statements are substrings of paragraph text that get highlighted and made clickable.
 *
 * IMPLEMENTATION STATUS: FULLY FUNCTIONAL
 * - Statement text highlighting in paragraphs
 * - Clickable highlights showing citation modals
 * - HTML formatting preservation
 * - LTR/RTL text direction handling
 *
 * CORRECT UNDERSTANDING:
 * - Paragraphs contain the full narrative text (HTML)
 * - Statements are specific substrings within paragraph text that should be highlighted
 * - When clicked, highlighted statements show appended_text (citations/footnotes)
 * - Statements exist for both UI interaction and backend processing (topics, citations)
 *
 * EXAMPLE:
 * Paragraph HTML: "The complete&nbsp;<em>rasha</em>&nbsp;has sinned..."
 * Statement: "complete rasha"
 * Display: "The [🟡 highlighted] complete rasha [/🟡] has sinned..." (click shows citation)
 *
 * UI BEHAVIOR:
 * - Yellow highlighting (bg-yellow-200 hover:bg-yellow-300)
 * - Clickable spans with cursor-pointer styling
 * - Click opens modal showing appended_text citations
 * - Preserves all HTML formatting (italics, links, entities)
 *
 * TECHNICAL IMPLEMENTATION:
 * - HTML pattern matching: /complete&nbsp;<em>rasha<\/em>/gi
 * - Replaces with: <span class="statement-highlight" data-statement-id="...">
 * - Event delegation for click handling
 * - Modal displays citation content from appended_text field
 *
 * TEXT DIRECTION: WORKING - Automatic LTR/RTL detection
 * - Hebrew text (>10% Hebrew chars): RTL with right justification
 * - English text: LTR with left justification
 *
 * FUTURE CONSIDERATIONS - TEXT CHANGES:
 * ❓ How does highlighting work when paragraph text changes?
 * ❓ How to maintain statement positions during edits?
 * ❓ Integration with editor for cascading updates?
 *
 * POTENTIAL SOLUTIONS FOR TEXT CHANGES:
 *
 * 1. POSITION-BASED STATEMENTS (Most Robust):
 *    - Store character offsets: {start: 15, end: 29} for "complete rasha"
 *    - DOM Range API: Create ranges that survive HTML changes
 *    - XPath/CSS selectors: Store path to text nodes
 *    - Version diffs: Track changes and update positions
 *
 * 2. FUZZY MATCHING (Fallback):
 *    - Levenshtein distance matching for similar text
 *    - Semantic similarity for paraphrased content
 *    - Context-aware re-finding (surrounding words)
 *
 * 3. EDITOR INTEGRATION (Real-time Updates):
 *    - Rich text editor with statement overlays
 *    - Live highlighting during editing
 *    - Drag-to-select for creating statements
 *    - Visual feedback for orphaned statements
 *
 * 4. VERSION CONTROL (Cascade Management):
 *    - Statement versioning with paragraph versions
 *    - Automatic reconciliation on text changes
 *    - Conflict resolution UI for moved statements
 *    - Batch updates for large text changes
 *
 * 5. UI/UX PATTERNS:
 *    - "Broken link" indicators for orphaned statements
 *    - Auto-suggest re-placement during editing
 *    - Statement management sidebar in editor
 *    - Diff view showing statement position changes
 *
 * CURRENT LIMITATION: HTML pattern matching breaks on text changes
 * FUTURE GOAL: Position-based system with editor integration
 *
 * EDITOR INTEGRATION ARCHITECTURE:
 * - WYSIWYG editor (Draft.js, Slate.js, or similar)
 * - Statement overlays using contentEditable + CSS positioning
 * - Real-time sync between editor state and statement positions
 * - Collaborative editing with statement conflict resolution
 */
