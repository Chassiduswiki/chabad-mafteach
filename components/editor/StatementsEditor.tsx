'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Edit, Trash2, Eye, Tag, Hash } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { TranslationInterface } from '@/components/editor/TranslationInterface';

interface Statement {
    id: number;
    text: string;
    order_key: number;
    paragraph_id: number;
    appended_text?: string;
    metadata?: any;
}

interface Topic {
    id: number;
    canonical_title: string;
    slug: string;
    topic_type: string;
}

interface StatementsEditorProps {
    paragraphId: number;
}

export function StatementsEditor({ paragraphId }: StatementsEditorProps) {
    const [statements, setStatements] = useState<Statement[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStatement, setEditingStatement] = useState<number | null>(null);
    const [draggedStatement, setDraggedStatement] = useState<number | null>(null);
    const [showTranslations, setShowTranslations] = useState<number | null>(null);

    useEffect(() => {
        loadStatements();
        loadTopics();
    }, [paragraphId]);

    const loadStatements = async () => {
        try {
            const response = await fetch(`/api/editor/statements?paragraphId=${paragraphId}`);
            const data = await response.json();
            setStatements(data.statements || []);
        } catch (error) {
            console.error('Failed to load statements:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTopics = async () => {
        try {
            const response = await fetch('/api/topics');
            const data = await response.json();
            setTopics(data.topics || []);
        } catch (error) {
            console.error('Failed to load topics:', error);
        }
    };

    const createStatement = async () => {
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

            if (response.ok) {
                const data = await response.json();
                setStatements(prev => [...prev, data.statement]);
                setEditingStatement(data.statement.id);
            }
        } catch (error) {
            console.error('Failed to create statement:', error);
        }
    };

    const updateStatement = async (id: number, text: string) => {
        try {
            const response = await fetch(`/api/editor/statements/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                setStatements(prev => prev.map(s => 
                    s.id === id ? { ...s, text } : s
                ));
            }
        } catch (error) {
            console.error('Failed to update statement:', error);
        }
    };

    const deleteStatement = async (id: number) => {
        if (!confirm('Are you sure you want to delete this statement?')) {
            return;
        }

        try {
            const response = await fetch(`/api/editor/statements/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setStatements(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete statement:', error);
        }
    };

    const handleDragStart = (id: number) => {
        setDraggedStatement(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (!draggedStatement || draggedStatement === targetId) return;

        // Reorder statements
        const newStatements = [...statements];
        const draggedIndex = newStatements.findIndex(s => s.id === draggedStatement);
        const targetIndex = newStatements.findIndex(s => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = newStatements.splice(draggedIndex, 1);
        newStatements.splice(targetIndex, 0, draggedItem);

        // Update order keys
        newStatements.forEach((statement, index) => {
            statement.order_key = index + 1;
        });

        setStatements(newStatements);
        setDraggedStatement(null);

        // TODO: Update order in backend
    };

    const addTopicTag = async (statementId: number, topicId: number) => {
        try {
            const response = await fetch('/api/statement-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statement_id: statementId,
                    topic_id: topicId,
                    relevance_score: 1.0,
                    is_primary: false
                })
            });

            if (response.ok) {
                // Refresh statements to show updated topic tags
                loadStatements();
            }
        } catch (error) {
            console.error('Failed to add topic tag:', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-foreground">Statements</h4>
                <button
                    onClick={createStatement}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Statement
                </button>
            </div>

            <div className="space-y-3">
                {statements.map((statement) => (
                    <div
                        key={statement.id}
                        draggable
                        onDragStart={() => handleDragStart(statement.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, statement.id)}
                        className={`border border-border rounded-lg overflow-hidden transition-all ${
                            draggedStatement === statement.id ? 'opacity-50' : ''
                        } ${editingStatement === statement.id ? 'ring-2 ring-primary' : ''}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    Statement {statement.order_key}
                                </span>
                                <button
                                    onClick={() => setShowTranslations(showTranslations === statement.id ? null : statement.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                    <Hash className="w-3 h-3" />
                                    Translate
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingStatement(editingStatement === statement.id ? null : statement.id)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    title="Edit statement"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteStatement(statement.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    title="Delete statement"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            {editingStatement === statement.id ? (
                                <div className="border border-border rounded-md">
                                    <TipTapEditor
                                        docId={null}
                                        className=""
                                        onEditorReady={(editor: any) => {
                                            if (statement.text && editor) {
                                                editor.commands.setContent(statement.text);
                                            }
                                            // Set up content change listener
                                            editor.on('update', ({ editor }: any) => {
                                                const content = editor.getHTML();
                                                updateStatement(statement.id, content);
                                            });
                                        }}
                                        onBreakStatements={async () => {
                                            // Not applicable for statement editing
                                        }}
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="prose prose-sm max-w-none text-foreground"
                                    dangerouslySetInnerHTML={{ __html: statement.text }}
                                />
                            )}

                            {/* Appended Text */}
                            {statement.appended_text && (
                                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="w-4 h-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Appended Content</span>
                                    </div>
                                    <div 
                                        className="prose prose-xs max-w-none text-orange-800 dark:text-orange-200"
                                        dangerouslySetInnerHTML={{ __html: statement.appended_text }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Translations */}
                        {showTranslations === statement.id && (
                            <div className="border-t border-border bg-purple-50/30 dark:bg-purple-950/10">
                                <div className="p-4">
                                    <TranslationInterface
                                        statementId={statement.id}
                                        originalText={statement.text}
                                        onTranslationUpdate={(translation) => {
                                            // Handle translation updates if needed
                                            console.log('Translation updated:', translation);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {statements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6" />
                    </div>
                    <h4 className="text-md font-medium mb-2">No statements yet</h4>
                    <p className="text-sm mb-4">Break down this paragraph into individual statements</p>
                    <button
                        onClick={createStatement}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Add First Statement
                    </button>
                </div>
            )}
        </div>
    );
}
