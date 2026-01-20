'use client';

import React from 'react';
import { GlossaryItem } from '@/lib/content/glossary-parser';

interface GlossaryGridProps {
    items: GlossaryItem[];
}

export default function GlossaryGrid({ items }: GlossaryGridProps) {
    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={idx} className="space-y-3">
                    {item.definitions.map((def) => (
                        <div key={def.id} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mt-0.5">
                                {def.id}
                            </span>
                            <p className="text-base leading-relaxed text-foreground">
                                {def.text}
                            </p>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
