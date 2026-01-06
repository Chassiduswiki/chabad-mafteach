'use client';

import { useState, useCallback } from 'react';

export interface EditorState {
    editingId: number | null;
    expandedIds: Set<number>;
    draggedId: number | null;
    showTranslationsId: number | null;
}

export interface UseEditorStateReturn {
    state: EditorState;
    setEditingId: (id: number | null) => void;
    toggleExpanded: (id: number) => void;
    setDraggedId: (id: number | null) => void;
    setShowTranslationsId: (id: number | null) => void;
    resetEditorState: () => void;
}

/**
 * Custom hook for managing editor UI state
 * Handles editing, expansion, dragging, and translation states
 */
export function useEditorState(): UseEditorStateReturn {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [showTranslationsId, setShowTranslationsId] = useState<number | null>(null);

    const toggleExpanded = useCallback((id: number) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const resetEditorState = useCallback(() => {
        setEditingId(null);
        setExpandedIds(new Set());
        setDraggedId(null);
        setShowTranslationsId(null);
    }, []);

    return {
        state: {
            editingId,
            expandedIds,
            draggedId,
            showTranslationsId,
        },
        setEditingId,
        toggleExpanded,
        setDraggedId,
        setShowTranslationsId,
        resetEditorState,
    };
}
