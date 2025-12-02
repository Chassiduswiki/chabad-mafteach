'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Topic } from '@/lib/directus';
import ReactMarkdown from 'react-markdown';

export default function BoundariesTab({ topic }: { topic: Topic }) {
    // Check if we have boundary content
    const hasPositive = topic.definition_positive;
    const hasNegative = topic.definition_negative;

    if (!hasPositive && !hasNegative) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No boundary information available yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* What it IS */}
            {hasPositive && (
                <div className="rounded-2xl border bg-card p-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>What it IS</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{topic.definition_positive}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* What it's NOT */}
            {hasNegative && (
                <div className="rounded-2xl border bg-card p-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>What it's NOT</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{topic.definition_negative}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
