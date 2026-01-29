# Database Audit: Action Plan

## Quick Summary

**The Good:** Excellent database design, professional i18n setup, clean relationships.

**The Bad:** Almost no content, unused features, draft translations.

**Score:** 7/10 - Great foundation, needs content work.

---

## Immediate Actions (Next 2 Weeks)

### 1. Fix Content Gaps
**Owner:** Editorial team  
**Effort:** High  
**Impact:** High

```
Current state:
- 42 topics total
- 29 topics in draft (69%)
- Only 0.48 sources per topic
- All translations marked "draft"

Action items:
- Pick 10 core topics and complete them
- Add 3-5 sources per topic  
- Upgrade 5 translations to "reviewed" quality
```

### 2. Execute Database Migration
**Owner:** Dev team  
**Effort:** Medium  
**Impact:** Medium

**File to run:** `docs/MIGRATION_PLAN.md`

The migration plan exists and is tested. Just run it:
```sql
-- Step 1: Create translations table
-- Step 2: Migrate data  
-- Step 3: Add default_language field
-- Step 4: Drop redundant columns
-- Step 5: Add constraints
```

### 3. Activate Basic Analytics
**Owner:** Dev team  
**Effort:** Low  
**Impact:** Medium

```
Current: 2,039 analytics events but only page_view tracking

Add:
- Topic view tracking
- Search query logging  
- User session duration
```

---

## Medium Term (Next 2 Months)

### 4. Turn On Engagement Features
**Owner:** Frontend team  
**Effort:** High  
**Impact:** Medium

```
Tables exist but unused:
- collection_follows
- collection_likes

Build UI components and wire them up.
```

### 5. Editorial Workflow
**Owner:** Product + Editorial  
**Effort:** Medium  
**Impact:** High

```
Add workflow:
draft → review → published

Use existing status fields, just add process.
```

### 6. Search Implementation
**Owner:** Frontend team  
**Effort:** Medium  
**Impact:** High

```
Current: No search system

Add:
- Full-text search on topics
- Filter by content status
- Language-specific search
```

---

## Technical Debt to Fix

### Schema Cleanup
- **Priority:** Medium
- **Issue:** Legacy fields still in topics table
- **Fix:** Run the migration plan (already written)

### Permission Issues  
- **Priority:** Low
- **Issue:** Frontend expects permissions that may not exist
- **Fix:** Review Directus role configuration

### Query Performance
- **Priority:** Low  
- **Issue:** Deep nested queries in topics API
- **Fix:** Add caching, monitor as content grows

---

## Success Metrics

**3 Month Targets:**
- Comprehensive topics: 26% → 50%
- Sources per topic: 0.48 → 3.0
- Published topics: 31% → 60%
- Translation quality: 50% "reviewed" or better

**6 Month Targets:**
- Active engagement features (likes/follows)
- Working search system
- Editorial workflow operational

---

## Ownership

| Thing | Who Owns It | Status |
|-------|------------|--------|
| Content | Editorial team | Needs assignment |
| Schema changes | Dev team | Ready to execute |
| Frontend features | Frontend team | Backlog items |
| Analytics | Dev team | Quick wins available |

---

## What to Do First

1. **This week:** Editorial team picks 10 topics to complete
2. **Next week:** Dev team runs migration plan  
3. **Following week:** Dev team adds basic analytics tracking
4. **Month 2:** Frontend team builds engagement features

---

## Risks

**High Risk:**
- Content creation speed (editorial bandwidth)
- Feature activation may expose permission issues

**Medium Risk:**
- Migration may have data edge cases
- Performance at scale unknown

**Low Risk:**
- Technical foundation is solid
- Schema design is professional

---

## Bottom Line

The database architecture is excellent. The main work is content creation and feature activation. Technical risks are low.

Focus on content first, then features. The foundation can handle it.
