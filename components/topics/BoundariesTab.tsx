'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Topic } from '@/lib/directus';
import ReactMarkdown from 'react-markdown';

export default function BoundariesTab({ topic }: { topic: Topic }) {
    const [expandedPositive, setExpandedPositive] = useState(false);
    const [expandedNegative, setExpandedNegative] = useState(false);

    // Load collapse state from localStorage
    useEffect(() => {
        const savedPositive = localStorage.getItem('boundaries_positive_expanded');
        const savedNegative = localStorage.getItem('boundaries_negative_expanded');

        if (savedPositive !== null) setExpandedPositive(savedPositive === 'true');
        if (savedNegative !== null) setExpandedNegative(savedNegative === 'true');
    }, []);

    const togglePositive = () => {
        const newState = !expandedPositive;
        setExpandedPositive(newState);
        localStorage.setItem('boundaries_positive_expanded', String(newState));
    };

    const toggleNegative = () => {
        const newState = !expandedNegative;
        setExpandedNegative(newState);
        localStorage.setItem('boundaries_negative_expanded', String(newState));
    };

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
                <div className="rounded-2xl border bg-card overflow-hidden">
                    <button
                        onClick={togglePositive}
                        className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>What it IS</span>
                        </div>
                        {expandedPositive ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </button>
                    {expandedPositive && (
                        <div className="px-6 pb-6 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{topic.definition_positive}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {/* What it's NOT */}
            {hasNegative && (
                <div className="rounded-2xl border bg-card overflow-hidden">
                    <button
                        onClick={toggleNegative}
                        className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>What it's NOT</span>
                        </div>
                        {expandedNegative ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </button>
                    {expandedNegative && (
                        <div className="px-6 pb-6 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{topic.definition_negative}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

