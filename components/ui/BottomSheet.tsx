'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    // Prevent background scrolling when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

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
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col max-h-[90vh] ${height} shadow-2xl`}
                    >
                        {/* Drag Handle & Header */}
                        <div className="flex-shrink-0 relative pt-3 pb-4 px-6 bg-background border-b border-border/50">
                            <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full mb-4" />

                            <div className="flex items-center justify-between mt-2 md:mt-0">
                                <h3 className="font-semibold text-lg">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-muted transition-colors"
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
