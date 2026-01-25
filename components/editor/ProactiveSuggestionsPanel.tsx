'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle, ArrowRight, Lightbulb, AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'action' | 'content' | 'relationship';
  title: string;
  description: string;
  confidence: number;
}

interface ProactiveSuggestionsPanelProps {
  topicId: number;
  content: string;
  onSuggestionApplied?: (suggestion: Suggestion) => void;
  className?: string;
}

export function ProactiveSuggestionsPanel({
  topicId,
  content,
  onSuggestionApplied,
  className,
}: ProactiveSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only auto-generate if we have enough content and no suggestions yet
    if (content && content.length > 100 && suggestions.length === 0 && !loading && !error) {
      generateSuggestions();
    }
  }, [content, topicId]);

  const generateSuggestions = async () => {
    if (!content || content.length < 50) {
      setError("Add more content to get AI writing suggestions.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate suggestions');
      
      setSuggestions(data.suggestions || []);
      if (data.suggestions?.length === 0) {
        setError("Your content looks great! No immediate suggestions found.");
      }
    } catch (err) {
      console.error('ProactiveSuggestions Error:', err);
      setError('Failed to analyze content.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    setAppliedSuggestions((prev) => new Set(prev).add(suggestion.id));
    onSuggestionApplied?.(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    if (confidence >= 0.7) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'relationship': return <ArrowRight className="h-3 w-3" />;
      case 'content': return <Lightbulb className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden border-primary/10 shadow-lg bg-background/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4 border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold">Proactive AI</CardTitle>
            </div>
            <CardDescription className="text-[11px] leading-tight">
              Real-time suggestions to improve your topic entry.
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={generateSuggestions}
            disabled={loading}
            title="Refresh suggestions"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {loading && suggestions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-xs font-medium">Analyzing your writing...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3 p-4">
            <div className="bg-muted p-2 rounded-full w-fit mx-auto opacity-50">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">{error}</p>
            {error.includes("content") && (
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={generateSuggestions}>
                Analyze Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={cn(
                  "group relative p-3 border rounded-xl bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md",
                  appliedSuggestions.has(suggestion.id) && "opacity-60 grayscale bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {suggestion.title}
                    </h4>
                  </div>
                  <div className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                    getConfidenceColor(suggestion.confidence)
                  )}>
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  {suggestion.description}
                </p>
                <Button
                  size="sm"
                  variant={appliedSuggestions.has(suggestion.id) ? "ghost" : "outline"}
                  onClick={() => applySuggestion(suggestion)}
                  disabled={appliedSuggestions.has(suggestion.id)}
                  className="w-full h-7 text-[10px] rounded-lg gap-1.5"
                >
                  {appliedSuggestions.has(suggestion.id) ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Applied to workflow
                    </>
                  ) : (
                    <>
                      Apply Suggestion
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
