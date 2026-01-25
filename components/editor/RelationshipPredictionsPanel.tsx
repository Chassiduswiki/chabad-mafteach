'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Link2, Plus, Info, RefreshCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationshipPrediction {
  topic_id: number;
  topic_title: string;
  relationship_type: string;
  confidence: number;
  explanation: string;
}

interface RelationshipPredictionsPanelProps {
  topicId: number;
  content: string;
  onAddRelationship: (prediction: RelationshipPrediction) => void;
  className?: string;
}

export function RelationshipPredictionsPanel({ topicId, content, onAddRelationship, className }: RelationshipPredictionsPanelProps) {
  const [predictions, setPredictions] = useState<RelationshipPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindRelationships = async () => {
    if (!content || content.length < 50) {
      setError("Add more content to analyze relationships.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/predict-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to predict relationships');
      
      setPredictions(data.predictions || []);
      if (data.predictions?.length === 0) {
        setError("No clear relationships found for this content.");
      }
    } catch (err) {
      console.error('Relationship Predictions Error:', err);
      setError('Failed to analyze relationships.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    if (confidence >= 0.5) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <Card className={cn("overflow-hidden border-primary/10 shadow-lg bg-background/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4 border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold">Concept Connections</CardTitle>
            </div>
            <CardDescription className="text-[11px] leading-tight">
              AI predictions for related topics and ideas.
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={handleFindRelationships}
            disabled={loading}
            title="Refresh predictions"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {loading && predictions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <div className="relative">
              <Link2 className="h-8 w-8 text-primary/40 animate-pulse" />
              <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="text-xs font-medium">Predicting connections...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3 p-4">
            <div className="bg-muted p-2 rounded-full w-fit mx-auto opacity-50">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">{error}</p>
            {!content || content.length < 50 ? (
              <p className="text-[10px] text-muted-foreground">Keep writing to enable AI analysis.</p>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleFindRelationships}>
                Try Again
              </Button>
            )}
          </div>
        ) : predictions.length === 0 ? (
          <div className="py-10 text-center space-y-3 opacity-40">
            <div className="bg-muted p-2.5 rounded-full w-fit mx-auto">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium italic">Discover related concepts</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-full text-[11px] gap-1.5"
                onClick={handleFindRelationships}
                disabled={loading}
              >
                Analyze Content
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map((p, i) => (
              <div 
                key={i} 
                className="group relative p-4 border rounded-xl bg-card hover:bg-muted/30 transition-all duration-300 hover:border-primary/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {p.topic_title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                        {p.relationship_type.replace(/_/g, ' ')}
                      </span>
                      <div className={cn(
                        "text-[9px] font-bold px-1.5 py-0 rounded-full border",
                        getConfidenceColor(p.confidence)
                      )}>
                        {Math.round(p.confidence * 100)}% Match
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="rounded-full h-7 w-7 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => onAddRelationship(p)}
                    title="Add relationship"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="relative pl-3 mt-2 py-1">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 rounded-full" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex items-start gap-1.5">
                    <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                    {p.explanation}
                  </p>
                </div>
              </div>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-[10px] h-7 text-muted-foreground hover:text-primary"
              onClick={handleFindRelationships}
              disabled={loading}
            >
              Refresh Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
