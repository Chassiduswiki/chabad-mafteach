# Inline Citation System - Enhancement Plan

**Status:** ⏳ Pending Implementation  
**Priority:** Medium  
**Date Created:** January 22, 2026

---

## Current State

The inline citation system is functional but needs a more sophisticated implementation:

- ✅ Citations can be inserted into editor
- ✅ Citation click handler emits onClick with source data
- ✅ Citation viewer modal displays source details
- ⏳ **Need: Cooler system for managing inline citations**

---

## Proposed Enhancements

### 1. Citation Management UI
- **Visual indicators** for citation types (page, chapter, verse, etc.)
- **Hover tooltips** showing source title and reference
- **Quick edit** button to modify citation without re-inserting
- **Citation count** badge showing total citations in document

### 2. Citation Palette/Sidebar
- **Dedicated panel** showing all citations in current document
- **Quick navigation** - click to jump to citation in text
- **Batch operations** - update multiple citations at once
- **Citation analytics** - most cited sources, coverage by type

### 3. Smart Citation Features
- **Auto-detection** of citation patterns (e.g., "Tanya 1:5" → auto-create citation)
- **Citation templates** for common reference formats
- **Cross-reference linking** - link related citations
- **Citation validation** - check if source/reference exists in database

### 4. Advanced Citation System
- **Citation context** - show surrounding text for each citation
- **Citation relationships** - group related citations
- **Citation history** - track changes to citations over time
- **Citation export** - generate bibliography from citations

---

## Implementation Phases

### Phase 1: Citation Management UI (Current Priority)
- [ ] Add citation count badge to editor toolbar
- [ ] Create citation sidebar showing all citations in document
- [ ] Add hover tooltips with source info
- [ ] Implement quick-edit functionality

### Phase 2: Smart Citation Features
- [ ] Auto-detection of citation patterns
- [ ] Citation templates for common formats
- [ ] Citation validation against database

### Phase 3: Advanced Features
- [ ] Citation relationships and grouping
- [ ] Citation history and tracking
- [ ] Bibliography generation

---

## Technical Considerations

### Current Architecture
- Citations stored as marks in ProseMirror
- Citation data: `{ source_id, source_title, citation_type, reference }`
- Click handler emits to CitationViewerModal

### Proposed Changes
- Add citation registry/index to track all citations in document
- Create CitationManager component for UI
- Implement citation state management (Redux/Context)
- Add citation validation layer

### Database Integration
- Link citations to source records
- Track citation usage across topics
- Enable citation analytics queries

---

## User Experience Goals

1. **Discoverability** - Users can easily see all citations in a document
2. **Editability** - Quick access to modify citations without re-inserting
3. **Validation** - System warns about invalid or missing citations
4. **Analytics** - Understand citation patterns and coverage
5. **Consistency** - Enforce citation format standards

---

## Related Components

- `components/editor/plugins/citations/comprehensiveCitationPlugin.ts` - Citation plugin
- `components/editor/CitationViewerModal.tsx` - Citation viewer
- `components/editor/CitationInsertModal.tsx` - Citation insertion
- `lib/hooks/useSourceSearch.ts` - Source search functionality

---

## Next Steps

1. Design citation sidebar UI mockup
2. Implement citation registry in editor state
3. Create CitationManager component
4. Add citation count badge to toolbar
5. Implement quick-edit functionality

---

**Owner:** Cascade AI Assistant  
**Last Updated:** January 22, 2026  
**Estimated Effort:** 2-3 days for Phase 1
