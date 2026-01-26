'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GenerateSectionButtonProps {
  topicId?: string | number;
  fieldName: string;
  currentContent?: string;
  topicContext: {
    title: string;
    description?: string;
    type?: string;
    [key: string]: any;
  };
  onGenerated: (content: string) => void;
  className?: string;
}

export function GenerateSectionButton({
  topicId,
  fieldName,
  currentContent,
  topicContext,
  onGenerated,
  className
}: GenerateSectionButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus('idle');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          topic_id: topicId,
          field_name: fieldName,
          current_content: currentContent,
          topic_context: topicContext
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await response.json();
      if (data.generated_content) {
        onGenerated(data.generated_content);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('AI Generation error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn(
        "h-8 gap-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
        status === 'success' && "text-emerald-600 border-emerald-200 bg-emerald-50",
        status === 'error' && "text-rose-600 border-rose-200 bg-rose-50",
        !isGenerating && status === 'idle' && "text-primary border-primary/20 hover:bg-primary/5",
        className
      )}
    >
      {isGenerating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === 'success' ? (
        <Check className="h-3.5 w-3.5" />
      ) : status === 'error' ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : currentContent ? (
        <RefreshCw className="h-3.5 w-3.5" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      <span>
        {isGenerating ? 'Generating...' : status === 'success' ? 'Generated' : status === 'error' ? 'Failed' : currentContent ? 'Refine with AI' : 'Generate with AI'}
      </span>
    </Button>
  );
}
