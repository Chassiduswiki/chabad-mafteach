# UI/UX Spacing & Cohesion Guide

## Philosophy
The UI should feel cohesive with **no jarring gaps**. Spacing is subtle and intentional, creating a natural visual rhythm throughout the application.

## Core Spacing Scale

All spacing is based on a **1.5rem (24px) base unit** for section separations and **1rem (16px)** for content relationships.

### Section-Level Spacing
Use these for spacing between major content sections:

```css
.section-sm  { padding: 2rem; }      /* 32px - tight sections */
.section-md  { padding: 3rem; }      /* 48px - standard sections */
.section-lg  { padding: 4rem; }      /* 64px - major sections */
.section-xl  { padding: 6rem; }      /* 96px - hero/landing sections */
```

### Section Separators
For spacing **between** major sections (top and bottom margins):

```css
.section-separator {
  margin-top: 3rem;      /* 48px */
  margin-bottom: 3rem;   /* 48px */
}
```

### Header Spacing
Consistent spacing below headers:

```css
.header-spacing    { margin-bottom: 1.5rem; }  /* 24px - standard headers */
.header-spacing-lg { margin-bottom: 2rem; }    /* 32px - page headers */
```

### Content Spacing
For gaps between content blocks:

```css
.content-spacing    { gap: 1.5rem; }  /* 24px - standard content */
.content-spacing-lg { gap: 2rem; }    /* 32px - larger content */
```

### Vertical Rhythm (Stack Spacing)
For spacing between related items within a container:

```css
.stack-xs > * + * { margin-top: 0.5rem; }   /* 8px - tight items */
.stack-sm > * + * { margin-top: 0.75rem; }  /* 12px - close items */
.stack-md > * + * { margin-top: 1rem; }     /* 16px - related items */
.stack-lg > * + * { margin-top: 1.5rem; }   /* 24px - distinct items */
.stack-xl > * + * { margin-top: 2rem; }     /* 32px - separate groups */
```

### Item Spacing (Subtle)
For spacing between items with no big gaps:

```css
.items-tight > * + * { margin-top: 0.75rem; }   /* 12px */
.items-snug > * + * { margin-top: 1rem; }       /* 16px */
.items-relaxed > * + * { margin-top: 1.5rem; }  /* 24px */
```

## Usage Patterns

### Homepage Layout
```tsx
<main>
  {/* Hero section */}
  <div className="pt-16 sm:pt-20 lg:pt-24">
    <motion.div className="mb-8">Badge</motion.div>
    <h1 className="mt-3">Title</h1>
    <p className="mt-6">Subtitle</p>
    <div className="mt-8">CTA</div>
  </div>

  {/* Content sections */}
  <div className="section-separator">
    <h2 className="header-spacing-lg">Section Title</h2>
    <Content />
  </div>

  <div className="section-separator">
    <h2 className="header-spacing-lg">Another Section</h2>
    <Content />
  </div>
</main>
```

### Topics/List Pages
```tsx
<main>
  <header className="header-spacing-lg">
    <h1>Page Title</h1>
    <p>Subtitle</p>
  </header>

  <div className="items-snug" role="search">
    <SearchComponent />
  </div>

  <div className="items-snug">
    <FeaturedItem />
  </div>

  <div className="items-snug">
    <CategoryChips />
  </div>

  <section>
    <ItemsList />
  </section>
</main>
```

### Content Display Pages
```tsx
<div className="container">
  <header className="header-spacing-lg">
    <h1>Content Title</h1>
  </header>

  <div className="card-padding-lg">
    <div className="stack-md">
      {paragraphs.map(p => <Paragraph key={p.id} {...p} />)}
    </div>
  </div>

  <div className="items-snug">
    <Navigation />
  </div>
</div>
```

## Card Spacing
Consistent padding inside cards:

```css
.card-padding-sm { padding: 1rem; }      /* 16px */
.card-padding-md { padding: 1.5rem; }    /* 24px */
.card-padding-lg { padding: 2rem; }      /* 32px */
```

## Transition Utilities
Smooth, cohesive animations:

```css
.transition-fast   { transition: all 150ms cubic-bezier(0, 0, 0.2, 1); }
.transition-normal { transition: all 200ms cubic-bezier(0, 0, 0.2, 1); }
.transition-slow   { transition: all 300ms cubic-bezier(0, 0, 0.2, 1); }
```

## Hover Effects
Subtle, non-jarring interactions:

```css
.hover-lift {
  transition: transform 200ms, box-shadow 200ms;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hover-scale {
  transition: transform 150ms;
}
.hover-scale:hover {
  transform: scale(1.02);
}
```

## Key Principles

1. **No Arbitrary Values** - Always use the spacing scale above
2. **Consistent Rhythm** - Related items use the same spacing
3. **Subtle Transitions** - Spacing changes should feel natural, not jarring
4. **Responsive** - Spacing scales appropriately on mobile/tablet/desktop
5. **Accessibility** - Respect `prefers-reduced-motion` for animations

## Common Mistakes to Avoid

❌ **Don't mix spacing scales:**
```tsx
<div className="mb-12">Header</div>  {/* 48px */}
<div className="mb-4">Content</div>  {/* 16px - jarring gap! */}
```

✅ **Do use consistent spacing:**
```tsx
<header className="header-spacing-lg">Header</header>  {/* 32px */}
<div className="items-snug">Content</div>              {/* 16px between items */}
```

❌ **Don't hardcode spacing:**
```tsx
<div style={{ marginTop: '2rem' }}>Content</div>
```

✅ **Do use utility classes:**
```tsx
<div className="items-snug">Content</div>
```

## Testing Cohesion

When reviewing pages, ask:
- Are there any sudden large gaps between sections?
- Do related items have consistent spacing?
- Do section transitions feel natural?
- Is the vertical rhythm maintained throughout?

If the answer to any is "no", adjust using the spacing scale above.
