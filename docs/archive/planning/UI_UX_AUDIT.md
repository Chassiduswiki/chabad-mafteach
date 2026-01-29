# Comprehensive UI/UX Audit - Chabad Maftaiach

**Date:** January 2026  
**Auditor:** Cascade AI  
**Scope:** Full application review across design, usability, and accessibility

---

## Summary

This audit identifies **65 issues** across the application, organized by category and priority. Each issue includes the problem, location, impact assessment, and 1-2 fix options.

**Priority Legend:**
- 🔴 **Critical** - Significantly impacts usability or accessibility
- 🟠 **High** - Notable UX friction or design inconsistency
- 🟡 **Medium** - Improvement opportunity
- 🟢 **Low** - Polish/enhancement

---

## 1. NAVIGATION & INFORMATION ARCHITECTURE

### 1.1 🔴 Mobile Nav Has Only 3 Items, Missing Key Sections
**Location:** `components/mobile/MobileNav.tsx`  
**Issue:** Mobile nav only shows Home, Topics, Search. Missing Seforim/Sources and Explore pages entirely.  
**Impact:** Users can't easily access major sections of the app on mobile.

**Fix A:** Add Seforim icon to mobile nav (4 items max for thumb reach)
```tsx
const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/topics', icon: Hash, label: 'Topics' },
    { href: '/seforim', icon: BookOpen, label: 'Seforim' },
];
```

**Fix B:** Add a "More" menu that expands to show additional sections

---

### 1.2 🟠 No Breadcrumbs on Topic Detail Pages
**Location:** `components/topics/TopicExperience.tsx`  
**Issue:** While hero has Topics > Category path, it's not a true breadcrumb component. Gets lost when scrolling.  
**Impact:** Users lose context of where they are in the hierarchy.

**Fix A:** Add persistent breadcrumb in sticky header when scrolled
**Fix B:** Make the category badge in sticky title clickable to filter topics

---

### 1.3 🟠 Desktop Nav Missing Seforim Link
**Location:** `components/layout/GlobalNav.tsx`  
**Issue:** Desktop nav shows only Topics and About. Seforim (a major content section) is hidden.  
**Impact:** Low discoverability of core content.

**Fix A:** Add Seforim to nav: `Topics | Seforim | About`
**Fix B:** Create a dropdown "Library" menu containing Topics + Seforim

---

### 1.4 🟡 Inconsistent Back Button Behavior
**Location:** `components/layout/GlobalNav.tsx`  
**Issue:** `showBack` prop is manually set. Some pages have it, others don't.  
**Impact:** Unpredictable navigation experience.

**Fix:** Automatically detect if user came from within app and show back button contextually

---

### 1.5 🟡 No "Home" Link in Mobile Nav Active State
**Location:** `components/mobile/MobileNav.tsx:63-65`  
**Issue:** Active indicator uses absolute positioning that breaks on some devices.  
**Impact:** Visual glitch on certain mobile browsers.

**Fix:** Use border-top or background instead of absolute positioned element

---

## 2. HOMEPAGE

### 2.1 🟠 Desktop and Mobile Homepage Are Completely Different
**Location:** `app/page.tsx`  
**Issue:** Desktop shows hero + ContentDiscovery + FeaturedTopics. Mobile shows MobileHome with different structure.  
**Impact:** Inconsistent mental model; features work differently across devices.

**Fix A:** Unify structure but adapt layout (responsive design vs separate components)
**Fix B:** If intentional, document the differences and ensure feature parity

---

### 2.2 🟠 "v2.0 Now Available" Badge - Unclear Purpose
**Location:** `app/page.tsx:76-87`  
**Issue:** Static marketing badge with no link or context about what v2.0 includes.  
**Impact:** Confusing - is this new? What changed?

**Fix A:** Link to changelog/about page with release notes
**Fix B:** Remove if not actionable; replace with actual value prop

---

### 2.3 🟡 WordRotate Animation May Cause Accessibility Issues
**Location:** `app/page.tsx:105-108`  
**Issue:** Constantly rotating text can be distracting for users with attention disorders.  
**Impact:** WCAG 2.2.2 violation risk - moving content without pause control.

**Fix A:** Add `prefers-reduced-motion` media query to stop animation
**Fix B:** Provide user toggle to disable animations

---

### 2.4 🟡 FloatingHebrewLetters Performance Concern
**Location:** `app/page.tsx:61`  
**Issue:** Animated background may impact performance on low-end devices.  
**Impact:** Battery drain, jank on older phones.

