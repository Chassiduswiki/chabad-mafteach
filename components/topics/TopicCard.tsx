'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronRight, Eye, Sparkles } from 'lucide-react';
import type { Topic } from '@/lib/types';

interface TopicCardProps {
    topic: Topic;
    view: 'grid' | 'list';
    contentCount?: {
        statementCount: number;
        documentCount: number;
        status: 'comprehensive' | 'partial' | 'minimal';
    };
    colorClass: string;
    preview?: {
        excerpts: Array<{ id: number; text: string }>;
        totalStatements: number;
    };
    onPreviewRequest: (topicId: number) => void;
}

export function TopicCard({ topic, view, contentCount, colorClass, preview, onPreviewRequest }: TopicCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onPreviewRequest(topic.id);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
        if (!preview) onPreviewRequest(topic.id);
    };

    if (view === 'list') {
        return (
            <div className="group relative border-b border-border last:border-b-0">
                <Link href={`/topics/${topic.slug}`} className="block p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {topic.name || topic.canonical_title}
                            </h3>
                            {topic.definition_short && (
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                    {topic.definition_short.replace(/<[^>]*>/g, '')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-4 pl-4">
                            {contentCount && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className={`h-2 w-2 rounded-full ${contentCount.status === 'comprehensive' ? 'bg-emerald-500' : contentCount.status === 'partial' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                    <span className="hidden sm:inline">{contentCount.status}</span>
                                    <span className="font-mono">({contentCount.statementCount})</span>
                                </div>
                            )}
                            <button onClick={toggleExpand} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                        </div>
                    </div>
                </Link>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden px-4 bg-accent/30"
                        >
                            <div className="py-4 space-y-3">
                                {preview?.excerpts && preview.excerpts.length > 0 ? (
                                    preview.excerpts.map((excerpt) => (
                                        <div key={excerpt.id} className="text-xs text-muted-foreground pl-4 py-2 border-l-2 border-primary/30">
                                            <p className="italic">"{excerpt.text.replace(/<[^>]*>/g, '')}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-xs text-muted-foreground italic">
                                        {preview ? "No excerpts available" : "Loading previews..."}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="group relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Link href={`/topics/${topic.slug}`} className={`relative flex flex-col h-full overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5`}>
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {topic.name || topic.canonical_title}
                        </h3>
                        <button onClick={toggleExpand} className="p-1.5 bg-background/50 hover:bg-primary/10 hover:text-primary rounded-lg border border-transparent hover:border-primary/20 transition-colors shadow-sm">
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>

                    {topic.definition_short && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {topic.definition_short.replace(/<[^>]*>/g, '')}
                        </p>
                    )}

                    <AnimatePresence>
                        {(isExpanded || (isHovered && !isExpanded)) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-2 space-y-2 pt-2 border-t border-border/50">
                                    {preview?.excerpts && preview.excerpts.length > 0 ? (
                                        preview.excerpts.slice(0, isExpanded ? 3 : 1).map((excerpt) => (
                                            <div key={excerpt.id} className="text-[11px] text-muted-foreground/80 italic pl-2 border-l border-primary/20 bg-background/30 py-1 rounded-r-md">
                                                "{excerpt.text.replace(/<[^>]*>/g, '')}"
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[10px] text-muted-foreground animate-pulse">Loading deep insights...</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {contentCount && (
                            <>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${contentCount.status === 'comprehensive' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : contentCount.status === 'partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                    {contentCount.status}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    <span>{contentCount.statementCount}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/50 opacity-0 ring-1 ring-border transition-all group-hover:opacity-100 group-hover:translate-x-1 outline-none">
                        <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
