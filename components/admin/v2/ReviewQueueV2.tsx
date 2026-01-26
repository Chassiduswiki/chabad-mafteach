'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check 
} from 'lucide-react';
import { ReviewQueueData } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';

interface ReviewQueueProps {
  data: ReviewQueueData | undefined;
  onReviewAction: (type: 'topics' | 'statements', id: number, action: 'approve' | 'reject') => void;
  actionLoading: string | null;
  formatTimeAgo: (date: string) => string;
}

export function ReviewQueueV2({
  data,
  onReviewAction,
  actionLoading,
  formatTimeAgo
}: ReviewQueueProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-serif italic flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500" />
          Review Queue
        </h2>
        {data.summary.totalPending > 0 && (
          <span className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {data.summary.totalPending} Pending
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Pending Topics */}
        {data.topics.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold px-2">Topics</h3>
            {data.topics.map(item => (
              <div 
                key={`review-topic-${item.id}`} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all group"
              >
                <Link href={`/editor/topics/${item.slug}`} className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">{item.canonical_title}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.date_updated)}</span>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => onReviewAction('topics', item.id, 'approve')}
                    disabled={!!actionLoading}
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                    title="Approve & Publish"
                  >
                    {actionLoading === `topics-${item.id}-approve` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    onClick={() => onReviewAction('topics', item.id, 'reject')}
                    disabled={!!actionLoading}
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-rose-500/10 text-rose-600 transition-colors"
                    title="Reject to Draft"
                  >
                    {actionLoading === `topics-${item.id}-reject` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Statements */}
        {data.statements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold px-2">Statements</h3>
            {data.statements.map(item => (
              <div 
                key={`review-stmt-${item.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all group"
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.text}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.date_updated)}</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={() => onReviewAction('statements', item.id, 'approve')}
                    disabled={!!actionLoading}
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                    title="Approve & Publish"
                  >
                    {actionLoading === `statements-${item.id}-approve` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    onClick={() => onReviewAction('statements', item.id, 'reject')}
                    disabled={!!actionLoading}
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-rose-500/10 text-rose-600 transition-colors"
                    title="Reject to Draft"
                  >
                    {actionLoading === `statements-${item.id}-reject` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.topics.length === 0 && data.statements.length === 0 && (
          <div className="text-center py-10">
            <Check className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Queue is empty. Everything reviewed!</p>
          </div>
        )}
      </div>
    </div>
  );
}
