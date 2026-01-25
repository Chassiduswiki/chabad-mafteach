'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, BookOpen, Quote, Info, Plus, Search, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationSuggestion {
  source_id: number;
  source_title: string;
  reference: string;
  quote: string;
  relevance: number;
}

interface SmartCitationFinderProps {
  context: string;
  onInsertCitation: (citation: { sourceId: number; sourceTitle: string; reference: string; quote?: string }) => void;
  className?: string;
}

export function SmartCitationFinder({ context, onInsertCitation, className }: SmartCitationFinderProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindCitations = async () => {
    if (!query.trim()) return;
    
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
        setError("No direct matches found in the library for this query.");
      }
    } catch (err) {
      console.error('SmartCitationFinder Error:', err);
      setError('Failed to scour the library. Please try again.');
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
    <Card className={cn("overflow-hidden border-primary/10 shadow-lg bg-background/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4 border-b bg-primary/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <Library className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold">Smart Citation Finder</CardTitle>
        </div>
        <CardDescription className="text-[11px] leading-tight">
          AI-powered semantic search across Chassidic literature.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindCitations()}
              placeholder="e.g., 'Ahava vs Yirah in Tanya'"
              className="pl-8 h-9 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
          <Button 
            onClick={handleFindCitations} 
            disabled={loading || !query.trim()}
            size="sm"
            className="h-9 px-3 gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'Searching...' : 'Find'}
          </Button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/10">
          {loading && suggestions.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <div className="relative">
                <Library className="h-8 w-8 text-primary/40 animate-pulse" />
                <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <p className="text-xs font-medium">Scouring your library...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center space-y-2">
              <p className="text-[11px] text-destructive/80 font-medium">{error}</p>
              {error.includes("No direct matches") && (
                <p className="text-[10px] text-muted-foreground">Try adjusting your query for a broader search.</p>
              )}
            </div>
          )}

          {suggestions.length === 0 && !loading && !error && (
            <div className="py-10 text-center space-y-2 opacity-40">
              <div className="bg-muted p-2.5 rounded-full w-fit mx-auto">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium italic">Enter a query to find sources</p>
            </div>
          )}

          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="group relative p-4 border rounded-xl bg-card hover:bg-muted/30 transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {s.source_title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {s.reference}
                    </span>
                    <div className={cn(
                      "text-[9px] font-bold px-1.5 py-0 rounded-full border flex items-center gap-1",
                      getRelevanceColor(s.relevance)
                    )}>
                      {Math.round(s.relevance * 100)}% Match
                    </div>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="rounded-full h-7 w-7 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => onInsertCitation({ 
                    sourceId: s.source_id, 
                    sourceTitle: s.source_title, 
                    reference: s.reference,
                    quote: s.quote 
                  })}
                  title="Insert into editor"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="relative pl-3 mt-2 py-1 group-hover:bg-primary/5 rounded-r-lg transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 rounded-full" />
                <div className="flex items-start gap-2">
                  <Quote className="h-3 w-3 text-primary/30 shrink-0 mt-0.5" />
                  <blockquote className="text-[11px] text-foreground/80 leading-relaxed italic line-clamp-3">
                    {s.quote}
                  </blockquote>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
