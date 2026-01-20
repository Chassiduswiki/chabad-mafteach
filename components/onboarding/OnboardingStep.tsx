'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding, OnboardingStep as OnboardingStepType } from '@/lib/hooks/useOnboarding';

// Lazy load icons to prevent HMR issues
const X = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.X })));
const ArrowRight = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowRight })));
const Check = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Check })));

// Icon wrapper component
function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="w-5 h-5" />}>
      {children}
    </Suspense>
  );
}

/**
 * ONBOARDING STEP COMPONENT
 *
 * Renders individual onboarding tooltips and guides.
 * Automatically positions itself relative to target elements.
 *
 * USAGE:
 * <OnboardingStep step={currentStep} onComplete={() => markCompleted(step.id)} />
 *
 * POSITIONING:
 * - Uses target element's bounding rect for positioning
 * - Fallbacks gracefully if target not found
 * - Supports all placement options: top, bottom, left, right, center
 *
 * INTERACTIONS:
 * - Click outside to dismiss
 * - CTA button advances to next step
 * - Close button skips current step
 * - Auto-advance for certain interactions
 */

interface OnboardingStepProps {
  step: OnboardingStepType;
  onComplete: () => void;
}

export function OnboardingStep({ step, onComplete }: OnboardingStepProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { skipOnboarding } = useOnboarding();

  useEffect(() => {
    const updatePosition = () => {
      if (!step.target) {
        // Center positioning for welcome messages
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200
        });
        setIsVisible(true);
        return;
      }

      const targetElement = document.querySelector(step.target);
      if (!targetElement) {
        console.warn(`Onboarding target not found: ${step.target}`);
        setIsVisible(false);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const tooltipHeight = 200; // Approximate height
      const tooltipWidth = 400; // Approximate width

      let top = 0;
      let left = 0;

      switch (step.placement) {
        case 'top':
          top = rect.top - tooltipHeight - 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 10;
          break;
        case 'center':
        default:
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
      }

      // Keep within viewport bounds
      top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
      left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

      setPosition({ top, left });
      setIsVisible(true);
    };

    // Delay positioning to allow DOM to settle
    const timer = setTimeout(updatePosition, 100);

    // Update position on resize
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step.target, step.placement]);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300); // Allow exit animation
  };

  const handleSkip = () => {
    setIsVisible(false);
    skipOnboarding();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20"
            onClick={handleSkip}
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[100] w-96 max-w-[90vw]"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <div className="bg-background border border-border rounded-lg shadow-lg p-6 relative">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-accent transition-colors"
                aria-label="Skip onboarding"
              >
                <IconWrapper>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconWrapper>
              </button>

              {/* Progress indicator (if multiple steps) */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '30%' }} />
                </div>
                <span className="text-xs text-muted-foreground">1 of 3</span>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>

                {/* CTA Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {step.ctaText || 'Got it'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Arrow pointing to target (if not center) */}
              {step.placement !== 'center' && (
                <div
                  className={`absolute w-3 h-3 bg-background border-${step.placement === 'top' ? 'b' : step.placement === 'bottom' ? 't' : step.placement === 'left' ? 'r' : 'l'} border-border transform rotate-45`}
                  style={{
                    ...(step.placement === 'top' && { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
                    ...(step.placement === 'bottom' && { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
                    ...(step.placement === 'left' && { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }),
                    ...(step.placement === 'right' && { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }),
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
