'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Share2, Bookmark, Copy, Check, X, Send } from 'lucide-react';

interface Annotation {
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    highlightedText: string;
}

interface AnnotationHighlightProps {
    children: React.ReactNode;
    paragraphId: string;
    topicSlug: string;
}

export function AnnotationHighlight({ children, paragraphId, topicSlug }: AnnotationHighlightProps) {
    const [selectedText, setSelectedText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [showAnnotationInput, setShowAnnotationInput] = useState(false);
    const [annotationText, setAnnotationText] = useState('');
    const [copied, setCopied] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load annotations from localStorage
        const stored = localStorage.getItem(`annotations-${topicSlug}-${paragraphId}`);
        if (stored) {
            setAnnotations(JSON.parse(stored));
        }
    }, [topicSlug, paragraphId]);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const text = selection.toString().trim();
            setSelectedText(text);
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();
            
            if (containerRect) {
                setMenuPosition({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top - 10
                });
                setShowMenu(true);
            }
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(selectedText);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setShowMenu(false);
        }, 1500);
    };

    const handleAddAnnotation = () => {
        setShowAnnotationInput(true);
        setShowMenu(false);
    };

    const handleSaveAnnotation = () => {
        if (!annotationText.trim()) return;

        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            text: annotationText,
            author: 'You',
            timestamp: new Date(),
            highlightedText: selectedText
        };

        const updated = [...annotations, newAnnotation];
        setAnnotations(updated);
        localStorage.setItem(`annotations-${topicSlug}-${paragraphId}`, JSON.stringify(updated));
        
        setAnnotationText('');
        setShowAnnotationInput(false);
        setSelectedText('');
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Shared from Chabad Maftaiach',
            text: `"${selectedText}"`,
            url: `${window.location.href}#${paragraphId}`
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`"${selectedText}" - ${window.location.href}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }
        } catch (err) {
            console.log('Share cancelled');
        }
        setShowMenu(false);
    };

    const closeMenu = () => {
        setShowMenu(false);
        setShowAnnotationInput(false);
        setSelectedText('');
    };

    return (
        <div 
            ref={containerRef}
            className="relative"
            onMouseUp={handleMouseUp}
        >
            {children}

            {/* Selection Menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute z-50 flex items-center gap-1 px-2 py-1.5 bg-foreground text-background rounded-lg shadow-xl"
                        style={{ 
                            left: menuPosition.x, 
                            top: menuPosition.y,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <button
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-background/20 rounded transition-colors"
                            title="Copy"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleAddAnnotation}
                            className="p-1.5 hover:bg-background/20 rounded transition-colors"
                            title="Add Note"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-1.5 hover:bg-background/20 rounded transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-background/30 mx-1" />
                        <button
                            onClick={closeMenu}
                            className="p-1 hover:bg-background/20 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Annotation Input Modal */}
            <AnimatePresence>
                {showAnnotationInput && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={(e) => e.target === e.currentTarget && closeMenu()}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
                        >
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold">Add Your Note</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    "{selectedText}"
                                </p>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={annotationText}
                                    onChange={(e) => setAnnotationText(e.target.value)}
                                    placeholder="Share your insight or question..."
                                    className="w-full h-24 p-3 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus
                                />
                            </div>
                            <div className="p-4 pt-0 flex gap-2 justify-end">
                                <button
                                    onClick={closeMenu}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAnnotation}
                                    disabled={!annotationText.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    Save Note
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Annotations Display */}
            {annotations.length > 0 && (
                <div className="mt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Your Notes ({annotations.length})
                    </h4>
                    {annotations.map((annotation) => (
                        <div 
                            key={annotation.id}
                            className="p-3 bg-primary/5 rounded-lg border border-primary/10"
                        >
                            <p className="text-xs text-muted-foreground italic mb-1.5">
                                "{annotation.highlightedText}"
                            </p>
                            <p className="text-sm">{annotation.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
