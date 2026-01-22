import { useState, useEffect } from 'react';
import { getCachedAIResult, setCachedAIResult } from '@/lib/ai/cache';

export function useAutoTransliteration(hebrewText: string, enabled: boolean = true) {
  const [transliteration, setTransliteration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !hebrewText || hebrewText.length < 2) {
      setTransliteration('');
      return;
    }

    const debounce = setTimeout(async () => {
      const cacheKey = `transliterate-${hebrewText}`;
      const cached = getCachedAIResult(cacheKey);
      if (cached) {
        setTransliteration(cached.transliteration);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/transliterate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: hebrewText }),
        });

        if (!response.ok) throw new Error('Transliteration failed');

        const data = await response.json();
        setCachedAIResult(cacheKey, data);
        setTransliteration(data.transliteration);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(debounce);
  }, [hebrewText, enabled]);

  return { transliteration, loading, error };
}
