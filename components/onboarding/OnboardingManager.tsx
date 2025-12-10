'use client';

import React from 'react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingStep } from './OnboardingStep';

/**
 * ONBOARDING MANAGER
 *
 * Main component that renders the current onboarding step.
 * Should be included in the app layout or main page.
 *
 * USAGE:
 * <OnboardingManager />
 *
 * FEATURES:
 * - Renders current active onboarding step
 * - Handles step progression
 * - Manages global onboarding state
 * - Provides skip/reset functionality (for development)
 */

export function OnboardingManager() {
  const { currentStep, nextStep, skipOnboarding, resetOnboarding } = useOnboarding();

  if (!currentStep) return null;

  return (
    <OnboardingStep
      step={currentStep}
      onComplete={nextStep}
    />
  );
}

/**
 * DEVELOPMENT HELPERS
 *
 * These components are for development/testing only.
 * Remove from production builds.
 */

export function OnboardingDevControls() {
  const { resetOnboarding, skipOnboarding, currentStep, completedSteps } = useOnboarding();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] bg-background border border-border rounded-lg p-3 shadow-lg">
      <div className="text-xs font-mono space-y-2">
        <div>Onboarding Debug</div>
        <div>Current: {currentStep?.id || 'none'}</div>
        <div>Completed: {completedSteps.size}</div>
        <div className="flex gap-2">
          <button
            onClick={resetOnboarding}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            Reset
          </button>
          <button
            onClick={skipOnboarding}
            className="px-2 py-1 bg-yellow-500 text-black rounded text-xs"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
