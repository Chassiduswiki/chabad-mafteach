'use client';

import React, { useRef } from 'react';
import { X, Info, Lightbulb, AlertCircle } from 'lucide-react';
import { usePopup } from '@/lib/popup-context';

interface TooltipPopupProps {
    title?: string;
    content: string;
    icon?: 'info' | 'tip' | 'warning';
    position: { x: number; y: number };
    actions?: Array<{
        label: string;
        onClick: () => void;
    }>;
}

export function TooltipPopup({ title, content, icon = 'info', position, actions }: TooltipPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const { closePopup } = usePopup();

    // Icon mapping
    const icons = {
        info: <Info className="h-5 w-5 text-blue-500" />,
        tip: <Lightbulb className="h-5 w-5 text-amber-500" />,
        warning: <AlertCircle className="h-5 w-5 text-orange-500" />
    };

    // Calculate position to prevent overflow
    const getPopupStyle = () => {
        const maxWidth = 320;
        const padding = 16;

        let x = position.x;
        let y = position.y + 10;

        // Prevent horizontal overflow
        if (x + maxWidth > window.innerWidth - padding) {
            x = window.innerWidth - maxWidth - padding;
        }
        if (x < padding) {
            x = padding;
        }

        return { left: x, top: y };
    };

    return (
        <>
            {/* Subtle backdrop */}
            <div className="fixed inset-0 bg-black/5 dark:bg-black/20 z-40" />

            {/* Tooltip */}
            <div
                ref={popupRef}
                className="fixed z-50 w-[90vw] max-w-xs bg-background border border-border rounded-lg shadow-xl"
                style={getPopupStyle()}
            >
                {/* Header */}
                <div className="flex items-start gap-3 p-3 border-b border-border">
                    <div className="mt-0.5">
                        {icons[icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h4 className="font-semibold text-sm text-foreground mb-1">
                                {title}
                            </h4>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {content}
                        </p>
                    </div>
                    <button
                        onClick={closePopup}
                        className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                        aria-label="Close"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Actions */}
                {actions && actions.length > 0 && (
                    <div className="flex gap-2 p-3 bg-muted/30">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    closePopup();
                                }}
                                className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer hint */}
                <div className="px-3 pb-2 text-[10px] text-muted-foreground text-center">
                    Press Esc or click outside to close
                </div>
            </div>
        </>
    );
}
