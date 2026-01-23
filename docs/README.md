# Schema Refactoring Documentation

**Project:** Chabad Research Platform  
**Phase:** 1 - Audit & Documentation  
**Status:** Complete ✅  
**Date:** January 21, 2026

---

## Overview

This documentation suite addresses three critical, interconnected issues affecting the platform:

1. **Random editor save failures** due to competing architectures
2. **Limited citation functionality** with schema mismatch
3. **Massive field redundancy** in topics table

All issues stem from organic growth without architectural planning. This documentation provides complete analysis and refactoring roadmap.

---

## Documents

### 1. [SCHEMA_AUDIT.md](./SCHEMA_AUDIT.md)
**Comprehensive analysis of all identified issues**

- Executive summary of problems
- Detailed breakdown of each issue
- Evidence from codebase
- Impact assessment
- Proposed solutions
- Implementation roadmap

**Key Findings:**
- Editor save failures: TipTap vs ProseMirror conflict
- Citation system: Using 20% of database capabilities
- Topics table: 26 fields with massive redundancy
- All issues interconnected through save logic

### 2. [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
**Database migration strategy for topics i18n refactoring**

- Pre-migration checklist
- Step-by-step SQL migration scripts
- Rollback procedures
- Testing procedures
- Directus configuration updates
- Execution timeline

**Key Changes:**
- Consolidate 26 topic fields → 10 fields
- Create `topic_translations` table
- Support unlimited languages
- Zero data loss migration

### 3. [CITATION_REDESIGN.md](./CITATION_REDESIGN.md)
**Enhanced citation system design**

- Current limitations analysis
- Proposed citation schema (7 types)
- Citation formatter logic
- Citation editor UI component
- Database sync updates
- Implementation checklist

**Key Features:**
- Support page, chapter, section, daf, verse, halacha, custom citations
- Editable after creation
- Full database field utilization
- Multi-system references (Sefaria, HebrewBooks)

### 4. [EDITOR_UNIFICATION.md](./EDITOR_UNIFICATION.md)
**Unified TipTap architecture design**

- Current system comparison
- Unified architecture design
- Implementation plan
- Migration strategy
- Testing plan
- Performance considerations

**Key Benefits:**
- Single editor system (TipTap)
- Unified save adapter
- Consistent behavior
- Reduced code duplication

---

## Quick Start

### For Reviewers

1. **Start with:** [SCHEMA_AUDIT.md](./SCHEMA_AUDIT.md) - Understand the problems
2. **Review:** [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Database changes
3. **Review:** [CITATION_REDESIGN.md](./CITATION_REDESIGN.md) - Citation enhancements
4. **Review:** [EDITOR_UNIFICATION.md](./EDITOR_UNIFICATION.md) - Editor consolidation

### For Implementers

1. **Phase 1:** ✅ Documentation complete (you are here)
2. **Phase 2:** Review and approve designs
3. **Phase 3:** Execute database migration
4. **Phase 4:** Implement citation enhancements
5. **Phase 5:** Unify editor systems
6. **Phase 6-8:** API updates, frontend updates, testing

---

## Implementation Phases

### Phase 1: Audit & Document ✅ COMPLETE
- [x] Audit current schema
- [x] Document all issues
- [x] Propose solutions
- [ ] Review with stakeholders

### Phase 2: Design (Week 1)
- [ ] Finalize i18n schema design
- [ ] Design unified citation model
- [ ] Create API contract specifications
- [ ] Design migration scripts

### Phase 3: Database Migration (Week 2)
- [ ] Create `topic_translations` table
- [ ] Write data migration scripts
- [ ] Test migration on staging data
- [ ] Create rollback procedures
- [ ] Execute migration

### Phase 4: Citation Enhancement (Week 2-3)
- [ ] Extend citation node schema
- [ ] Add edit capability to citations
- [ ] Create citation type selector UI
- [ ] Update citation insertion logic
- [ ] Add citation validation

### Phase 5: Unify Editor Logic (Week 3-4)
- [ ] Create unified TipTap adapter
- [ ] Migrate ProseMirror documents to TipTap
- [ ] Consolidate save logic
- [ ] Add comprehensive error handling
- [ ] Test all editor instances

### Phase 6: Update API Routes (Week 4)
- [ ] Modify topic APIs for translations
- [ ] Add language parameter handling
- [ ] Update validation logic
- [ ] Add translation CRUD endpoints
- [ ] Update documentation

### Phase 7: Frontend Updates (Week 5)
- [ ] Add language selector component
- [ ] Update topic editor forms
- [ ] Migrate all TipTap instances
- [ ] Update citation UI
- [ ] Add translation management UI

### Phase 8: Testing & Validation (Week 6)
- [ ] Test save persistence
- [ ] Test citation editing
- [ ] Test translation workflows
- [ ] Test language switching
- [ ] Performance testing
- [ ] User acceptance testing

---

## Key Decisions Required

### 1. Migration Timing
**Question:** When to execute database migration?  
**Options:**
- A) Next maintenance window (recommended)
- B) Staged rollout over multiple windows
- C) Delayed until after citation/editor work

