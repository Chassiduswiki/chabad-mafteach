'use client';

import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { usePopup } from '@/lib/popup-context';

interface FootnotePopupProps {
    footnoteId: string;
    footnoteText: string;
    position: { x: number; y: number };
}

export function FootnotePopup({ footnoteId, footnoteText, position }: FootnotePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const { closePopup } = usePopup();

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" />

            {/* Popup */}
            <div
                ref={popupRef}
                className="fixed z-50 w-[90vw] max-w-md bg-background border border-border rounded-xl shadow-2xl"
                style={{
                    left: `${Math.min(position.x, window.innerWidth - 400)}px`,
                    top: `${Math.min(position.y + 10, window.innerHeight - 300)}px`,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📖</span>
                        <span className="font-semibold text-sm text-muted-foreground">
                            Citation
                        </span>
                    </div>
                    <button
                        onClick={closePopup}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">
                        {footnoteText}
                    </p>

                    {/* Actions - Placeholder for Phase 2/3 */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            View Full Source
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            HebrewBooks →
                        </button>
                    </div>
                </div>

                {/* Footer hint */}
                <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
                    Press Esc to close
                </div>
            </div>
        </>
    );
}
