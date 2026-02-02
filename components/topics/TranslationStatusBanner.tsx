'use client';

import React from 'react';
import { Info, Sparkles, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslationStatusBannerProps {
  currentLanguage: string;
  requestedLanguage: string;
  isFallback: boolean;
  translationQuality?: string;
  isMachineTranslated?: boolean;
  className?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  he: 'Hebrew',
};

/**
 * Banner that shows when viewing fallback content
 * or when content is machine-translated
 */
export function TranslationStatusBanner({
  currentLanguage,
  requestedLanguage,
  isFallback,
  translationQuality,
  isMachineTranslated,
  className,
}: TranslationStatusBannerProps) {
  // Don't show banner if viewing content in requested language
  if (!isFallback && !isMachineTranslated && translationQuality !== 'needs_translation') {
    return null;
  }

  const requestedLangName = LANGUAGE_NAMES[requestedLanguage] || requestedLanguage;
  const currentLangName = LANGUAGE_NAMES[currentLanguage] || currentLanguage;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg text-sm",
        isFallback
          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
          : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="shrink-0 mt-0.5">
        {isFallback ? (
          <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        ) : isMachineTranslated ? (
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        {isFallback ? (
          <>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Content not yet available in {requestedLangName}
            </p>
            <p className="text-amber-700 dark:text-amber-300/80">
              Showing {currentLangName} content. Want to help translate?{' '}
              <a
                href="#contribute"
                className="underline hover:no-underline"
              >
                Contribute a translation
              </a>
            </p>
          </>
        ) : isMachineTranslated ? (
          <>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Machine-translated content
            </p>
            <p className="text-blue-700 dark:text-blue-300/80">
              This translation was generated automatically and may contain errors.
            </p>
          </>
        ) : translationQuality === 'needs_translation' ? (
          <>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Translation in progress
            </p>
            <p className="text-blue-700 dark:text-blue-300/80">
              Some content on this page is being translated.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Compact inline badge for translation status
 */
export function TranslationStatusBadge({
  translationQuality,
  isMachineTranslated,
  className,
}: {
  translationQuality?: string;
  isMachineTranslated?: boolean;
  className?: string;
}) {
  if (!translationQuality && !isMachineTranslated) return null;

  if (isMachineTranslated) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
          "text-[10px] font-medium uppercase tracking-wider",
          className
        )}
        title="This content was machine-translated"
      >
        <Sparkles className="w-3 h-3" />
        Auto-translated
      </span>
    );
  }

  if (translationQuality === 'needs_translation') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
          "text-[10px] font-medium uppercase tracking-wider",
          className
        )}
        title="This content needs translation"
      >
        <Globe className="w-3 h-3" />
        Needs translation
      </span>
    );
  }

  if (translationQuality === 'human_verified') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
          "text-[10px] font-medium uppercase tracking-wider",
          className
        )}
        title="Verified by human translator"
      >
        Verified
      </span>
    );
  }

  return null;
}
