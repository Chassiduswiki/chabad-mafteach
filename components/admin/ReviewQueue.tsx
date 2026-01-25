'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReviewQueueItem {
  id: string | number;
  title: string;
  type: string;
  status: string;
  timestamp: string;
}

interface ReviewQueueProps {
  topics: ReviewQueueItem[];
  statements: ReviewQueueItem[];
  onAction: (id: string | number, type: 'topic' | 'statement', action: 'approve' | 'reject') => Promise<void>;
  processingItems: Set<string>;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ topics, statements, onAction, processingItems }) => {
  const renderItem = (item: ReviewQueueItem, type: 'topic' | 'statement') => {
    const isProcessing = processingItems.has(`${type}-${item.id}`);

    return (
      <div key={`${type}-${item.id}`} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
            <Badge variant="outline" className="text-[10px] uppercase">{item.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            <span>•</span>
            <span className="capitalize">{type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onAction(item.id, type, 'reject')}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onAction(item.id, type, 'approve')}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
            <a href={type === 'topic' ? `/editor/topics/${item.id}` : `/editor/statements/${item.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Editorial Review Queue</CardTitle>
        <CardDescription>Items awaiting moderation or approval.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Topics
            <Badge variant="secondary" className="rounded-full px-2 py-0 h-5">{topics.length}</Badge>
          </h3>
          <div className="space-y-2">
            {topics.length > 0 ? topics.map(item => renderItem(item, 'topic')) : (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">No topics pending review.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Statements
            <Badge variant="secondary" className="rounded-full px-2 py-0 h-5">{statements.length}</Badge>
          </h3>
          <div className="space-y-2">
            {statements.length > 0 ? statements.map(item => renderItem(item, 'statement')) : (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">No statements pending review.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
