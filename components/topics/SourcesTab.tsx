'use client';

import { useState } from 'react';
import { Citation } from '@/lib/types';
import { ExternalLink, Copy, Check, ArrowRight, Book } from 'lucide-react';
import Link from 'next/link';

interface SourcesTabProps {
    sources: any[];
    citations: Citation[];
}

export default function SourcesTab({ sources, citations }: SourcesTabProps) {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Group citations by document_title
    const groupedCitations: Record<string, Citation[]> = citations.reduce((acc, citation) => {
        const title = citation.document_title || 'Other References';
        if (!acc[title]) acc[title] = [];
        acc[title].push(citation);
        return acc;
    }, {} as Record<string, Citation[]>);

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if ((!citations || citations.length === 0) && (!sources || sources.length === 0)) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Book className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No active citations found</h3>
                <p className="text-sm max-w-md mx-auto px-6">
                    Direct references for this topic are currently being indexed.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {Object.entries(groupedCitations).map(([title, itemCitations]) => (
                <div key={title} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Book className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {itemCitations.length} {itemCitations.length === 1 ? 'citation' : 'citations'}
                        </span>
                    </div>

                    <div className="grid gap-6">
                        {itemCitations.map((citation) => (
                            <div key={citation.id} className="group relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                {/* Actions Overlay */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleCopy(citation.text, citation.id)}
                                        className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary transition-colors"
                                        title="Copy text"
                                    >
                                        {copiedId === citation.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                    <Link
                                        href={`/seforim/${citation.document_id}${citation.order_key ? `?stmt=${citation.id}` : ''}`}
                                        className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                                        title="View in context"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>

                                {/* Hebrew Text */}
                                <div className="font-hebrew text-xl leading-relaxed text-foreground mb-4 pr-12" dir="rtl">
                                    {citation.text}
                                </div>

                                {/* English Translation */}
                                {citation.appended_text && (
                                    <div className="text-sm text-muted-foreground italic mb-4">
                                        "{citation.appended_text}"
                                    </div>
                                )}

                                {/* Metadata/attribution */}
                                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground/60 border-t border-border/50">
                                    <div className="flex items-center gap-2">
                                        {citation.order_key && (
                                            <span>Section {citation.order_key}</span>
                                        )}
                                        {citation.relevance_score && (
                                            <>
                                                <span>•</span>
                                                <span>{Math.round(citation.relevance_score * 100)}% relevant</span>
                                            </>
                                        )}
                                    </div>
                                    {citation.is_primary && (
                                        <span className="text-primary font-bold uppercase tracking-widest">Primary Source</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Legacy Sources (if any that aren't in citations) */}
            {sources.length > 0 && (
                <div className="pt-8 opacity-60">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Other References</h4>
                    <div className="flex flex-wrap gap-2">
                        {sources.map(s => (
                            <span key={s.id} className="text-xs px-3 py-1 bg-muted rounded-full text-foreground border border-border">
                                {s.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
