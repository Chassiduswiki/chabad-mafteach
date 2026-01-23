import { useState, useEffect, useCallback, useRef } from 'react';

interface FieldData {
  canonical_title?: string;
  canonical_title_en?: string;
  canonical_title_transliteration?: string;
  topic_type?: string;
  description?: string;
  includeDescription?: boolean;
}

interface Suggestion {
  field: keyof FieldData;
  value: string;
  confidence: number;
}

interface UseAIFieldAutoCompleteOptions {
  enabled?: boolean;
  autoApply?: boolean; // If true, automatically apply suggestions without user confirmation
  confidenceThreshold?: number; // Minimum confidence to auto-apply (default 0.8)
  onSuggestionsReady?: (suggestions: Suggestion[]) => void;
  onAutoApplied?: (applied: Suggestion[]) => void;
}

interface UseAIFieldAutoCompleteReturn {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  applySuggestion: (field: keyof FieldData) => void;
  applySuggestions: () => void;
  dismissSuggestion: (field: keyof FieldData) => void;
  dismissAll: () => void;
  checkAndComplete: () => Promise<void>;
}

export function useAIFieldAutoComplete(
  fields: FieldData,
  updateField: (field: keyof FieldData, value: string) => void,
  options: UseAIFieldAutoCompleteOptions = {}
): UseAIFieldAutoCompleteReturn {
  const {
    enabled = true,
    autoApply = true,
    confidenceThreshold = 0.8,
    onSuggestionsReady,
    onAutoApplied,
  } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we've already run auto-complete for this session
  const hasRunRef = useRef(false);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const checkAndComplete = useCallback(async () => {
    if (!enabled) return;

    // Count filled vs empty fields
    const filledCount = [
      fields.canonical_title,
      fields.canonical_title_en,
      fields.canonical_title_transliteration,
    ].filter(f => f?.trim()).length;

    const emptyCount = 3 - filledCount;

    // Only run if we have at least one filled field and at least one empty field
    if (filledCount === 0 || emptyCount === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/auto-complete-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      const newSuggestions: Suggestion[] = data.suggestions || [];

      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
        onSuggestionsReady?.(newSuggestions);

        // Auto-apply high-confidence suggestions if enabled
        if (autoApply) {
          const toApply = newSuggestions.filter(s => s.confidence >= confidenceThreshold);
          if (toApply.length > 0) {
            toApply.forEach(s => {
              updateField(s.field, s.value);
            });
            onAutoApplied?.(toApply);
            // Remove applied suggestions from the list
            setSuggestions(prev => 
              prev.filter(s => !toApply.some(a => a.field === s.field))
            );
          }
        }
      }
    } catch (err) {
      console.error('AI auto-complete error:', err);
      setError(err instanceof Error ? err.message : 'Auto-complete failed');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fields, autoApply, confidenceThreshold, updateField, onSuggestionsReady, onAutoApplied]);

  // Run once on mount when fields are loaded
  useEffect(() => {
    if (!enabled || hasRunRef.current) return;

    // Wait a tick for fields to be populated from API
    const timer = setTimeout(() => {
      const hasAnyField = fields.canonical_title || 
                          fields.canonical_title_en || 
                          fields.canonical_title_transliteration;
      
      if (hasAnyField) {
        hasRunRef.current = true;
        checkAndComplete();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [enabled, fields.canonical_title, fields.canonical_title_en, fields.canonical_title_transliteration, checkAndComplete]);

  const applySuggestion = useCallback((field: keyof FieldData) => {
    const suggestion = suggestions.find(s => s.field === field);
    if (suggestion) {
      updateField(field, suggestion.value);
      setSuggestions(prev => prev.filter(s => s.field !== field));
    }
  }, [suggestions, updateField]);

  const applySuggestions = useCallback(() => {
    suggestions.forEach(s => {
      updateField(s.field, s.value);
    });
    setSuggestions([]);
  }, [suggestions, updateField]);

  const dismissSuggestion = useCallback((field: keyof FieldData) => {
    setSuggestions(prev => prev.filter(s => s.field !== field));
  }, []);

  const dismissAll = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    applySuggestion,
    applySuggestions,
    dismissSuggestion,
    dismissAll,
    checkAndComplete,
  };
}
