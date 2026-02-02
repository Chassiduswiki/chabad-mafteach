# Chabad Research Encyclopedia - Project Context

This file provides context for Claude Code sessions. Read this to understand the project and current work.

---

## Project Overview

**What is this?** A scholarly encyclopedia for Chabad Chassidus built with:
- **Frontend**: Next.js 16 (App Router), React 19, TipTap editor, Tailwind, shadcn/ui
- **Backend**: Directus CMS (hosted on Railway), Prisma ORM
- **State**: Zustand + TanStack React Query
- **AI**: OpenAI integration for suggestions, translation, OCR

**Core entities**: Topics, Documents, Paragraphs, Statements, Sources, SourceLinks, Citations

**Key patterns**:
- TipTap extensions in `/components/editor/extensions/`
- API routes in `/app/api/`
- Types in `/lib/types/index.ts`
- Citation system in `/lib/citations/`

---

## Current Work: Idea Chain Feature

**Status**: Phase 1 API complete, ready for UI development

**Spec location**: `/docs/IDEA_CHAIN_TECHNICAL_SPEC.md`

### What are Idea Chains?

A system to trace intellectual genealogy of concepts through Chassidic literature. Example:
```
Sicha 1925 → Maamar 1880 → Tanya 1797 → Zohar ~1300 → Gemara ~200 CE
```

Chains show how ideas evolve from origin through intermediary sources to modern applications.

### Architecture Decisions (Confirmed)

1. **Standalone entities** - Chains are built in dedicated Chain Builder, embedded in topics as components
2. **DAG structure** - Nodes can have multiple parents (synthesis of ideas)
3. **Chapter-level citations** - Not line-based (too fragile across printings)
4. **Hebrew text** - Manual entry with OCR support, linked to external PDFs
5. **Multi-scholar collaboration** - Multiple scholars can work on one chain
6. **Version history** - Track changes over time (to be added to spec)
7. **Automatic topic linking** - Separate feature: detect topic names in text and auto-link them (needs own spec)

### Data Model (New Collections)

```
idea_chains          - Container for traced concepts
idea_nodes           - Individual source contributions
idea_node_links      - DAG edges (parent/child relationships)
idea_chain_topics    - Junction for embedding in topics
```

### Implementation Phases

- **Phase 1**: Linear chains, form-based builder, basic viewer
- **Phase 2**: Multi-parent (synthesis), visual graph editor
- **Phase 3**: Topic integration, mobile UI, Sefaria integration
- **Phase 4**: Discovery, analytics

### Open Items

- [x] Add collaboration/permissions model to spec (DONE - `idea_chain_collaborators`)
- [x] Add version history model to spec (DONE - `idea_chain_versions`)
- [x] Create Directus collections (DONE - 6 collections created)
- [x] Build Phase 1 API routes (DONE - `/app/api/idea-chains/`)
- [ ] Set up Directus permissions for regular API token
- [ ] Build Chain Builder UI
- [ ] Build Chain Viewer component
- [ ] Create separate spec for automatic topic entity linking (platform-wide feature)

---

## Current Work: Source Linking System

**Status**: Brainstorming phase
**Spec location**: `/docs/SOURCE_LINKING_BRAINSTORM.md`

### The Problem

Jewish texts exist across multiple platforms (HebrewBooks, Sefaria, Chabad.org, ChabadLibrary), each with different:
- URL structures and deep-linking capabilities
- Reference systems (page numbers, folios, chapters, sections)
- Content formats (PDF scans vs structured text)
- Strengths (HebrewBooks for authority, Sefaria for API/structure, ChabadLibrary for traditional pagination)

### The Goal

Build a **linking layer** (not scraping) that resolves canonical references to platform-specific URLs. Example:
- Input: "Derech Mitzvosecha, Chapter 1"
- Output: Links to same content on HebrewBooks, Sefaria, Chabad.org, ChabadLibrary

### Key Challenges

1. **Page offset problem**: HebrewBooks PDF page 11 = printed page 1
2. **Reference style mismatch**: Sefaria uses sections, traditional citations use pages
3. **No standard APIs**: Most platforms don't expose programmatic access
4. **Edition variations**: Different printings have different pagination

### Architectural Direction (TBD)

Likely hybrid approach:
1. **Book catalog**: Map major books to platform identifiers
2. **Link templates**: URL patterns per platform
3. **Scholar contributions**: Users add/verify links organically

### Related Features

- Idea Chain nodes need source links
- Citation system could use this resolver
- General "view source" functionality

---

## User Preferences

- **Progressive disclosure** - Don't overwhelm with information
- **Desktop-first** - Serious research tool, but mobile should work
- **Honest feedback** - Don't just agree; push back on bad ideas
- **No over-engineering** - Start simple, iterate based on real usage
- **Scholars are not developers** - UI must be simple for non-tech users

---

## Key Files

| Purpose | Location |
|---------|----------|
| Directus types | `/lib/types/index.ts` |
| Citation types | `/lib/citations/types.ts` |
| Citation extension | `/components/editor/extensions/citation/CitationExtension.ts` |
| Editor provider | `/components/editor/EditorProvider.tsx` |
| Topic API | `/lib/api/topics.ts` |
| Idea Chain spec | `/docs/IDEA_CHAIN_TECHNICAL_SPEC.md` |
| Idea Chain types | `/lib/idea-chains/types.ts` |
| Idea Chain API | `/lib/api/idea-chains.ts` |
| Idea Chain routes | `/app/api/idea-chains/` |
| Source Linking brainstorm | `/docs/SOURCE_LINKING_BRAINSTORM.md` |

---

## MCP Access

Directus MCP is configured in `.mcp.json`. Start Claude Code from this project directory to have database access.

---

## Notes

- Citation system recently unified - uses `UnifiedCitation` type
- Statement vs topic-level citation distinction is important (`statementId` field)
- Existing OCR infrastructure can be leveraged for chain builder workflow

---

*Last updated: February 2026*
