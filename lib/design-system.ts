/**
 * Design System - Centralized Design Tokens
 * 
 * This file contains all design decisions for consistent UI/UX across the application.
 * Use these tokens instead of hardcoding values to ensure consistency.
 */

// ============ Typography ============
export const typography = {
  // Font families
  fontFamily: {
    sans: 'var(--font-inter)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ============ Spacing ============
export const spacing = {
  // Base unit: 8px
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// ============ Colors ============
export const colors = {
  // Primary (Action colors)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },

  // Neutral (Backgrounds, borders, text)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Success
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#16a34a',
  },

  // Warning
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },

  // Error
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },

  // Info
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },
};

// ============ Shadows ============
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// ============ Border Radius ============
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============ Transitions ============
export const transitions = {
  // Duration
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============ Component Sizes ============
export const componentSizes = {
  // Button sizes
  button: {
    sm: {
      height: '2rem',      // 32px
      padding: '0.5rem 1rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem',    // 40px
      padding: '0.75rem 1.5rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem',      // 48px
      padding: '1rem 2rem',
      fontSize: typography.fontSize.lg,
    },
  },

  // Input sizes
  input: {
    sm: {
      height: '2rem',
      padding: '0.5rem 0.75rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0.75rem 1rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '1rem 1.25rem',
      fontSize: typography.fontSize.lg,
    },
  },

  // Icon sizes
  icon: {
    xs: '1rem',      // 16px
    sm: '1.25rem',   // 20px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '2.5rem',    // 40px
  },
};

// ============ Z-Index Scale ============
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ============ Breakpoints ============
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============ Content Widths ============
export const contentWidths = {
  narrow: '42rem',    // 672px
  normal: '56rem',    // 896px
  wide: '80rem',      // 1280px
  full: '100%',
};

// ============ Semantic Color Tokens ============
export const semanticColors = {
  // Background
  background: 'var(--background)',
  backgroundSecondary: 'var(--background-secondary)',
  backgroundTertiary: 'var(--background-tertiary)',

  // Foreground
  foreground: 'var(--foreground)',
  foregroundSecondary: 'var(--foreground-secondary)',
  foregroundMuted: 'var(--foreground-muted)',

  // Border
  border: 'var(--border)',
  borderLight: 'var(--border-light)',

  // Interactive
  primary: 'var(--primary)',
  primaryHover: 'var(--primary-hover)',
  primaryActive: 'var(--primary-active)',

  // Status
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  info: 'var(--info)',
};

// ============ Animation Presets ============
export const animations = {
  fadeIn: {
    duration: transitions.duration.base,
    easing: transitions.easing.easeOut,
  },
  slideIn: {
    duration: transitions.duration.base,
    easing: transitions.easing.easeOut,
  },
  bounce: {
    duration: transitions.duration.slow,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  pulse: {
    duration: '2s',
    easing: transitions.easing.linear,
  },
};

// ============ Utility Functions ============
export const designUtils = {
  /**
   * Get responsive spacing value
   * @param mobile - Mobile value
   * @param tablet - Tablet value (optional)
   * @param desktop - Desktop value (optional)
   */
  responsive: (mobile: string, tablet?: string, desktop?: string) => ({
    mobile,
    tablet: tablet || mobile,
    desktop: desktop || tablet || mobile,
  }),

  /**
   * Create a transition string
   * @param properties - CSS properties to transition
   * @param duration - Duration from transitions.duration
   * @param easing - Easing from transitions.easing
   */
  transition: (properties: string[], duration: string, easing: string) =>
    properties.map(prop => `${prop} ${duration} ${easing}`).join(', '),

  /**
   * Create a box shadow string
   * @param shadows - Shadow values to combine
   */
  boxShadow: (...shadowValues: string[]) => shadowValues.join(', '),
};
