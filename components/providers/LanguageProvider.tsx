'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLanguagePreference, SUPPORTED_LANGUAGES, LanguageInfo } from '@/lib/hooks/useLanguagePreference';

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  isLoaded: boolean;
  currentLanguageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Provider for site-wide language preference
 * Wrap your app with this to access language context anywhere
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const languageState = useLanguagePreference();

  return (
    <LanguageContext.Provider value={languageState}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Must be used within a LanguageProvider
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}

/**
 * Hook that safely accesses language context
 * Returns default values if not within provider (for SSR/testing)
 */
export function useLanguageSafe(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    // Return default values for SSR or when outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      isLoaded: false,
      currentLanguageInfo: SUPPORTED_LANGUAGES[0],
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRTL: false,
    };
  }

  return context;
}
