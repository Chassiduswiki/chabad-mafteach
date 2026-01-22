'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Link2 } from 'lucide-react';

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
}

export function RelationshipPredictionsPanel({ topicId, content, onAddRelationship }: RelationshipPredictionsPanelProps) {
  const [predictions, setPredictions] = useState<RelationshipPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to predict relationships.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Don't auto-trigger on mount - wait for user to click refresh
  // useEffect(() => {
  //   handleFindRelationships();
  // }, [topicId, content]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Relationship Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Click "Find Relationships" to discover related topics</p>
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
        <Button variant="outline" size="sm" onClick={handleFindRelationships} disabled={loading} className="w-full mt-4">
          {predictions.length === 0 ? 'Find Relationships' : 'Refresh Predictions'}
        </Button>
      </CardContent>
    </Card>
  );
}
