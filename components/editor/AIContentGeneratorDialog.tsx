'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

interface AIContentGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
  onContentGenerated: (content: string) => void;
}

export function AIContentGeneratorDialog({ open, onOpenChange, topicTitle, onContentGenerated }: AIContentGeneratorDialogProps) {
  const [step, setStep] = useState(1);
  const [outline, setOutline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateOutline = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate_outline',
          data: { topicTitle } 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate outline');
      
      setOutline(data.result);
      setStep(2);
    } catch (error) {
      console.error('Outline generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicTitle, context: outline }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate article');
      onContentGenerated(data.result);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/>AI Article Generator</DialogTitle>
          <DialogDescription>
            Generate a full article for '{topicTitle}' in a few steps.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {step === 1 && (
            <div className="text-center">
              <p className="mb-4">First, let's generate an outline for the article.</p>
              <Button onClick={handleGenerateOutline} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                Generate Outline
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p>Review and edit the generated outline:</p>
              <Textarea value={outline} onChange={(e) => setOutline(e.target.value)} rows={10} />
              <Button onClick={handleGenerateArticle} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                Generate Full Article from Outline
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
