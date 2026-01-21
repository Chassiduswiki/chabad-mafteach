'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    height?: string; // e.g., 'h-[50vh]' or 'h-auto'
}

/**
 * BottomSheet - iOS style pull-up sheet
 */
export function BottomSheet({ isOpen, onClose, children, title, height = 'h-auto' }: BottomSheetProps) {
    const dragControls = useDragControls();
    const [dragY, setDragY] = useState(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Prevent background scrolling when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setDragY(0);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If dragged more than 100px down or with velocity > 500, close the sheet
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Only allow dragging down
        if (info.offset.y > 0) {
            setDragY(info.offset.y);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        drag="y"
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[90vh] ${height} shadow-2xl touch-none`}
                        style={{ y: dragY > 0 ? dragY : 0 }}
                    >
                        {/* Drag Handle & Header */}
                        <div 
                            className="flex-shrink-0 relative pt-3 pb-4 px-6 bg-background border-b border-border/50 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            {/* Swipe indicator */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted hover:bg-muted-foreground/30 rounded-full transition-colors" />

                            <div className="flex items-center justify-between mt-3">
                                <h3 className="font-semibold text-lg">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-muted transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