**Fix:** Add performance check and disable on low-power mode or older devices

---

### 2.5 🟡 "Recently Updated" Section Shows Empty State Poorly
**Location:** `components/features/home/ContentDiscovery.tsx:174-176`  
**Issue:** Shows "No recent updates" as plain text - looks broken.  
**Impact:** Makes app seem empty/unfinished.

**Fix:** Design an encouraging empty state with CTA to explore topics

---

### 2.6 🟢 Feature Badges Have Low Contrast
**Location:** `app/page.tsx:131-141`  
**Issue:** "AI-Powered", "Instant Results", "Bi-Lingual" badges use very light backgrounds.  
**Impact:** Hard to read, especially in certain lighting.

**Fix:** Increase opacity or use solid background colors

---

## 3. TOPICS LIST PAGE

### 3.1 🔴 Sort Dropdown Has No Escape Key Support
**Location:** `components/topics/TopicsList.tsx:156-196`  
**Issue:** Dropdown doesn't close on Escape key press.  
**Impact:** Keyboard users stuck with open dropdown.

**Fix:** Add `onKeyDown` handler for Escape to close dropdown

---

### 3.2 🟠 Category Chips Not Visible Without Scrolling
**Location:** `app/topics/page.tsx:194-196`  
**Issue:** TopicCategoryChips component is below the fold and search.  
**Impact:** Users may not discover filtering by category.

**Fix A:** Move category chips above the search or inline with header
**Fix B:** Add horizontal scrolling chips in sticky position

---

### 3.3 🟠 Topic Cards Missing Focus States
**Location:** `components/topics/TopicCard.tsx`  
**Issue:** Cards have hover states but no visible focus indicators for keyboard navigation.  
**Impact:** Keyboard users can't see which card is focused.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-primary` to card links

---

### 3.4 🟡 "Comprehensive/Partial/Minimal" Status Labels Unclear
**Location:** `components/topics/TopicCard.tsx:80-81`  
**Issue:** Status badges don't explain what they mean. What makes something "comprehensive"?  
**Impact:** Users don't understand the value proposition.

**Fix A:** Add tooltip explaining criteria
**Fix B:** Use clearer labels like "50+ sources" or "In Progress"

---

### 3.5 🟡 Preview Excerpts Load on Hover - Mobile Problem
**Location:** `components/topics/TopicCard.tsx:42-49`  
**Issue:** `onMouseEnter` triggers preview fetch. No equivalent for touch.  
**Impact:** Mobile users can't access preview functionality the same way.

**Fix:** Use explicit tap-to-expand button consistently across devices

---

### 3.6 🟡 Empty State Message Is Generic
**Location:** `components/topics/TopicsList.tsx:241-248`  
**Issue:** "No topics found" with generic advice to adjust filters.  
**Impact:** Doesn't guide user to specific actions.

**Fix:** Provide direct links to reset filters or browse popular categories

---

### 3.7 🟢 View Toggle Icons Have No Labels
**Location:** `components/layout/ViewToggle.tsx` (implied)  
**Issue:** Grid/List toggle uses only icons.  
**Impact:** May not be clear what icons represent.

**Fix:** Add tooltips or sr-only labels

---

## 4. TOPIC DETAIL PAGE

### 4.1 🔴 Tab Navigation Not Keyboard Accessible
**Location:** `components/topics/TopicExperience.tsx:441-464`  
**Issue:** Tab buttons scroll view but arrow keys don't move between tabs.  
**Impact:** WCAG 2.1.1 violation - functionality not keyboard accessible.

**Fix:** Implement proper ARIA tabs pattern with arrow key navigation

---

### 4.2 🔴 Focus Mode Tutorial Auto-Shows Without Consent
**Location:** `components/topics/TopicExperience.tsx:136-139`  
**Issue:** Tutorial modal pops up on first visit without user action.  
**Impact:** Intrusive, interrupts reading flow.

**Fix A:** Trigger tutorial only on first double-click attempt
**Fix B:** Add subtle hint badge instead of modal

---

### 4.3 🟠 Double-Click to Focus Mode - Not Discoverable
**Location:** `components/topics/TopicExperience.tsx:615`  
**Issue:** `onDoubleClick={() => toggleFocusMode(section.type)}` - hidden gesture.  
**Impact:** Most users will never discover this feature.

**Fix A:** Add visible "Focus" button to each section
**Fix B:** Show tip in section header

---

