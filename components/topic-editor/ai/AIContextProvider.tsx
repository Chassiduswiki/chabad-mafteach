'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AIContextType {
  activeSection: string | null;
  hasSelection: boolean;
  selectedText: string;
  isGenerating: boolean;
  setActiveSection: (section: string | null) => void;
  setSelection: (hasSelection: boolean, text?: string) => void;
  setIsGenerating: (generating: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

interface AIContextProviderProps {
  children: ReactNode;
}

export function AIContextProvider({ children }: AIContextProviderProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const setSelection = useCallback((has: boolean, text: string = '') => {
    setHasSelection(has);
    setSelectedText(text);
  }, []);

  return (
    <AIContext.Provider
      value={{
        activeSection,
        hasSelection,
        selectedText,
        isGenerating,
        setActiveSection,
        setSelection,
        setIsGenerating,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAIContext() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIContextProvider');
  }
  return context;
}

export default AIContextProvider;