**Recommendation:** Option A - Clean slate for subsequent phases

### 2. Editor Migration Strategy
**Question:** Migrate both editors simultaneously or sequentially?  
**Options:**
- A) Topics first, then documents
- B) Documents first, then topics
- C) Both simultaneously

**Recommendation:** Option A - Topics simpler, lower risk

### 3. Citation Backward Compatibility
**Question:** Support old citation format during transition?  
**Options:**
- A) Hard cutover (all citations upgraded)
- B) Dual support (old + new formats)
- C) Migration script (auto-upgrade all citations)

**Recommendation:** Option C - Clean migration, no technical debt

### 4. Translation Default Language
**Question:** What should be default language for existing topics?  
**Options:**
- A) Hebrew (matches most content)
- B) English (matches UI language)
- C) Based on `original_lang` field

**Recommendation:** Option C - Preserves intent

---

## Risk Assessment

### High Risk Items
1. **Data Migration** - Potential data loss
   - Mitigation: Comprehensive backups, staging tests, rollback procedures
   
2. **Editor Breaking Changes** - Existing functionality breaks
   - Mitigation: Feature flags, gradual rollout, extensive testing

### Medium Risk Items
1. **API Contract Changes** - Frontend-backend mismatch
   - Mitigation: Versioned APIs, backward compatibility layer
   
2. **Performance Degradation** - Slower queries/saves
   - Mitigation: Proper indexing, query optimization, monitoring

### Low Risk Items
1. **UI/UX Changes** - User confusion
   - Mitigation: Documentation, training, gradual rollout

---

## Success Metrics

### Technical Metrics
- ✅ 100% save success rate (currently ~70-80%)
- ✅ Zero data loss during migration
- ✅ <100ms API response time for translations
- ✅ Support for 5+ languages without schema changes
- ✅ 80% reduction in code duplication

### User Metrics
- ✅ Zero lost work incidents
- ✅ Reduced editor confusion (measured by support tickets)
- ✅ Increased translation coverage
- ✅ Faster content creation workflow

### Business Metrics
- ✅ Reduced maintenance burden
- ✅ Faster feature development
- ✅ Improved data quality
- ✅ Better scalability

---

## Dependencies

### External Dependencies
- TipTap (already in use)
- Directus SDK (already in use)
- PostgreSQL (already in use)

### Internal Dependencies
- None - all changes self-contained

---

## Estimated Effort

### Development Time
- Phase 1: ✅ Complete (8 hours)
- Phase 2: 8 hours
- Phase 3: 16 hours
- Phase 4: 24 hours
- Phase 5: 32 hours
- Phase 6: 16 hours
- Phase 7: 24 hours
- Phase 8: 16 hours

**Total:** ~144 hours (~3.5 weeks for 1 developer)

### Testing Time
- Unit tests: 16 hours
- Integration tests: 16 hours
- User acceptance: 8 hours

**Total:** ~40 hours (~1 week)

### Overall Timeline
**6 weeks** for complete implementation and testing

---

## Next Steps

1. **Review Documentation** - Stakeholder review of all 4 documents
2. **Approve Designs** - Sign off on proposed solutions
3. **Schedule Migration** - Book maintenance window
4. **Begin Phase 2** - Detailed design specifications
5. **Set Up Staging** - Prepare test environment

---

## Questions & Answers

### Q: Why not just fix the save bug?
**A:** The save bug is a symptom of deeper architectural issues. A quick fix would leave technical debt and other problems unsolved.

### Q: Can we do this incrementally?
**A:** Yes. Phases 3-5 are independent and can be done in any order. However, Phase 3 (migration) provides cleanest foundation.

### Q: What if migration fails?
**A:** Complete rollback procedures documented in [MIGRATION_PLAN.md](./MIGRATION_PLAN.md). Tested on staging before production.

### Q: Will this break existing content?
**A:** No. Migration preserves all existing data. Extensive testing ensures zero data loss.

### Q: How long will the site be down?
**A:** Estimated 30-60 minutes for database migration. Editor changes can be deployed without downtime using feature flags.

---

## Contact

**Project Lead:** [Your Name]  
**Technical Lead:** [Your Name]  
**Database Admin:** [Your Name]

---

## Appendix

### File Structure
```
docs/
├── README.md                    (this file)
├── SCHEMA_AUDIT.md             (comprehensive analysis)
├── MIGRATION_PLAN.md           (database migration)
├── CITATION_REDESIGN.md        (citation enhancements)
└── EDITOR_UNIFICATION.md       (editor consolidation)
```

### Related Code Files
```
app/
├── editor/
│   └── topics/[slug]/page.tsx  (topic editor - needs refactor)
components/
├── editor/
│   ├── ProseEditor.tsx         (document editor - needs refactor)
│   ├── schema.ts               (citation schema - needs enhancement)
│   └── plugins/citations/      (citation plugin - needs update)
lib/
├── editor-sync.ts              (sync logic - needs unification)
└── types.ts                    (type definitions - needs update)
```

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Ready for Review
