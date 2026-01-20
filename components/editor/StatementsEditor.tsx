'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Edit, Trash2, Eye, Tag, Hash, Loader2, X, Search } from 'lucide-react';
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

    const removeTopicTag = async (id: number) => {
        try {
            const response = await fetch(`/api/directus-proxy/items/statement_topics/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadStatements();
            }
        } catch (error) {
            console.error('Failed to remove topic tag:', error);
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
                        id={`statement-${statement.id}`}
                        draggable
                        onDragStart={() => handleDragStart(statement.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, statement.id)}
                        className={`border border-border rounded-lg overflow-hidden transition-all ${draggedStatement === statement.id ? 'opacity-50' : ''
                            } ${editingStatement === statement.id ? 'ring-2 ring-primary shadow-md scale-[1.01]' : 'shadow-sm'}`}
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
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
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

                            {/* Topic Tags */}
                            <div className="mt-4 flex flex-wrap gap-2 items-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
                                    <Tag className="w-3 h-3" />
                                    Tags
                                </div>
                                {(statement as any).statement_topics?.map((tag: any) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full border border-border group/tag"
                                    >
                                        {tag.topic_id?.canonical_title || 'Unknown Topic'}
                                        <button
                                            onClick={() => removeTopicTag(tag.id)}
                                            className="hover:text-destructive transition-colors pl-1 border-l border-border/50 ml-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                <TopicPicker onSelect={(topicId) => {
                                    const addTag = async () => {
                                        await fetch('/api/directus-proxy/items/statement_topics', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                statement_id: statement.id,
                                                topic_id: topicId,
                                                relevance_score: 1.0
                                            })
                                        });
                                        loadStatements();
                                    };
                                    addTag();
                                }} />
                            </div>
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

function TopicPicker({ onSelect }: { onSelect: (id: number) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [topics, setTopics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadTopics();
        }
    }, [open]);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/topics');
            const data = await response.json();
            setTopics(data.topics || []);
        } finally {
            setLoading(false);
        }
    };

    const filteredTopics = topics.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.name_hebrew?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1 px-2 py-0.5 border border-dashed border-primary/30 text-primary text-xs rounded-full hover:bg-primary/5 transition-colors"
            >
                <Plus className="w-3 h-3" />
                Add Tag
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 p-2">
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            autoFocus
                            className="w-full bg-muted/50 border-none rounded-md py-1.5 pl-7 pr-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Search topics..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {loading && <div className="p-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>}
                        {filteredTopics.slice(0, 10).map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => {
                                    onSelect(topic.id);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex justify-between items-center"
                            >
                                <span>{topic.name}</span>
                                <span className="text-[10px] text-muted-foreground font-hebrew">{topic.name_hebrew}</span>
                            </button>
                        ))}
                        {filteredTopics.length === 0 && !loading && (
                            <div className="p-2 text-center text-[10px] text-muted-foreground">No topics found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
