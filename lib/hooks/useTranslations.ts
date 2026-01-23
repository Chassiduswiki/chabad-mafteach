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
      const response = await fetch(`/api/topics/translations?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    deleteTranslation,
  };
}
