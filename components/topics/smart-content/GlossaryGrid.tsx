'use client';

import React from 'react';
import { GlossaryItem } from '@/lib/content/glossary-parser';

interface GlossaryGridProps {
    items: GlossaryItem[];
}

export default function GlossaryGrid({ items }: GlossaryGridProps) {
    return (
        <div className="space-y-6 my-4">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="bg-card rounded-xl border border-border p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-bold text-lg text-foreground">{item.term}</h3>
                        {item.hebrew && (
                            <span className="text-xl font-serif text-primary/80" lang="he">
                                {item.hebrew}
                            </span>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {item.definitions.map((def) => (
                            <div key={def.id} className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-background border border-primary/20 text-xs font-bold text-primary shadow-sm mt-0.5">
                                    {def.id}
                                </span>
                                <p className="text-sm leading-relaxed text-foreground/90">
                                    {def.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