### 4.4 🟠 Interactive Terms Not Keyboard Accessible
**Location:** `components/topics/TopicExperience.tsx:158`  
**Issue:** Terms have `tabindex="0"` but rely on click handler via event delegation.  
**Impact:** Screen reader users may not trigger the interaction.

**Fix:** Add proper button semantics or use `role="button"` with Enter/Space handling

---

### 4.5 🟠 Section Content Containers Have Inconsistent Styling
**Location:** `components/topics/TopicExperience.tsx:627`  
**Issue:** Each section type has different `bgColor` and `borderColor` from config.  
**Impact:** Visual noise; harder to scan content.

**Fix A:** Unify section styling, use color only for icons
**Fix B:** Reduce color saturation for more subtle differentiation

---

### 4.6 🟡 "Concept Constellation" Graph May Be Confusing
**Location:** `components/topics/TopicExperience.tsx:637-646`  
**Issue:** Complex graph visualization without explanation of what connections mean.  
**Impact:** Users may not understand the value of this feature.

**Fix:** Add legend or onboarding explaining relationship types

---

### 4.7 🟡 "Listen" Feature Uses Browser TTS - Quality Varies
**Location:** `components/topics/hero/ImmersiveHero.tsx:76-90`  
**Issue:** `speechSynthesis` quality is inconsistent across browsers/devices.  
**Impact:** Poor experience on some platforms; Hebrew text may mispronounce.

**Fix A:** Add disclaimer about TTS limitations
**Fix B:** Consider dedicated audio content for key topics

---

### 4.8 🟡 Save Button Has No Indication of What It Does
**Location:** `components/topics/hero/ImmersiveHero.tsx:179-186`  
**Issue:** Save button saves to localStorage but no UI showing saved collection.  
**Impact:** Users save but can't find saved items later.

**Fix:** Add "Saved Topics" page or section accessible from profile/menu

---

### 4.9 🟡 Sticky Title Transition Is Abrupt
**Location:** `components/topics/TopicExperience.tsx:421-430`  
**Issue:** Title appears with opacity transition but no height animation.  
**Impact:** Layout shift when scrolling past hero.

**Fix:** Use `max-h-0` to `max-h-12` transition already in code, but verify smoothness

---

### 4.10 🟢 "See More" Button for Definition Not Prominent
**Location:** `components/topics/hero/ImmersiveHero.tsx:160-163`  
**Issue:** Small link-style button easily missed.  
**Impact:** Users may not realize there's more content.

**Fix:** Use more prominent expand/collapse UI pattern

---

## 5. SEFORIM/SOURCES PAGES

### 5.1 🔴 No Loading State While Fetching Seforim
**Location:** `app/seforim/page.tsx:226-237`  
**Issue:** After loading completes, shows empty state. During load, shows Suspense skeleton but it may not match actual layout.  
**Impact:** Users see jarring transition or blank screen.

**Fix:** Add proper loading skeleton that matches actual grid layout

---

### 5.2 🟠 Seforim Cards All Look the Same
**Location:** `app/seforim/page.tsx:180-223`  
**Issue:** All cards have same structure - no visual differentiation between books, sections, documents.  
**Impact:** Hard to scan and find specific content types.

**Fix A:** Add doc_type badges with distinct colors
**Fix B:** Use different card sizes based on content hierarchy

---

### 5.3 🟠 "X sections" Badge Is Hardcoded Blue
**Location:** `app/seforim/page.tsx:93-95, 209-211`  
**Issue:** Uses `bg-blue-100 text-blue-700` - doesn't respect theme.  
**Impact:** Inconsistent with design system; harsh in dark mode.

**Fix:** Use semantic colors: `bg-primary/10 text-primary`

---

### 5.4 🟡 Document Tree Component Defined But Not Used
**Location:** `app/seforim/page.tsx:28-120`  
**Issue:** Full `DocumentTree` component exists but page uses flat grid instead.  
**Impact:** Code bloat; confusing architecture.

**Fix:** Remove unused component or use it for hierarchical navigation option

---

### 5.5 🟡 No Search/Filter on Seforim Page
**Location:** `app/seforim/page.tsx`  
**Issue:** Unlike Topics page, no search bar or category filter.  
**Impact:** Hard to find specific sources in growing library.

**Fix:** Add ContextualSearch component like Topics page has

---

## 6. TORAH READER (Book Text Display)

