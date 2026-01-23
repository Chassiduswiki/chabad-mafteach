import { useState, useEffect } from 'react';
import { getCachedAIResult, setCachedAIResult } from '@/lib/ai/cache';

export function useSmartSlug(slug: string, initialSlug: string, sourceText: string, autoGenerate: boolean) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Effect for auto-generation from source text
  useEffect(() => {
    if (autoGenerate && sourceText && !slug) {
      const generated = generateSlug(sourceText);
      // This effect should trigger the validation effect below by changing the 'slug' prop in the parent component
      // For now, we'll just log it. The parent component should call `updateFormField('slug', generated)`
    }
  }, [sourceText, autoGenerate, slug]);

  // Effect for validation
  useEffect(() => {
    if (!slug || slug === initialSlug) {
      setIsAvailable(null);
      setAlternatives([]);
      return;
    }

    const debounce = setTimeout(async () => {
      const cacheKey = `slug-check-${slug}`;
      const cached = getCachedAIResult(cacheKey);
      if (cached) {
        setIsAvailable(cached.available);
        setAlternatives(cached.alternatives || []);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/topics/check-slug?slug=${slug}`);
        const data = await response.json();
        setCachedAIResult(cacheKey, data);
        setIsAvailable(data.available);
        setAlternatives(data.alternatives || []);
      } catch (err) {
        console.error('Slug validation failed:', err);
        setIsAvailable(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [slug, initialSlug]);

  return { isAvailable, alternatives, loading, generateSlug };
}
