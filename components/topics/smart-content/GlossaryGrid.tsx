'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen } from 'lucide-react';
import { GlossaryItem, GlossaryDefinition } from '@/lib/content/glossary-parser';

interface GlossaryGridProps {
    items: GlossaryItem[];
}

export default function GlossaryGrid({ items }: GlossaryGridProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (term: string) => {
        setExpandedId(expandedId === term ? null : term);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            {items.map((item, idx) => {
                const isExpanded = expandedId === item.term;

                return (
                    <motion.div
                        key={idx}
                        layout
                        className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isExpanded
                                ? 'bg-primary/5 border-primary/30 shadow-md col-span-1 md:col-span-2'
                                : 'bg-card border-border hover:border-primary/20 hover:shadow-sm'
                            }`}
                    >
                        {/* Card Header / Summary */}
                        <div
                            className="p-5 cursor-pointer flex items-start justify-between gap-4"
                            onClick={() => toggleExpand(item.term)}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-foreground">{item.term}</h3>
                                    {item.hebrew && (
                                        <span className="text-xl font-serif text-primary/80" lang="he">
                                            {item.hebrew}
                                        </span>
                                    )}
                                </div>
                                {!isExpanded && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        <span className="font-semibold text-primary/70 mr-1">1.</span>
                                        {item.definitions[0]?.text}
                                    </p>
                                )}
                            </div>
                            <div className={`p-2 rounded-full bg-muted/50 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 pt-0 border-t border-primary/10 bg-gradient-to-b from-primary/5 to-transparent">
                                        <div className="space-y-3 mt-4">
                                            {item.definitions.map((def) => (
                                                <div key={def.id} className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background border border-primary/20 text-xs font-bold text-primary shadow-sm">
                                                        {def.id}
                                                    </span>
                                                    <p className="text-sm leading-relaxed text-foreground/90 pt-0.5">
                                                        {def.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
