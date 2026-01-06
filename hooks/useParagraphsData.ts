'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Paragraph {
    id: number;
    content: string; // Changed from text
    text?: string;    // Keep text for compatibility during migration if needed
    order_key: number;
    topic_id: number;
    document_id?: number;
    metadata?: any;
    statements?: Statement[];
}

export interface Statement {
    id: number;
    text: string;
    order_key: number;
    paragraph_id: number;
    appended_text?: string;
    metadata?: any;
}

export interface UseParagraphsDataReturn {
    paragraphs: Paragraph[];
    loading: boolean;
    error: string | null;
    loadParagraphs: () => Promise<void>;
    createParagraph: () => Promise<void>;
    updateParagraph: (id: number, text: string) => Promise<void>;
    deleteParagraph: (id: number) => Promise<void>;
    reorderParagraphs: (startIndex: number, endIndex: number) => Promise<void>;
}

/**
 * Custom hook for managing paragraphs data and CRUD operations
 */
export function useParagraphsData(topicId: number): UseParagraphsDataReturn {
    const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadParagraphs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/editor/paragraphs?topicId=${topicId}`);

            if (!response.ok) {
                throw new Error(`Failed to load paragraphs: ${response.status}`);
            }

            const data = await response.json();
            // API now provides 'text' mapped from 'content' for us
            setParagraphs(data.paragraphs || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load paragraphs';
            console.error('Failed to load paragraphs:', error);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    const createParagraph = useCallback(async () => {
        try {
            const response = await fetch('/api/editor/paragraphs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: topicId,
                    text: 'New paragraph content...', // Sent as text, API maps to content
                    metadata: { auto_generated: false }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to create paragraph: ${response.status}`);
            }

            const data = await response.json();
            setParagraphs(prev => [...prev, data.paragraph]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create paragraph';
            console.error('Failed to create paragraph:', error);
            setError(errorMessage);
        }
    }, [topicId]);

    const updateParagraph = useCallback(async (id: number, text: string) => {
        try {
            const response = await fetch(`/api/editor/paragraphs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }) // API maps to content
            });

            if (!response.ok) {
                throw new Error(`Failed to update paragraph: ${response.status}`);
            }

            setParagraphs(prev => prev.map(p =>
                p.id === id ? { ...p, text, content: text } : p
            ));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update paragraph';
            console.error('Failed to update paragraph:', error);
            setError(errorMessage);
        }
    }, []);

    const deleteParagraph = useCallback(async (id: number) => {
        if (!confirm('Are you sure you want to delete this paragraph and all its statements?')) {
            return;
        }

        try {
            const response = await fetch(`/api/editor/paragraphs/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete paragraph: ${response.status}`);
            }

            setParagraphs(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete paragraph';
            console.error('Failed to delete paragraph:', error);
            setError(errorMessage);
        }
    }, []);

    const reorderParagraphs = useCallback(async (startIndex: number, endIndex: number) => {
        const newParagraphs = [...paragraphs];
        const [movedParagraph] = newParagraphs.splice(startIndex, 1);
        newParagraphs.splice(endIndex, 0, movedParagraph);

        // Update order keys
        newParagraphs.forEach((paragraph, index) => {
            paragraph.order_key = index + 1;
        });

        setParagraphs(newParagraphs);

        try {
            // Update order keys in database
            await Promise.all(newParagraphs.map((paragraph, index) =>
                fetch(`/api/editor/paragraphs/${paragraph.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_key: index + 1 })
                })
            ));
        } catch (error) {
            console.error('Failed to reorder paragraphs:', error);
            loadParagraphs();
        }
    }, [paragraphs, loadParagraphs]);

    useEffect(() => {
        loadParagraphs();
    }, [loadParagraphs]);

    return {
        paragraphs,
        loading,
        error,
        loadParagraphs,
        createParagraph,
        updateParagraph,
        deleteParagraph,
        reorderParagraphs,
    };
}
