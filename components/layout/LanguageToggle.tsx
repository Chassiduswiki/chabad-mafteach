'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageSafe } from '@/components/providers/LanguageProvider';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

/**
 * Compact language toggle for the nav bar
 * Shows current language code and allows switching
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage, supportedLanguages, isLoaded } = useLanguageSafe();

  if (!isLoaded) {
    return (
      <div className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground",
        className
      )}>
        <Globe className="h-4 w-4 animate-pulse" />
      </div>
    );
  }

  const menuItems = supportedLanguages.map((lang) => ({
    label: `${lang.name} (${lang.nativeName})`,
    onClick: () => setLanguage(lang.code),
  }));

  return (
    <DropdownMenu
      items={menuItems}
      align="right"
      trigger={
        <span className={cn(
          "inline-flex items-center gap-1.5",
          className
        )}>
          <Globe className="h-4 w-4" />
          <span className="uppercase text-xs font-bold tracking-wider">
            {language}
          </span>
        </span>
      }
    />
  );
}

/**
 * Even more compact version - just the language code
 * For 2 languages, toggles directly without dropdown
 */
export function LanguageToggleCompact({ className }: LanguageToggleProps) {
  const { language, setLanguage, supportedLanguages, isLoaded } = useLanguageSafe();

  if (!isLoaded) {
    return null;
  }

  // For just 2 languages, toggle directly without dropdown
  if (supportedLanguages.length === 2) {
    const otherLang = supportedLanguages.find(l => l.code !== language);

    return (
      <button
        onClick={() => otherLang && setLanguage(otherLang.code)}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          "transition-colors text-xs font-medium",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
        aria-label={`Switch to ${otherLang?.name}`}
        title={`Switch to ${otherLang?.name}`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="uppercase font-bold tracking-wider">
          {language}
        </span>
      </button>
    );
  }

  // For more languages, use dropdown
  return <LanguageToggle className={className} />;
}
