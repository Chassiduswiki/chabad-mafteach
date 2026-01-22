'use client';

import React, { useState } from 'react';
import { X, Tag, Trash2, Download, Check } from 'lucide-react';
import { useSelectionStore } from '@/lib/stores/useSelectionStore';

/**
 * Selection Toolbar
 * 
 * Floating toolbar that appears when items are selected.
 * Provides batch actions: tag, delete, export.
 * 
 * @example
 * ```tsx
 * <SelectionToolbar
 *   type="topics"
 *   onTag={(ids) => handleBulkTag(ids)}
 *   onDelete={(ids) => handleBulkDelete(ids)}
 *   onExport={(ids) => handleBulkExport(ids)}
 * />
 * ```
 */

interface SelectionToolbarProps {
    type: 'topics' | 'statements' | 'sources';
    onTag?: (ids: number[]) => void;
    onDelete?: (ids: number[]) => void;
    onExport?: (ids: number[]) => void;
}

export function SelectionToolbar({ type, onTag, onDelete, onExport }: SelectionToolbarProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const selectedTopics = useSelectionStore((state) => state.selectedTopics);
    const selectedStatements = useSelectionStore((state) => state.selectedStatements);
    const selectedSources = useSelectionStore((state) => state.selectedSources);
    const clearTopics = useSelectionStore((state) => state.clearTopics);
    const clearStatements = useSelectionStore((state) => state.clearStatements);
    const clearSources = useSelectionStore((state) => state.clearSources);

    // Get selected items based on type
    const selectedItems =
        type === 'topics' ? selectedTopics :
            type === 'statements' ? selectedStatements :
                selectedSources;

    const clearSelection =
        type === 'topics' ? clearTopics :
            type === 'statements' ? clearStatements :
                clearSources;

    // Don't show toolbar if nothing selected
    if (selectedItems.length === 0) return null;

    const handleAction = async (action: () => void) => {
        setIsProcessing(true);
        try {
            await action();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
                {/* Selection count */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">
                        {selectedItems.length} {type} selected
                    </span>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onTag && (
                        <button
                            onClick={() => handleAction(() => onTag(selectedItems))}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tag selected items"
                        >
                            <Tag className="w-4 h-4" />
                            <span className="text-sm font-medium">Tag</span>
                        </button>
                    )}

                    {onExport && (
                        <button
                            onClick={() => handleAction(() => onExport(selectedItems))}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export selected items"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-sm font-medium">Export</span>
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => handleAction(() => onDelete(selectedItems))}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete selected items"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Delete</span>
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Clear selection */}
                <button
                    onClick={clearSelection}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Clear selection"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}