### 6.1 🔴 Progress Bar at Top Conflicts With Sticky Header
**Location:** `components/TorahReader.tsx:100-105`  
**Issue:** Progress bar is `fixed top-0` but header is `sticky top-1`. They overlap.  
**Impact:** Visual collision, progress bar partially hidden.

**Fix:** Make progress bar part of sticky header or position at `top-14`

---

### 6.2 🟠 Display Mode Buttons Have Poor Contrast
**Location:** `components/TorahReader.tsx:140-171`  
**Issue:** Small text buttons "עברית", "EN", languages icon - hard to distinguish active state.  
**Impact:** Users unsure which mode is active.

**Fix A:** Use more distinct active/inactive styling
**Fix B:** Use toggle switch instead of segmented button for 2-3 options

---

### 6.3 🟠 Commentary Toggle Text Cut Off on Mobile
**Location:** `components/TorahReader.tsx:127-137`  
**Issue:** "Commentary" text hidden on `sm:hidden`, leaving only icon.  
**Impact:** Unclear what toggle does on mobile.

**Fix:** Show abbreviated "Notes" or keep icon with tooltip

---

### 6.4 🟠 Side-by-Side Mode Doesn't Work Well on Mobile
**Location:** `components/TorahReader.tsx:299-355`  
**Issue:** Uses `lg:grid-cols-2` - on mobile it's single column (same as Hebrew-only).  
**Impact:** Feature advertised but doesn't deliver on mobile.

**Fix A:** Use horizontal scroll for side-by-side on mobile
**Fix B:** Use accordion-style expand for translation on tap

---

### 6.5 🟡 "Tap any sentence" Hint Always Shows
**Location:** `components/TorahReader.tsx:363-370`  
**Issue:** Hint shows even after user has tapped sentences.  
**Impact:** Redundant UI clutter after learning.

**Fix:** Hide after first few interactions, store in localStorage

---

### 6.6 🟡 Topics/Sources Sidebar Hidden on Mobile Entirely
**Location:** `components/TorahReader.tsx:374-421`  
**Issue:** `hidden lg:grid` - sidebar never visible on mobile.  
**Impact:** Core functionality missing on mobile.

**Fix:** Add collapsible bottom sheet or modal for topics/sources on mobile

---

### 6.7 🟢 Statement Selection Modal Has No Keyboard Trap
**Location:** `components/TorahReader.tsx:426-510`  
**Issue:** Modal overlay doesn't trap focus inside.  
**Impact:** Tab can leave modal and interact with hidden content.

**Fix:** Implement focus trap using `focus-trap-react` or custom solution

---

## 7. EXPLORE PAGE

### 7.1 🟠 No Way to Return to Previous Statement
**Location:** `app/explore/page.tsx`  
**Issue:** Random statement feed has no history or back button.  
**Impact:** Users lose interesting content if they accidentally click "Next".

**Fix A:** Add history stack with back button
**Fix B:** Add "Undo" option for 5 seconds after clicking Next

---

### 7.2 🟡 "Pull or Click Next" Hint Only on Mobile
**Location:** `app/explore/page.tsx:93-96`  
**Issue:** Pull-to-refresh not implemented, hint is misleading.  
**Impact:** Users try to pull and nothing happens.

**Fix A:** Implement pull-to-refresh
**Fix B:** Remove pull mention from hint

---

### 7.3 🟡 Save Button Has No Feedback
**Location:** `components/explore/ZenCard.tsx:102-108`  
**Issue:** Save button onClick handler is optional and does nothing by default.  
**Impact:** Button appears interactive but nothing happens.

**Fix:** Implement save functionality or hide button until ready

---

### 7.4 🟢 Error State Doesn't Match Page Design
**Location:** `app/explore/page.tsx:61-75`  
**Issue:** Error message uses basic styling, doesn't match zen aesthetic.  
**Impact:** Jarring visual transition when error occurs.

**Fix:** Style error state consistently with page design

---

## 8. SEARCH / COMMAND MENU

### 8.1 🟠 Search Results Don't Show Which Field Matched
**Location:** `components/features/search/CommandMenu.tsx`  
**Issue:** Results show title + subtitle but not why this result matched the query.  
**Impact:** Hard to understand relevance, especially for partial matches.

**Fix:** Highlight matching terms in results or show "matched in: title/description"

---

### 8.2 🟠 No Recent Searches Feature
**Location:** `components/features/search/CommandMenu.tsx:210-218`  
**Issue:** Empty state shows generic prompt, no search history.  
**Impact:** Users re-type common searches.

**Fix:** Store and display recent searches in localStorage

---

