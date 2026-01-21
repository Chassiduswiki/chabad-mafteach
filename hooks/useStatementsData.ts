'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Statement {
    id: number;
    text: string;
    order_key: number;
    block_id: number;
    paragraph_id?: number; // Legacy compatibility
    appended_text?: string;
    metadata?: any;
}

export interface UseStatementsDataReturn {
    statements: Statement[];
    loading: boolean;
    error: string | null;
    loadStatements: (blockId: number) => Promise<void>;
    createStatement: (blockId: number) => Promise<void>;
    updateStatement: (id: number, text: string) => Promise<void>;
    deleteStatement: (id: number) => Promise<void>;
    reorderStatements: (blockId: number, startIndex: number, endIndex: number) => Promise<void>;
}

/**
 * Custom hook for managing statements data and CRUD operations
 */
export function useStatementsData(): UseStatementsDataReturn {
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStatements = useCallback(async (blockId: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/editor/statements?blockId=${blockId}`);

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

    const createStatement = useCallback(async (blockId: number) => {
        try {
            const response = await fetch('/api/editor/statements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    block_id: blockId,
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

    const reorderStatements = useCallback(async (blockId: number, startIndex: number, endIndex: number) => {
        // Filter statements for this content block
        const blockStatements = statements.filter(s => s.block_id === blockId);
        const otherStatements = statements.filter(s => s.block_id !== blockId);

        // Reorder block statements
        const newBlockStatements = [...blockStatements];
        const [movedStatement] = newBlockStatements.splice(startIndex, 1);
        newBlockStatements.splice(endIndex, 0, movedStatement);

        // Update order keys
        newBlockStatements.forEach((statement, index) => {
            statement.order_key = index + 1;
        });

        // Update all statements
        setStatements([...otherStatements, ...newBlockStatements]);

        // Persist to database
        try {
            await Promise.all(newBlockStatements.map((statement, index) =>
                fetch(`/api/editor/statements/${statement.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_key: index + 1 })
                })
            ));
        } catch (error) {
            console.error('Failed to reorder statements:', error);
            // Reload statements to revert optimistic update
            loadStatements(blockId);
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
