import React, { useState, useEffect } from 'react';
import { History, RotateCcw, User, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
}

export const TopicVersionHistory: React.FC<TopicVersionHistoryProps> = ({ slug, onRevert }) => {
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex items-center gap-2 text-red-500 bg-red-50 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Revision History</h3>
      </div>

      {revisions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No history found for this topic.</p>
      ) : (
        <div className="space-y-3">
          {revisions.map((rev) => (
            <div 
              key={rev.id}
              className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>
                      {rev.user ? `${rev.user.first_name} ${rev.user.last_name}` : 'System / Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(rev.timestamp), { addSuffix: true })}</span>
                  </div>
                  
                  {/* Summary of changes */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.keys(rev.delta).slice(0, 3).map(field => (
                      <span key={field} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full uppercase tracking-wider font-semibold">
                        {field.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {Object.keys(rev.delta).length > 3 && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        +{Object.keys(rev.delta).length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRevert(rev.id)}
                  disabled={!!isReverting}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Revert to this version"
                >
                  {isReverting === rev.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
