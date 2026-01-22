'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';

interface CitationSuggestion {
  source_id: number;
  source_title: string;
  reference: string;
  quote: string;
  relevance: number;
}

interface SmartCitationFinderProps {
  context: string;
  onInsertCitation: (citation: { sourceId: number; sourceTitle: string; reference: string; }) => void;
}

export function SmartCitationFinder({ context, onInsertCitation }: SmartCitationFinderProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to find citations.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Citation Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        <div className="flex gap-2">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'Tanya on happiness'"
          />
          <Button onClick={handleFindCitations} disabled={loading || !query}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
          </Button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{s.source_title}</h4>
                  <p className="text-sm text-muted-foreground">{s.reference}</p>
                </div>
                <span className="text-sm font-bold text-primary">{Math.round(s.relevance * 100)}%</span>
              </div>
              <blockquote className="text-sm my-2 border-l-2 pl-2 italic">{s.quote}</blockquote>
              <Button size="sm" onClick={() => onInsertCitation({ sourceId: s.source_id, sourceTitle: s.source_title, reference: s.reference })}>
                <BookOpen className="h-3 w-3 mr-2" />
                Insert Citation
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
