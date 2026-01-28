# Hiding Sources Components (January 2026 Shift)

This document details the changes made in January 2026 to temporarily hide the "sources" (Seforim/Reader) side of the platform to focus on the "Digital Chassidus Encyclopedia" (Topics).

## Summary of Changes

To focus on the Encyclopedia, we have commented out entry points and components related to Seforim, Explore (Zen mode), and Citations.

## Affected Files & Reinstatement Instructions

### 1. Desktop Navigation
**File**: [app/page.tsx](file:///Users/yitzchok/Documents/Directus/chabad-research/app/page.tsx)
- **What was changed**: Commented out the "Sources" and "Explore" links in the main `<nav>` component.
- **To Reinstate**: Search for `Sources` or `Explore` in the file and uncomment the `<Link>` components.

### 2. Mobile Bottom Navigation
**File**: [components/mobile/MobileNav.tsx](file:///Users/yitzchok/Documents/Directus/chabad-research/components/mobile/MobileNav.tsx)
- **What was changed**: Commented out the "Explore" and "Saved" (Collections) buttons in the mobile bottom bar.
- **To Reinstate**: Uncomment the `<Link>` components for `/explore` and `/collections`.

### 3. Mobile Homepage Dashboard
**File**: [components/mobile/MobileHome.tsx](file:///Users/yitzchok/Documents/Directus/chabad-research/components/mobile/MobileHome.tsx)
- **What was changed**: Commented out the "Explore" and "Sources" quick action cards.
- **To Reinstate**: Uncomment the `<Link>` components within the "Quick Action Cards" section.

### 4. Homepage Discovery Section
**File**: [components/features/home/ContentDiscovery.tsx](file:///Users/yitzchok/Documents/Directus/chabad-research/components/features/home/ContentDiscovery.tsx)
- **What was changed**: Commented out the "New Seforim" (Recent Sources) section.
- **To Reinstate**: Uncomment the `{(data.recentSources || []).length > 0 && ...}` block.

### 5. Topic Detail Page Tabs
**File**: [components/topics/TopicTabs.tsx](file:///Users/yitzchok/Documents/Directus/chabad-research/components/topics/TopicTabs.tsx)
- **What was changed**: Commented out the "Citations" tab definition in the `tabs` array.
- **To Reinstate**: Uncomment the `{ id: 'sources', label: 'Citations', ... }` object in the `tabs` array.

## Roadmap Reference
The pivot strategy is also documented in [Documentation/Longterm-tasks](file:///Users/yitzchok/Documents/Directus/chabad-research/Documentation/Longterm-tasks) under the **JANUARY 2026 PIVOT** section.

---

*Last Updated: January 19, 2026*
