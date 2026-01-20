'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Statement {
    id: number;
    text: string;
    order_key: number;
    paragraph_id: number;
    appended_text?: string;
    metadata?: any;
}

export interface UseStatementsDataReturn {
    statements: Statement[];
    loading: boolean;
    error: string | null;
    loadStatements: (paragraphId: number) => Promise<void>;
    createStatement: (paragraphId: number) => Promise<void>;
    updateStatement: (id: number, text: string) => Promise<void>;
    deleteStatement: (id: number) => Promise<void>;
    reorderStatements: (paragraphId: number, startIndex: number, endIndex: number) => Promise<void>;
}

/**
 * Custom hook for managing statements data and CRUD operations
 */
export function useStatementsData(): UseStatementsDataReturn {
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStatements = useCallback(async (paragraphId: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/editor/statements?paragraphId=${paragraphId}`);

            if (!response.ok) {
                throw new Error(`Failed to load statements: ${response.status}`);
            }

            const data = await response.json();
            setStatements(data.statements || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load statements';
            console.error('Failed to load statements:', error);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const createStatement = useCallback(async (paragraphId: number) => {
        try {
            const response = await fetch('/api/editor/statements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paragraph_id: paragraphId,
                    text: 'New statement content...',
                    metadata: { auto_generated: false }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to create statement: ${response.status}`);
            }

            const data = await response.json();
            setStatements(prev => [...prev, data.statement]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create statement';
            console.error('Failed to create statement:', error);
            setError(errorMessage);
        }
    }, []);

    const updateStatement = useCallback(async (id: number, text: string) => {
        try {
            const response = await fetch(`/api/editor/statements/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Failed to update statement: ${response.status}`);
            }

            setStatements(prev => prev.map(s =>
                s.id === id ? { ...s, text } : s
            ));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update statement';
            console.error('Failed to update statement:', error);
            setError(errorMessage);
        }
    }, []);

    const deleteStatement = useCallback(async (id: number) => {
        if (!confirm('Are you sure you want to delete this statement?')) {
            return;
        }

        try {
            const response = await fetch(`/api/editor/statements/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete statement: ${response.status}`);
            }

            setStatements(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete statement';
            console.error('Failed to delete statement:', error);
            setError(errorMessage);
        }
    }, []);

    const reorderStatements = useCallback(async (paragraphId: number, startIndex: number, endIndex: number) => {
        // Filter statements for this paragraph
        const paragraphStatements = statements.filter(s => s.paragraph_id === paragraphId);
        const otherStatements = statements.filter(s => s.paragraph_id !== paragraphId);

        // Reorder paragraph statements
        const newParagraphStatements = [...paragraphStatements];
        const [movedStatement] = newParagraphStatements.splice(startIndex, 1);
        newParagraphStatements.splice(endIndex, 0, movedStatement);

        // Update order keys
        newParagraphStatements.forEach((statement, index) => {
            statement.order_key = index + 1;
        });

        // Update all statements
        setStatements([...otherStatements, ...newParagraphStatements]);

        // TODO: Persist to database
        try {
            await Promise.all(newParagraphStatements.map((statement, index) =>
                fetch(`/api/editor/statements/${statement.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_key: index + 1 })
                })
            ));
        } catch (error) {
            console.error('Failed to reorder statements:', error);
            // Reload statements to revert optimistic update
            loadStatements(paragraphId);
        }
    }, [statements, loadStatements]);

    return {
        statements,
        loading,
        error,
        loadStatements,
        createStatement,
        updateStatement,
        deleteStatement,
        reorderStatements,
    };
}
