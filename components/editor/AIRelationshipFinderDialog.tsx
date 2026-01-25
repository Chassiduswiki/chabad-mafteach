'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Link2, Plus, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelationshipPrediction {
  topic_id: number;
  topic_title: string;
  relationship_type: string;
  confidence: number;
  explanation: string;
}

interface AIRelationshipFinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: number;
  content: string;
  onAddRelationship: (prediction: RelationshipPrediction) => void;
}

export function AIRelationshipFinderDialog({ open, onOpenChange, topicId, content, onAddRelationship }: AIRelationshipFinderDialogProps) {
  const [predictions, setPredictions] = useState<RelationshipPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      handleFindRelationships();
    }
  }, [open]);

  const handleFindRelationships = async () => {
    if (!content || content.length < 50) {
      setError("Not enough content to analyze relationships. Please add more text to the article.");
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
        setError("AI couldn't find any clear relationships for this content.");
      }
    } catch (err) {
      console.error('Relationship Finder Error:', err);
      setError("Failed to analyze content relationships. Please try again later.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/98 backdrop-blur-xl border-primary/10 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-primary/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">AI Relationship Finder</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            AI has analyzed your content and suggests these conceptual connections to other topics.
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
                <p className="text-sm font-medium">Analyzing concept maps...</p>
                <p className="text-xs text-muted-foreground">Identifying semantic parallels across Chassidus</p>
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
                  onClick={handleFindRelationships}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {predictions.map((p, i) => (
                <div 
                  key={i} 
                  className="group relative p-5 border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-300 hover:border-primary/30"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base group-hover:text-primary transition-colors">
                        {p.topic_title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">
                          {p.relationship_type.replace(/_/g, ' ')}
                        </span>
                        <div className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                          getConfidenceColor(p.confidence)
                        )}>
                          {Math.round(p.confidence * 100)}% Match
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="rounded-full h-8 px-3 gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      onClick={() => onAddRelationship(p)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="relative pl-4 mt-3 py-1">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20 rounded-full" />
                    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                      <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                      {p.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!loading && !error && predictions.length > 0 && (
          <div className="px-6 py-4 border-t bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground">
              Tip: Review each suggestion carefully before adding it to your concept map.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
