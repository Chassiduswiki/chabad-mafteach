'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'action' | 'content' | 'relationship';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
}

interface ProactiveSuggestionsPanelProps {
  topicId: number;
  content: string;
  onSuggestionApplied?: () => void;
}

export function ProactiveSuggestionsPanel({
  topicId,
  content,
  onSuggestionApplied,
}: ProactiveSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (content && content.length > 50) {
      generateSuggestions();
    }
  }, [content, topicId]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      });

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setError('Failed to generate suggestions.');
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    suggestion.action();
    setAppliedSuggestions((prev) => new Set(prev).add(suggestion.id));
    onSuggestionApplied?.();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions yet. Add more content to get AI recommendations.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-foreground">
                  {suggestion.title}
                </h4>
                <span
                  className={`text-xs font-medium ${getConfidenceColor(
                    suggestion.confidence
                  )}`}
                >
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {suggestion.description}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applySuggestion(suggestion)}
                disabled={appliedSuggestions.has(suggestion.id)}
                className="w-full"
              >
                {appliedSuggestions.has(suggestion.id) ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Applied
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Apply
                  </>
                )}
              </Button>
            </div>
          ))
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
          className="w-full"
        >
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}
