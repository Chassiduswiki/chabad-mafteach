/**
 * Framer Motion Animation Presets
 * 
 * Consistent, subtle animations for a polished feel.
 * Import these presets into components for consistent micro-interactions.
 * 
 * Usage:
 * ```tsx
 * import { fadeInUp, staggerContainer, hoverLift } from '@/lib/animations';
 * 
 * <motion.div {...fadeInUp}>Content</motion.div>
 * <motion.div variants={staggerContainer} initial="hidden" animate="show">
 *   <motion.div variants={fadeInUp}>Item 1</motion.div>
 * </motion.div>
 * ```
 */

import { Variants, TargetAndTransition, Transition } from 'framer-motion';

// ===================
// TIMING CONSTANTS
// ===================
export const timing = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const;

export const easing = {
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
};

// ===================
// FADE ANIMATIONS
// ===================

/** Simple fade in */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: timing.normal, ease: easing.easeOut },
};

/** Fade in from below (most common) */
export const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: timing.slow, ease: easing.easeOut },
};

/** Fade in from above */
export const fadeInDown = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: timing.slow, ease: easing.easeOut },
};

/** Fade in with scale */
export const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: timing.normal, ease: easing.easeOut },
};

/** Fade in from right (for slide-in panels) */
export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: timing.slow, ease: easing.easeOut },
};

/** Fade in from left */
export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: timing.slow, ease: easing.easeOut },
};

// ===================
// STAGGER ANIMATIONS
// ===================

/** Container for staggered children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/** Fast stagger for lists */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

/** Slow stagger for hero sections */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/** Child item for stagger containers */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: timing.slow, ease: easing.easeOut },
  },
};

/** Child item with scale */
export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
};

// ===================
// HOVER ANIMATIONS
// ===================

/** Subtle lift on hover (cards, buttons) */
export const hoverLift: TargetAndTransition = {
  y: -2,
  transition: { duration: timing.fast, ease: easing.easeOut },
};

/** Scale up on hover */
export const hoverScale: TargetAndTransition = {
  scale: 1.02,
  transition: { duration: timing.fast, ease: easing.easeOut },
};

/** Subtle scale for touch targets */
export const hoverScaleSubtle: TargetAndTransition = {
  scale: 1.01,
  transition: { duration: timing.fast, ease: easing.easeOut },
};

/** Glow effect on hover (requires CSS variable --primary-rgb) */
export const hoverGlow: TargetAndTransition = {
  boxShadow: '0 0 20px rgba(var(--primary-rgb, 0, 0, 0), 0.15)',
  transition: { duration: timing.normal, ease: easing.easeOut },
};

// ===================
// TAP/PRESS ANIMATIONS
// ===================

/** Press feedback for buttons */
export const tapScale: TargetAndTransition = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

/** Stronger press feedback */
export const tapScaleStrong: TargetAndTransition = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// ===================
// PAGE TRANSITIONS
// ===================

/** Page enter animation */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: timing.slow, ease: easing.easeOut },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: timing.normal, ease: easing.easeIn },
  },
};

// ===================
// MODAL/OVERLAY ANIMATIONS
// ===================

/** Modal backdrop */
export const backdropAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Modal content (center popup) */
export const modalAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: timing.fast, ease: easing.easeIn },
  },
};

/** Bottom sheet animation */
export const bottomSheetAnimation: Variants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { duration: timing.slow, ease: easing.easeOut },
  },
  exit: { 
    y: '100%',
    transition: { duration: timing.normal, ease: easing.easeIn },
  },
};

/** Slide-in panel (from right) */
export const slidePanelAnimation: Variants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: { duration: timing.slow, ease: easing.easeOut },
  },
  exit: { 
    x: '100%',
    transition: { duration: timing.normal, ease: easing.easeIn },
  },
};

// ===================
// UTILITY FUNCTIONS
// ===================

/**
 * Create a delayed version of an animation
 */
export function withDelay<T extends { transition?: Transition }>(
  animation: T, 
  delay: number
): T {
  return {
    ...animation,
    transition: {
      ...animation.transition,
      delay,
    },
  };
}

/**
 * Create stagger children effect for any container
 */
export function createStaggerContainer(
  staggerDelay: number = 0.05,
  initialDelay: number = 0
): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };
}

/**
 * Common animation props for list items with index-based delay
 */
export function getListItemAnimation(index: number, baseDelay: number = 0) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: timing.slow, 
        delay: baseDelay + index * 0.05,
        ease: easing.easeOut,
      },
    },
  };
}

// ===================
// COMPONENT PRESETS
// ===================

/**
 * Pre-configured animation props for common use cases
 * Use with spread: <motion.div {...presets.card}>
 */
export const presets = {
  /** Interactive card with hover and tap */
  card: {
    whileHover: hoverLift,
    whileTap: tapScale,
    transition: { duration: timing.normal, ease: easing.easeOut },
  },
  
  /** Button with press feedback */
  button: {
    whileHover: hoverScale,
    whileTap: tapScale,
    transition: { duration: timing.fast, ease: easing.easeOut },
  },
  
  /** Subtle interactive element */
  subtle: {
    whileHover: hoverScaleSubtle,
    whileTap: { scale: 0.99 },
    transition: { duration: timing.fast, ease: easing.easeOut },
  },
  
  /** Link with underline animation (use with custom CSS) */
  link: {
    whileHover: { opacity: 0.8 },
    whileTap: { opacity: 0.6 },
    transition: { duration: timing.fast },
  },
} as const;

// Type exports
export type AnimationPreset = keyof typeof presets;
