'use client';

import React from 'react';
import { Info, Lightbulb, AlertCircle } from 'lucide-react';
import { usePopup } from '@/lib/popup-context';
import { BasePopup } from '@/components/ui/BasePopup';

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
    const { closePopup } = usePopup();

    // Icon mapping
    const icons = {
        info: <Info className="h-5 w-5 text-blue-500" />,
        tip: <Lightbulb className="h-5 w-5 text-amber-500" />,
        warning: <AlertCircle className="h-5 w-5 text-orange-500" />
    };

    return (
        <BasePopup
            onClose={closePopup}
            triggerPosition={position}
            positionOptions={{ maxWidth: 320, offset: { y: 10 } }}
            className="w-[90vw] max-w-xs"
            contentClassName="p-0" // Custom content padding
            footer="Press Esc or click outside to close"
        >
            {/* Header/Content merged for this design */}
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
        </BasePopup>
    );
}
