'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen } from 'lucide-react';

interface CitationSuggestion {
  source_id: number;
  source_title: string;
  reference: string;
  quote: string;
  relevance: number;
}

interface AICitationSuggestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  context: string;
  onInsertCitation: (citation: { sourceId: number; sourceTitle: string; reference: string; }) => void;
}

export function AICitationSuggestorDialog({ open, onOpenChange, query, context, onInsertCitation }: AICitationSuggestorDialogProps) {
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      handleFindCitations();
    }
  }, [open]);

  const handleFindCitations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/find-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to find citations');
      setSuggestions(data.citations || []);
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
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/>AI Citation Finder</DialogTitle>
          <DialogDescription>
            AI-powered citation suggestions from your library.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{s.source_title}</h4>
                      <p className="text-sm text-muted-foreground">{s.reference}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{Math.round(s.relevance * 100)}% relevant</span>
                  </div>
                  <blockquote className="text-sm my-2 border-l-2 pl-2 italic">{s.quote}</blockquote>
                  <Button size="sm" onClick={() => onInsertCitation({ sourceId: s.source_id, sourceTitle: s.source_title, reference: s.reference })}>Insert Citation</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
