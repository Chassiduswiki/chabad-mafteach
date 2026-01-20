# Prompt for Next AI Agent: Topic Page Migration

**Role:** You are a Senior Next.js & Directus Engineer.

**Objective:** 
Refactor the production Topics Detail Page (`app/topics/[slug]/page.tsx`) to match the new "Interactive/Sexy" design currently prototyped in `components/topics/ArticleStructuredView.tsx`.

**Context:**
We have verified a new, high-engagement design in a demo. We now need to move this into production, replacing the old "Wiki-style" layout with this new "Interactive Article" layout.

**Primary Documentation (Read These First):**
1.  **[The Master Plan]** Read `Documentation/Longterm-tasks`, specifically **Phase 15i**. This contains your step-by-step checklist (Components -> Data -> Page -> Cleanup).
2.  **[The Data Spec]** Read `Documentation/New-directus-data-model.md`, specifically **Phase 8**. This tells you exactly which Directus fields (e.g., `topic.article`, `topic_relationships`) map to which UI components.
3.  **[The Golden Sample]** specificially study `components/topics/ArticleStructuredView.tsx`. This component contains the *exact* UI/UX we want to preserve.

**Your Execution Steps:**
1.  **Extract Components:** Break down the monolithic `ArticleStructuredView` into reusable parts (e.g., move the Hero to `components/topics/hero/ImmersiveHero.tsx`).
2.  **Define Types:** Update your TypeScript interfaces to match the "Frontend Mapping" in the data model docs.
3.  **Refactor Page:** logic in `app/topics/[slug]/page.tsx` to fetch the new deep data structure and render the new layout.
4.  **Verify:** Ensure that the "Concept Constellation" graph and "Bottom Sheet" interactions work with real data.

**Constraint:** 
Do not lose the `TopicTracker` or `Breadcrumbs` functionality from the existing page. Integrate them subtly into the new design.
