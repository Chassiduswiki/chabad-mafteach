'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Quote, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onInsertCitation: (citation: { sourceId: number; sourceTitle: string; reference: string; quote?: string }) => void;
}

export function AICitationSuggestorDialog({ open, onOpenChange, query, context, onInsertCitation }: AICitationSuggestorDialogProps) {
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      handleFindCitations();
    }
  }, [open]);

  const handleFindCitations = async () => {
    if (!query && !context) {
      setError("Please provide a query or some context to find citations.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/find-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to find citations');
      
      setSuggestions(data.citations || []);
      if (data.citations?.length === 0) {
        setError("No relevant citations found for this topic.");
      }
    } catch (err) {
      console.error('Citation Suggestor Error:', err);
      setError("Failed to retrieve citation suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    if (relevance >= 0.7) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/98 backdrop-blur-xl border-primary/10 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-primary/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">AI Citation Suggestor</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Searching Chassidic literature for sources that support your writing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4 opacity-70">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Scouring the library...</p>
                <p className="text-xs text-muted-foreground">Identifying relevant passages in Tanya and Sichos</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 p-8">
              <div className="bg-destructive/10 p-3 rounded-full text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  onClick={handleFindCitations}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {suggestions.map((s, i) => (
                <div 
                  key={i} 
                  className="group relative p-5 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-300 hover:border-primary/30"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base group-hover:text-primary transition-colors">
                        {s.source_title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">
                          {s.reference}
                        </span>
                        <div className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                          getRelevanceColor(s.relevance)
                        )}>
                          {Math.round(s.relevance * 100)}% Match
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="rounded-full h-8 px-3 gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      onClick={() => onInsertCitation({ 
                        sourceId: s.source_id, 
                        sourceTitle: s.source_title, 
                        reference: s.reference,
                        quote: s.quote 
                      })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Insert
                    </Button>
                  </div>
                  
                  <div className="relative pl-4 mt-3 py-1">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 rounded-full transition-colors group-hover:bg-primary/40" />
                    <div className="flex items-start gap-3">
                      <Quote className="h-3.5 w-3.5 text-primary/40 shrink-0 mt-1" />
                      <blockquote className="text-xs text-foreground/90 leading-relaxed italic line-clamp-3">
                        {s.quote}
                      </blockquote>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!loading && !error && suggestions.length > 0 && (
          <div className="px-6 py-4 border-t bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground">
              Note: AI suggestions are based on semantic matching. Verify quotes before final publication.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
