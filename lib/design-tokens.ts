/**
 * Design Tokens - Typography, Spacing, and Animation Presets
 * 
 * Philosophy: 
 * - Typography carries hierarchy through weight, not color
 * - Generous whitespace lets content breathe
 * - Subtle animations create polish without distraction
 * 
 * Inspired by Obsidian's clean, focused design language.
 */

// ===================
// TYPOGRAPHY SCALE
// ===================
// Based on a 1.25 ratio (Major Third) with 16px base
export const typography = {
  // Font families
  fonts: {
    sans: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    hebrew: '"Frank Ruhl Libre", "Noto Serif Hebrew", "David Libre", serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },

  // Font sizes (rem)
  sizes: {
    xs: '0.75rem',     // 12px - captions, badges
    sm: '0.875rem',    // 14px - secondary text, metadata
    base: '1rem',      // 16px - body text
    lg: '1.125rem',    // 18px - lead paragraphs
    xl: '1.25rem',     // 20px - section headers
    '2xl': '1.5rem',   // 24px - card titles
    '3xl': '1.875rem', // 30px - page subtitles
    '4xl': '2.25rem',  // 36px - page titles (mobile)
    '5xl': '3rem',     // 48px - hero titles
    '6xl': '3.75rem',  // 60px - hero titles (desktop)
  },

  // Font weights - hierarchy through weight
  weights: {
    normal: '400',     // Body text, descriptions
    medium: '500',     // Section headers, emphasized text
    semibold: '600',   // Card titles, navigation items
    bold: '700',       // Page titles, hero text
  },

  // Line heights
  leading: {
    none: '1',
    tight: '1.1',      // Headlines
    snug: '1.25',      // Subheadings
    normal: '1.5',     // Body text (default)
    relaxed: '1.625',  // Long-form reading
    loose: '2',        // Spaced lists
  },

  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em', // Headlines
    normal: '0',
    wide: '0.025em',   // All-caps labels
    wider: '0.05em',
    widest: '0.1em',   // Small caps
  },
} as const;

// ===================
// SPACING SCALE
// ===================
// 8px base unit with consistent multipliers
export const spacing = {
  // Core scale (in pixels, use with Tailwind arbitrary values or CSS)
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px  - base unit
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px - 2x base
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px - 3x base
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px - 4x base
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px - 6x base (section spacing)
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px - 8x base (major section spacing)
  20: '5rem',       // 80px
  24: '6rem',       // 96px - hero spacing
  28: '7rem',       // 112px
  32: '8rem',       // 128px

  // Semantic spacing tokens
  section: {
    sm: '2rem',      // 32px - tight sections
    md: '3rem',      // 48px - standard sections
    lg: '4rem',      // 64px - major sections
    xl: '6rem',      // 96px - hero/landing sections
  },

  card: {
    sm: '1rem',      // 16px - compact cards
    md: '1.5rem',    // 24px - standard cards
    lg: '2rem',      // 32px - feature cards
  },

  stack: {
    xs: '0.5rem',    // 8px - tight stack (inline elements)
    sm: '0.75rem',   // 12px - close relationship
    md: '1rem',      // 16px - related items
    lg: '1.5rem',    // 24px - distinct items
    xl: '2rem',      // 32px - separate groups
  },
} as const;

// ===================
// ANIMATION PRESETS
// ===================
// Subtle, purposeful animations
export const animations = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',     // UI feedback (hover, focus)
    normal: '200ms',   // Standard transitions
    slow: '300ms',     // Content transitions
    slower: '500ms',   // Page transitions
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom easings for specific effects
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // Framer Motion presets
  framer: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    fadeInUp: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    fadeInScale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2 },
    },
    slideInRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.3 },
    },
    staggerChildren: {
      animate: { transition: { staggerChildren: 0.05 } },
    },
  },

  // Hover effects
  hover: {
    lift: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    glow: {
      boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.15)',
    },
    subtle: {
      scale: 1.01,
      transition: { duration: 0.15 },
    },
  },

  // Active/pressed states
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
} as const;

// ===================
// COLOR SEMANTIC TOKENS
// ===================
// Purposeful color application
export const colors = {
  // Interactive states
  interactive: {
    default: 'hsl(var(--primary))',
    hover: 'hsl(var(--primary) / 0.9)',
    active: 'hsl(var(--primary) / 0.8)',
    disabled: 'hsl(var(--muted-foreground) / 0.5)',
  },

  // Status colors
  status: {
    success: 'hsl(142 76% 36%)',  // Green
    warning: 'hsl(38 92% 50%)',   // Amber
    error: 'hsl(0 84% 60%)',      // Red
    info: 'hsl(217 91% 60%)',     // Blue
  },

  // Content depth indicators (for topic completeness)
  depth: {
    comprehensive: 'hsl(142 76% 36%)',  // Green - rich content
    partial: 'hsl(38 92% 50%)',          // Amber - some content
    minimal: 'hsl(var(--muted-foreground))', // Gray - limited content
  },

  // Category accent colors
  categories: {
    concept: 'hsl(217 91% 60%)',     // Blue
    practice: 'hsl(142 76% 36%)',    // Green
    personality: 'hsl(280 68% 60%)', // Purple
    text: 'hsl(38 92% 50%)',         // Amber
    event: 'hsl(0 84% 60%)',         // Red
  },
} as const;

// ===================
// COMPONENT PRESETS
// ===================
// Consistent component styling
export const components = {
  // Card variants
  card: {
    base: {
      borderRadius: '1rem',      // 16px
      padding: spacing.card.md,
      border: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))',
    },
    elevated: {
      borderRadius: '1.5rem',    // 24px
      padding: spacing.card.lg,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    interactive: {
      cursor: 'pointer',
      transition: `all ${animations.duration.normal} ${animations.easing.easeOut}`,
    },
  },

  // Button sizes
  button: {
    sm: {
      height: '2rem',           // 32px
      padding: '0 0.75rem',
      fontSize: typography.sizes.sm,
    },
    md: {
      height: '2.5rem',         // 40px
      padding: '0 1rem',
      fontSize: typography.sizes.base,
    },
    lg: {
      height: '3rem',           // 48px
      padding: '0 1.5rem',
      fontSize: typography.sizes.lg,
    },
  },

  // Input fields
  input: {
    height: '2.75rem',          // 44px - touch-friendly
    borderRadius: '0.75rem',    // 12px
    padding: '0 1rem',
  },
} as const;

// ===================
// TAILWIND CLASS HELPERS
// ===================
// Pre-composed Tailwind classes for common patterns
export const tw = {
  // Typography compositions
  heading: {
    hero: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight',
    page: 'text-3xl sm:text-4xl font-bold tracking-tight',
    section: 'text-2xl font-bold tracking-tight',
    card: 'text-xl font-semibold',
    label: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  },

  // Body text
  body: {
    default: 'text-base text-foreground leading-relaxed',
    secondary: 'text-sm text-muted-foreground',
    small: 'text-xs text-muted-foreground',
  },

  // Card compositions
  card: {
    base: 'rounded-2xl border border-border bg-card p-6',
    interactive: 'rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
    elevated: 'rounded-3xl border border-border bg-card p-8 shadow-lg',
  },

  // Layout helpers
  section: {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  },

  // Focus states (accessibility)
  focus: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',

  // Transitions
  transition: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
  },
} as const;

// Type exports
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Animations = typeof animations;
export type Colors = typeof colors;
export type Components = typeof components;
export type TailwindHelpers = typeof tw;
