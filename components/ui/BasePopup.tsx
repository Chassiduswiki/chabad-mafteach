'use client';

import React, { useRef, useState, useLayoutEffect, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { calculatePopupPosition, PositionOptions } from '@/lib/utils/popup-positioning';

interface BasePopupProps {
    onClose: () => void;
    triggerPosition: { x: number; y: number };
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    showCloseButton?: boolean;
    positionOptions?: PositionOptions;
    className?: string;
    contentClassName?: string;
}

export function BasePopup({
    onClose,
    triggerPosition,
    children,
    header,
    footer,
    showCloseButton = true,
    positionOptions,
    className = '',
    contentClassName = 'p-4'
}: BasePopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = useState({ left: triggerPosition.x, top: triggerPosition.y });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useLayoutEffect(() => {
        if (popupRef.current) {
            const { left, top } = calculatePopupPosition(
                triggerPosition,
                {
                    width: popupRef.current.offsetWidth,
                    height: popupRef.current.offsetHeight
                },
                positionOptions
            );
            setPopupStyle({ left, top });
        }
    }, [triggerPosition, positionOptions, children, mounted]);

    if (!mounted) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[1px]"
                onClick={onClose}
                onTouchStart={onClose}
            />

            {/* Popup */}
            <div
                ref={popupRef}
                className={`fixed z-50 bg-background border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 ${className}`}
                style={popupStyle}
            >
                {/* Header */}
                {(header || showCloseButton) && (
                    <div className="flex items-start justify-between p-3 border-b border-border">
                        <div className="flex-1 min-w-0">{header}</div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-muted rounded-md transition-colors ml-2 flex-shrink-0"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={contentClassName}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-3 pb-2 text-[10px] text-muted-foreground text-center border-t border-border pt-2">
                        {footer}
                    </div>
                )}
            </div>
        </>,
        document.body
    );
}
