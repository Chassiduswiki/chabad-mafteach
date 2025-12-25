import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Topic } from '@/lib/types';

export default function BoundariesTab({ topic }: { topic: Topic }) {
    const [expandedPositive, setExpandedPositive] = useState(true);
    const [expandedNegative, setExpandedNegative] = useState(true);

    // Check if we have boundary content
    const hasPositive = topic.definition_positive && topic.definition_positive.trim().length > 0;
    const hasNegative = topic.definition_negative && topic.definition_negative.trim().length > 0;

    if (!hasPositive && !hasNegative) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Boundaries in Development</h3>
                <p className="text-sm max-w-md mx-auto px-6">
                    A precise definition of what this concept is and what it is not is currently being refined.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* What it IS */}
            {hasPositive && (
                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04] overflow-hidden">
                    <button
                        onClick={() => setExpandedPositive(!expandedPositive)}
                        className="w-full p-6 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>What it IS</span>
                        </div>
                        {expandedPositive ? (
                            <ChevronUp className="h-5 w-5 text-emerald-600/50" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-emerald-600/50" />
                        )}
                    </button>
                    {expandedPositive && (
                        <div className="px-6 pb-6 prose prose-slate dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: topic.definition_positive! }} />
                        </div>
                    )}
                </div>
            )}

            {/* What it's NOT */}
            {hasNegative && (
                <div className="rounded-2xl border border-rose-500/10 bg-rose-500/[0.02] dark:bg-rose-500/[0.04] overflow-hidden">
                    <button
                        onClick={() => setExpandedNegative(!expandedNegative)}
                        className="w-full p-6 flex items-center justify-between hover:bg-rose-500/5 transition-colors"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
                            <XCircle className="h-4 w-4" />
                            <span>What it's NOT</span>
                        </div>
                        {expandedNegative ? (
                            <ChevronUp className="h-5 w-5 text-rose-600/50" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-rose-600/50" />
                        )}
                    </button>
                    {expandedNegative && (
                        <div className="px-6 pb-6 prose prose-slate dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: topic.definition_negative! }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

