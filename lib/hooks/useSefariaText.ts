import { useState, useEffect } from 'react';

interface SefariaText {
  text: string[];
  he: string[];
  ref: string;
  book: string;
  sections: number[];
}

interface UseSefariaTextResult {
  data: SefariaText | null;
  loading: boolean;
  error: string | null;
}

export function useSefariaText(ref: string | null): UseSefariaTextResult {
  const [data, setData] = useState<SefariaText | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchText = async () => {
      setLoading(true);
      setError(null);

      try {
        // Normalize the ref for Sefaria API (replace spaces with dots, etc.)
        const normalizedRef = ref.replace(/\s+/g, '.').replace(/:/g, '.');

        const response = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(normalizedRef)}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch text: ${response.status}`);
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [ref]);

  return { data, loading, error };
}
