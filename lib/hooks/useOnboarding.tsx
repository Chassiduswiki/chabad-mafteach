'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ONBOARDING SYSTEM DOCUMENTATION
 * ==============================
 *
 * This onboarding system provides contextual guidance to help users discover
 * and understand app features. It's designed to be maintainable and extensible.
 *
 * ARCHITECTURE:
 * 1. OnboardingProvider - Global state management and coordination
 * 2. OnboardingStep - Individual tooltip/guide components
 * 3. useOnboarding hook - Easy access to onboarding state
 * 4. localStorage persistence - Remembers what users have seen
 *
 * USAGE PATTERNS:
 * - Progressive hints: Show basic features first, advanced later
 * - Contextual tooltips: Appear when users interact with specific elements
 * - Guided tours: Step-by-step walkthroughs for complex workflows
 * - Conditional display: Show based on user behavior or app state
 *
 * MAINTENANCE GUIDE:
 * 1. Add new steps to ONBOARDING_STEPS constant below
 * 2. Use useOnboarding hook in components that need onboarding
 * 3. Call markCompleted(stepId) when user completes an onboarding action
 * 4. Update step definitions when UI changes require it
 * 5. Test onboarding flow after major feature changes
 *
 * STEP DEFINITIONS:
 * Each step should include:
 * - id: Unique identifier
 * - title: Brief, action-oriented title
 * - description: Clear explanation of what to do
 * - target: CSS selector or component ref for positioning
 * - placement: 'top', 'bottom', 'left', 'right', 'center'
 * - showWhen: Function that returns true when step should appear
 * - prerequisites: Array of step IDs that must be completed first
 * - priority: Number (higher = more important, shown first)
 * - autoAdvance: Boolean - automatically complete after user interaction
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector or component identifier
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showWhen?: () => boolean;
  prerequisites?: string[];
  priority: number;
  autoAdvance?: boolean;
  ctaText?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  // Welcome and basic discovery
  {
    id: 'welcome-search',
    title: 'Start Your Journey',
    description: 'Use Cmd+K (Mac) or Ctrl+K (Windows) to search concepts, sources, and topics instantly.',
    placement: 'center',
    priority: 100,
    showWhen: () => true, // Always show for new users
    ctaText: 'Try Search Now'
  },
  {
    id: 'explore-topics',
    title: 'Discover Concepts',
    description: 'Browse through foundational Chassidic concepts below, each with sources and explanations.',
    target: '[data-onboarding="explore-section"]',
    placement: 'bottom',
    priority: 90,
    prerequisites: ['welcome-search'],
    ctaText: 'Explore Topics'
  },
  // Feature-specific onboarding (add as features are built)
  // {
  //   id: 'try-bookmarking',
  //   title: 'Save for Later',
  //   description: 'Click the bookmark icon on any topic to save it to your collections.',
  //   target: '[data-bookmark-button]',
  //   placement: 'top',
  //   priority: 70,
  //   prerequisites: ['explore-topics'],
  //   autoAdvance: true,
  //   ctaText: 'Got it'
  // }
];

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  completedSteps: Set<string>;
  isActive: boolean;
  markCompleted: (stepId: string) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  nextStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);

  // Load completed steps from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chabad-mafteach:onboarding-completed');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCompletedSteps(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse onboarding data:', e);
        localStorage.removeItem('chabad-mafteach:onboarding-completed');
      }
    }

    // Check if user has seen basic onboarding
    const hasSeenBasic = localStorage.getItem('chabad-mafteach:has-seen-hints');
    setIsActive(!hasSeenBasic);
  }, []);

  // Save completed steps to localStorage
  useEffect(() => {
    localStorage.setItem('chabad-mafteach:onboarding-completed', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  const markCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const skipOnboarding = () => {
    setIsActive(false);
    localStorage.setItem('chabad-mafteach:has-seen-hints', 'true');
  };

  const resetOnboarding = () => {
    setCompletedSteps(new Set());
    setIsActive(true);
    localStorage.removeItem('chabad-mafteach:onboarding-completed');
    localStorage.removeItem('chabad-mafteach:has-seen-hints');
  };

  // Find the next available step based on priority and prerequisites
  const getCurrentStep = (): OnboardingStep | null => {
    if (!isActive) return null;

    const availableSteps = ONBOARDING_STEPS
      .filter(step => {
        // Check prerequisites
        if (step.prerequisites) {
          return step.prerequisites.every(prereq => completedSteps.has(prereq));
        }
        return true;
      })
      .filter(step => !completedSteps.has(step.id))
      .filter(step => !step.showWhen || step.showWhen())
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    return availableSteps[0] || null;
  };

  const currentStep = getCurrentStep();

  const nextStep = () => {
    if (currentStep) {
      markCompleted(currentStep.id);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      currentStep,
      completedSteps,
      isActive,
      markCompleted,
      skipOnboarding,
      resetOnboarding,
      nextStep
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}
