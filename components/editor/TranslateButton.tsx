'use client';

import React, { useState } from 'react';
import { Languages, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TranslateButtonProps {
  content: string;
  sourceLanguage?: string;
  targetLanguage: string;
  onTranslation: (translation: string) => void;
  className?: string;
  topicId?: string | number;
  field?: string;
  context?: string;
}

export function TranslateButton({
  content,
  sourceLanguage = 'he',
  targetLanguage = 'en',
  onTranslation,
  className,
  topicId,
  field,
  context
}: TranslateButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTranslate = async () => {
    if (!content || content.trim().length < 2) return;

    setIsTranslating(true);
    setStatus('idle');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          topic_id: topicId,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          field,
          content,
          context
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      if (data.translation) {
        onTranslation(data.translation);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTranslate}
      disabled={isTranslating || !content}
      className={cn(
        "h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
        status === 'success' && "text-emerald-600 bg-emerald-50 hover:bg-emerald-50 hover:text-emerald-600",
        status === 'error' && "text-rose-600 bg-rose-50 hover:bg-rose-50 hover:text-rose-600",
        !isTranslating && status === 'idle' && "text-muted-foreground hover:text-primary hover:bg-primary/5",
        className
      )}
    >
      {isTranslating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === 'success' ? (
        <Check className="h-3.5 w-3.5" />
      ) : status === 'error' ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : (
        <Languages className="h-3.5 w-3.5" />
      )}
      <span>
        {isTranslating ? 'Translating...' : status === 'success' ? 'Translated' : status === 'error' ? 'Failed' : `Translate to ${targetLanguage.toUpperCase()}`}
      </span>
    </Button>
  );
}
