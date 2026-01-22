'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Link2 } from 'lucide-react';

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

  useEffect(() => {
    if (open) {
      handleFindRelationships();
    }
  }, [open]);

  const handleFindRelationships = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predict-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to predict relationships');
      setPredictions(data.predictions || []);
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
          <DialogTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary"/>AI Relationship Finder</DialogTitle>
          <DialogDescription>
            AI-powered suggestions for related topics.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((p, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{p.topic_title}</h4>
                      <p className="text-sm text-muted-foreground">Type: {p.relationship_type}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{Math.round(p.confidence * 100)}%</span>
                  </div>
                  <p className="text-sm my-2">AI Explanation: {p.explanation}</p>
                  <Button size="sm" onClick={() => onAddRelationship(p)}>Add Relationship</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
