"use client";

import { useState, useEffect } from 'react';

interface Translation {
  id: number;
  topic_id: number;
  language_code: string;
  title: string;
  transliteration?: string;
  description?: string;
  overview?: string;
  article?: string;
  definition_positive?: string;
  definition_negative?: string;
  practical_takeaways?: string;
  historical_context?: string;
  mashal?: string;
  global_nimshal?: string;
  charts?: string;
  translation_quality?: string;
  is_machine_translated?: boolean;
}

export function useTranslations(topicId: number | null) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    const fetchTranslations = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/topics/translations?topic_id=${topicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch translations');
        }

        const data = await response.json();
        setTranslations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [topicId]);

  const getTranslation = (lang: string): Translation | undefined => {
    return translations.find(t => t.language_code === lang);
  };

  const createTranslation = async (data: Partial<Translation>) => {
    try {
      const response = await fetch('/api/topics/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create translation');
      }

      const newTranslation = await response.json();
      setTranslations(prev => [...prev, newTranslation]);
      return newTranslation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTranslation = async (id: number, data: Partial<Translation>) => {
    try {
      // For the PATCH endpoint, we need to convert to the expected format
      const patchData = {
        topicId: data.topic_id,
        language: data.language_code,
        field: Object.keys(data).find(key => key !== 'id' && key !== 'topic_id' && key !== 'language_code'),
        value: Object.values(data).find((val, idx) => idx > 2) // Skip first 3 values (id, topic_id, language_code)
      };

      const response = await fetch(`/api/topics/translations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      });

      if (!response.ok) {
        throw new Error('Failed to update translation');
      }

      const updated = await response.json();
      setTranslations(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const upsertTranslationField = async (topicId: number, language: string, field: string, value: any) => {
    try {
      const response = await fetch(`/api/topics/translations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, language, field, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to upsert translation field');
      }

      const updated = await response.json();
      
      // Update local state
      setTranslations(prev => {
        const existing = prev.find(t => t.topic_id === topicId && t.language_code === language);
        if (existing) {
          return prev.map(t => t.id === existing.id ? { ...t, ...updated } : t);
        } else {
          return [...prev, updated];
        }
      });
      
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTranslation = async (id: number) => {
    try {
      const response = await fetch(`/api/topics/translations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete translation');
      }

      setTranslations(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    translations,
    loading,
    error,
    getTranslation,
    createTranslation,
    updateTranslation,
    upsertTranslationField,
    deleteTranslation,
  };
}