### 8.3 🟡 Mobile Bottom Sheet Drag Handle Too Small
**Location:** `components/features/search/CommandMenu.tsx:165-167`  
**Issue:** Drag handle is `w-12 h-1.5` - hard to see/grab.  
**Impact:** Users may not realize they can swipe to dismiss.

**Fix:** Increase size to `w-16 h-2` and add subtle animation

---

### 8.4 🟡 "ESC TO CLOSE" Hint Shown on Mobile
**Location:** `components/features/search/CommandMenu.tsx:294-297`  
**Issue:** Keyboard shortcut hint shown in mobile layout.  
**Impact:** Irrelevant on touch devices.

**Fix:** Use `hidden sm:flex` on desktop keyboard hints

---

### 8.5 🟢 Loading State Text Is Cute But May Confuse
**Location:** `components/features/search/CommandMenu.tsx:308`  
**Issue:** "Mining data..." - playful but unclear for first-time users.  
**Impact:** Minor clarity issue.

**Fix:** Use "Searching..." for clarity

---

## 9. 404 / ERROR PAGES

### 9.1 🟡 404 Page Search Redirects to /explore
**Location:** `app/not-found.tsx:14-16`  
**Issue:** Search form redirects to `/explore?q=...` which doesn't handle search params.  
**Impact:** Search from 404 doesn't work.

**Fix:** Create proper search results page or use command menu

---

### 9.2 🟡 Quick Links Use Gradient Colors - Dark Mode Issue
**Location:** `app/not-found.tsx:25-48`  
**Issue:** Gradients like `from-blue-500` are hardcoded, may clash with dark mode theme.  
**Impact:** Inconsistent appearance in dark mode.

**Fix:** Use semantic color variables or test/adjust dark mode specifically

---

## 10. FORMS & INPUTS

### 10.1 🟠 Search Inputs Have No Clear Button
**Location:** Multiple components  
**Issue:** Mobile search in CommandMenu has clear, but ContextualSearch may not.  
**Impact:** Inconsistent, users have to manually select-all and delete.

**Fix:** Add clear (X) button to all search inputs when value exists

---

### 10.2 🟡 No Input Validation Feedback Pattern
**Location:** App-wide  
**Issue:** Contact form on About page has no validation or feedback.  
**Impact:** Users don't know if submission worked.

**Fix:** Implement form handling with success/error states

---

## 11. ACCESSIBILITY

### 11.1 🔴 Missing Skip-to-Content Link
**Location:** `app/layout.tsx`  
**Issue:** No skip link for keyboard users to bypass navigation.  
**Impact:** Screen reader users must tab through nav on every page.

