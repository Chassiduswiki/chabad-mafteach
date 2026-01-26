import React, { useState, useEffect } from 'react';
import { History, RotateCcw, User, Calendar, ChevronRight, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Native scroll instead of missing ScrollArea for now

interface Revision {
  id: string;
  timestamp: string;
  user: {
    first_name: string;
    last_name: string;
    avatar: string;
  } | null;
  delta: Record<string, any>;
}

interface TopicVersionHistoryProps {
  slug: string;
  onRevert?: () => void;
  className?: string;
}

export const TopicVersionHistory: React.FC<TopicVersionHistoryProps> = ({ slug, onRevert, className }) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReverting, setIsReverting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${slug}/versions`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setRevisions(data.revisions || []);
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Could not load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchHistory();
  }, [slug]);

  const handleRevert = async (revisionId: string) => {
    if (!window.confirm('Are you sure you want to revert to this version? Current unsaved changes will be lost.')) return;

    try {
      setIsReverting(revisionId);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${slug}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ revisionId }),
      });

      if (!response.ok) throw new Error('Revert failed');

      if (onRevert) onRevert();
      fetchHistory();
    } catch (err) {
      console.error('Revert error:', err);
      alert('Failed to revert to this version.');
    } finally {
      setIsReverting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center bg-destructive/5 rounded-xl border border-destructive/10 mx-4 mt-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
          <h3 className="font-semibold text-destructive">Error Loading History</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-muted/10">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Version History</h3>
        <span className="ml-auto text-xs text-muted-foreground">{revisions.length} revisions</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {revisions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <History className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No history found</p>
              <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
                Edits will appear here once saved.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-border/50 ml-4 space-y-8">
              {revisions.map((rev, index) => {
                const isLatest = index === 0;
                return (
                  <div key={rev.id} className="relative pl-8 group">
                    {/* Timeline Dot */}
                    <div className={cn(
                      "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-colors",
                      isLatest
                        ? "bg-primary border-primary ring-4 ring-primary/10"
                        : "bg-background border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/50"
                    )} />

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {rev.user ? `${rev.user.first_name || ''} ${rev.user.last_name || ''}`.trim() || 'Unknown User' : 'System'}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap" title={new Date(rev.timestamp).toLocaleString()}>
                          {formatDistanceToNow(new Date(rev.timestamp), { addSuffix: true })}
                        </time>
                      </div>

                      {/* Changes Summary */}
                      <div className="mt-2 bg-card border border-border rounded-lg p-3 shadow-sm group-hover:border-primary/20 group-hover:shadow-md transition-all">
                        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
                          Changes
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(rev.delta).length > 0 ? (
                            Object.keys(rev.delta).map(field => (
                              <div key={field} className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                <span className="font-medium text-foreground">{field.replace(/_/g, ' ')}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No specific field changes recorded</span>
                          )}
                        </div>

                        {!isLatest && (
                          <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevert(rev.id)}
                              disabled={!!isReverting}
                              className="h-7 text-xs hover:bg-primary/5 hover:text-primary"
                            >
                              {isReverting === rev.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3 h-3 mr-1.5" />
                                  Restore Version
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
