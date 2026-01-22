'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { useAutoTransliteration } from '@/hooks/useAutoTransliteration';

interface SmartFieldInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sourceValue?: string; // Hebrew text to transliterate from
  placeholder?: string;
  autoTransliterate?: boolean;
}

export function SmartFieldInput({
  label,
  value,
  onChange,
  sourceValue,
  placeholder,
  autoTransliterate = false,
}: SmartFieldInputProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const { transliteration, loading, error } = useAutoTransliteration(
    sourceValue || '',
    autoTransliterate
  );

  useEffect(() => {
    if (transliteration && !value && autoTransliterate) {
      setShowSuggestion(true);
    }
  }, [transliteration, value, autoTransliterate]);

  const acceptSuggestion = () => {
    onChange(transliteration);
    setShowSuggestion(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        {/* AI Suggestion Overlay */}
        {showSuggestion && transliteration && (
          <div className="absolute inset-0 flex items-center justify-between px-3 bg-primary/5 border-2 border-primary/30 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI suggests:</span>
              <span className="font-medium text-foreground">{transliteration}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptSuggestion}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/80"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
