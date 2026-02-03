'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'preferred-language';
const DEFAULT_LANGUAGE = 'en';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
];

/**
 * Hook for managing site-wide language preference
 * Persists to localStorage and syncs with URL params
 */
export function useLanguagePreference() {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage or URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL param first (allows sharing links with specific language)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');

    // Then check localStorage
    const storedLang = localStorage.getItem(STORAGE_KEY);

    // Priority: URL param > localStorage > default
    const initialLang = urlLang || storedLang || DEFAULT_LANGUAGE;

    // Validate that it's a supported language
    const isValid = SUPPORTED_LANGUAGES.some(l => l.code === initialLang);
    const validLang = isValid ? initialLang : DEFAULT_LANGUAGE;

    setLanguageState(validLang);
    setIsLoaded(true);

    // If URL had a language, also save it to localStorage
    if (urlLang && isValid) {
      localStorage.setItem(STORAGE_KEY, validLang);
    }
  }, []);

  // Update language and persist
  const setLanguage = useCallback((newLang: string) => {
    // Validate
    const isValid = SUPPORTED_LANGUAGES.some(l => l.code === newLang);
    if (!isValid) {
      console.warn(`Invalid language code: ${newLang}`);
      return;
    }

    setLanguageState(newLang);

    if (typeof window !== 'undefined') {
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, newLang);

      // Update URL without navigation (for shareability)
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.history.replaceState({}, '', url.toString());

      // Update HTML lang attribute
      document.documentElement.lang = newLang;

      // Update dir attribute for RTL languages
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === newLang);
      if (langInfo) {
        document.documentElement.dir = langInfo.direction;
      }
    }
  }, []);

  // Get full language info
  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return {
    language,
    setLanguage,
    isLoaded,
    currentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: currentLanguageInfo.direction === 'rtl',
  };
}
