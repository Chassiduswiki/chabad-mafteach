'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Edit3, Search, Settings } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action?: {
    text: string;
    href: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Chabad Mafteach!',
    description: 'Your comprehensive research platform for Chassidic wisdom. Let us show you around the key features.',
    icon: BookOpen,
  },
  {
    id: 'write',
    title: 'Write & Research',
    description: 'Create articles, explanations, and insights with AI assistance. Access the rich editor and smart citation tools.',
    icon: Edit3,
    action: {
      text: 'Try the Editor',
      href: '/editor/write'
    }
  },
  {
    id: 'explore',
    title: 'Explore Topics',
    description: 'Browse and improve topic definitions, boundaries, and explanations. Discover connections between concepts.',
    icon: Search,
    action: {
      text: 'Browse Topics',
      href: '/editor/topics'
    }
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Manage your profile, configure AI settings, and personalize your research environment.',
    icon: Settings,
    action: {
      text: 'Open Settings',
      href: '/profile'
    }
  }
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if user has already seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding) {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleAction = () => {
    const step = onboardingSteps[currentStep];
    if (step.action) {
      handleComplete();
      window.location.href = step.action.href;
    }
  };

  if (!isOpen) return null;

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">Tour ({currentStep + 1}/{onboardingSteps.length})</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="ml-2 hover:bg-primary/80 rounded p-1"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{step.title}</h2>
              <p className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {onboardingSteps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-accent rounded"
              title="Minimize"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.action && (
            <button
              onClick={handleAction}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {step.action.text}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 pb-2">
          <div className="flex gap-1">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is new (has token but hasn't seen onboarding)
    const token = localStorage.getItem('auth_token');
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    if (token && !hasSeenOnboarding) {
      // Delay showing onboarding to let user settle in
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    closeOnboarding,
    completeOnboarding
  };
}