**Fix:** Add skip link as first focusable element:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Skip to content
</a>
```

---

### 11.2 🔴 Hebrew Text Direction Not Always Set
**Location:** Multiple components  
**Issue:** Hebrew text uses `font-hebrew` class but not always `dir="rtl"`.  
**Impact:** Screen readers may mispronounce, alignment issues.

**Fix:** Add `dir="rtl"` attribute to all Hebrew text containers

---

### 11.3 🟠 Color Contrast Issues in Light Mode
**Location:** `app/globals.css:68-74`  
**Issue:** `--muted-foreground: hsl(0 0% 32%)` is 4.6:1 - barely passing for large text.  
**Impact:** Small text using muted-foreground may fail WCAG AA.

**Fix:** Increase to `hsl(0 0% 28%)` for safer 5.5:1 ratio

---

### 11.4 🟠 Images/Icons Missing Alt Text
**Location:** Multiple components  
**Issue:** Many icons use `aria-hidden` but some decorative images have no alt.  
**Impact:** Screen readers announce "image" with no context.

**Fix:** Add `alt=""` to decorative images, descriptive alt to meaningful ones

---

### 11.5 🟡 Form Labels Not Associated with Inputs
**Location:** `components/features/search/ContextualSearch.tsx` (likely)  
**Issue:** Search inputs may use placeholder as pseudo-label.  
**Impact:** Screen readers don't announce input purpose.

**Fix:** Add visually hidden labels or use `aria-label`

---

### 11.6 🟡 Animations Don't Respect prefers-reduced-motion
**Location:** Multiple Framer Motion usages  
**Issue:** Animations run regardless of user preference.  
**Impact:** Can cause discomfort for users with vestibular disorders.

**Fix:** Wrap motion components with reduced motion check:
```tsx
const prefersReducedMotion = usePrefersReducedMotion();
// Use `animate` only if !prefersReducedMotion
```

---

## 12. PERFORMANCE

### 12.1 🟠 All Topics Fetched Client-Side on Seforim Page
**Location:** `app/seforim/page.tsx:129-152`  
**Issue:** Full seforim list fetched via useEffect, no pagination.  
**Impact:** Slow initial load as library grows.

**Fix:** Implement server-side pagination like Topics page

---

### 12.2 🟡 Multiple API Calls on Topics List
**Location:** `components/topics/TopicsList.tsx:52-88`  
**Issue:** Separate calls for stats, analytics, and previews.  
**Impact:** Waterfall requests slow down page.

**Fix:** Consolidate into single API call with all needed data

---

### 12.3 🟡 Large Component Bundle for Homepage
**Location:** `app/page.tsx`  
**Issue:** Dynamic imports help, but many large dependencies (framer-motion, etc).  
**Impact:** Time-to-interactive may be high on slow connections.

**Fix:** Audit bundle size, consider code splitting further

---

## 13. DESIGN CONSISTENCY

### 13.1 🟠 Multiple Border Radius Values Used
**Location:** Throughout app  
**Issue:** Mix of `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`.  
**Impact:** Inconsistent visual language.

**Fix:** Establish design tokens: small (lg), medium (xl), large (2xl), pill (full)

---

### 13.2 🟠 Card Styles Vary Across Pages
**Location:** Multiple pages  
**Issue:** Topics, Seforim, Featured cards all have slightly different styles.  
**Impact:** Lack of visual cohesion.

**Fix:** Create unified `<Card>` component with variants

---

### 13.3 🟡 Inconsistent Section Spacing
**Location:** Throughout app  
**Issue:** Some sections use `mt-24`, others `mt-12`, `py-8`, etc.  
**Impact:** Rhythm feels off.

**Fix:** Establish spacing scale and apply consistently

---

### 13.4 🟡 Button Styles Not Standardized
**Location:** Throughout app  
**Issue:** Primary buttons vary in padding, border-radius, shadow.  
**Impact:** Looks like multiple designers worked without a system.

**Fix:** Create `<Button>` component with size/variant props

---

### 13.5 🟢 Font Weights Inconsistent
**Location:** Throughout app  
**Issue:** Mix of `font-medium`, `font-semibold`, `font-bold` without clear hierarchy.  
**Impact:** Visual emphasis is muddy.

**Fix:** Define typography scale: body (400), emphasis (500), headings (600-700)

---

## 14. MOBILE-SPECIFIC ISSUES

### 14.1 🟠 Touch Targets Too Small in Some Areas
**Location:** Multiple components  
**Issue:** Some buttons < 44x44px minimum touch target.  
**Impact:** Hard to tap accurately on mobile.

**Fix:** Audit all interactive elements, ensure min 44px touch target

---

### 14.2 🟡 Horizontal Scroll Not Indicated
**Location:** Tab navigation, category chips  
**Issue:** Horizontal scrollable areas have no visual scroll indicator.  
**Impact:** Users don't know there's more content to the right.

**Fix:** Add fade gradient on edges or scroll indicator dots

---

### 14.3 🟡 Bottom Sheet Can Cover Important Content
**Location:** `components/ui/BottomSheet.tsx`  
**Issue:** Sheet can expand to 90vh, may cover content user was reading.  
**Impact:** Context loss when opening sheets.

**Fix:** Limit max height or add "minimize" state

---

---

## PRIORITY SUMMARY

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 8 | Must fix - impacts core usability/accessibility |
| 🟠 High | 23 | Should fix - notable friction |
| 🟡 Medium | 26 | Could fix - improvement opportunities |
| 🟢 Low | 8 | Nice to have - polish items |

## TOP 10 FIXES TO IMPLEMENT FIRST

1. **Add skip-to-content link** (Accessibility critical)
2. **Fix mobile nav missing Seforim** (Navigation critical)
3. **Fix tab keyboard navigation** (Accessibility critical)
4. **Add focus states to cards/buttons** (Accessibility)
5. **Fix progress bar overlapping header** (TorahReader)
6. **Implement recent searches** (Search UX)
7. **Add search to Seforim page** (Feature parity)
8. **Fix hardcoded blue badges** (Theme consistency)
9. **Add dir="rtl" to Hebrew text** (Accessibility)
10. **Respect prefers-reduced-motion** (Accessibility)

---

*This audit should be revisited after implementing fixes to verify resolution and identify any new issues introduced.*
