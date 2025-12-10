'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, BookOpen, Sparkles, X, ArrowUp } from 'lucide-react';

export default function OnboardingHints() {
  const [currentHint, setCurrentHint] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenHints, setHasSeenHints] = useState(false);

  const hints = [
    {
      icon: Search,
      title: "Start with Search",
      description: "Press Cmd+K (Mac) or Ctrl+K (Windows) to search concepts, sources, and topics instantly.",
      action: "Try it now!",
      highlight: "search"
    },
    {
      icon: BookOpen,
      title: "Explore Topics",
      description: "Browse through foundational Chassidic concepts below, each with sources and explanations.",
      action: "Browse topics",
      highlight: "topics"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Discovery",
      description: "Our intelligent search understands context and connects related concepts across all Chabad literature.",
      action: "Get started",
      highlight: "features"
    }
  ];

  useEffect(() => {
    // Check if user has seen hints before
    const seen = localStorage.getItem('chabad-mafteach:has-seen-hints');
    if (!seen) {
      // Show hints after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenHints(true);
    }
  }, []);

  const dismissHints = () => {
    setIsVisible(false);
    localStorage.setItem('chabad-mafteach:has-seen-hints', 'true');
  };

  const nextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    } else {
      dismissHints();
    }
  };

  const prevHint = () => {
    if (currentHint > 0) {
      setCurrentHint(currentHint - 1);
    }
  };

  if (hasSeenHints || !isVisible) return null;

  const currentHintData = hints[currentHint];
  const Icon = currentHintData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-8 w-full max-w-lg mx-auto"
      >
        <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg shadow-primary/5">
          {/* Close button */}
          <button
            onClick={dismissHints}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Dismiss hints"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {hints.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentHint ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Hint content */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              {currentHintData.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {currentHintData.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              {currentHint > 0 && (
                <button
                  onClick={prevHint}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUp className="h-3 w-3 rotate-270" />
                  Previous
                </button>
              )}

              <button
                onClick={nextHint}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {currentHintData.action}
                {currentHint < hints.length - 1 && (
                  <ArrowUp className="h-4 w-4 rotate-90" />
                )}
              </button>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          {currentHint === 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <span>Pro tip:</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘K</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
