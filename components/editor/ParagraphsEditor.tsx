'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Plus, GripVertical, Edit, Trash2, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { useEditorState } from '@/hooks/useEditorState';
import { useParagraphsData } from '@/hooks/useParagraphsData';
import { validateParagraph } from '@/utils/editorBusinessLogic';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// Lazy load heavy components
const StatementsEditor = dynamic(() => import('@/components/editor/StatementsEditor').then(mod => ({ default: mod.StatementsEditor })), {
    loading: () => (
        <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading statements editor...</div>
        </div>
    ),
});

const TranslationInterface = dynamic(() => import('@/components/editor/TranslationInterface').then(mod => ({ default: mod.TranslationInterface })), {
    loading: () => (
        <div className="flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading translation interface...</div>
        </div>
    ),
});

interface ParagraphsEditorProps {
    topicId: number;
}

export function ParagraphsEditor({ topicId }: ParagraphsEditorProps) {
    const {
        state: { editingId, expandedIds, draggedId, showTranslationsId },
        setEditingId,
        toggleExpanded,
        setDraggedId,
        setShowTranslationsId,
    } = useEditorState();

    const {
        paragraphs,
        loading,
        error,
        createParagraph,
        updateParagraph,
        deleteParagraph,
        reorderParagraphs,
    } = useParagraphsData(topicId);

    const handleDragStart = (id: number) => {
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = paragraphs.findIndex(p => p.id === draggedId);
        const targetIndex = paragraphs.findIndex(p => p.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        await reorderParagraphs(draggedIndex, targetIndex);
        setDraggedId(null);
    };

    const [savingId, setSavingId] = useState<number | null>(null);

    const handleCreateParagraph = async () => {
        const newParagraph = await createParagraph();
        if (newParagraph) {
            setEditingId(newParagraph.id);
            // Small delay to ensure the DOM is updated before scrolling
            setTimeout(() => {
                const element = document.getElementById(`paragraph-${newParagraph.id}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };

    const handleUpdateParagraph = async (id: number, text: string) => {
        setSavingId(id);
        await updateParagraph(id, text);
        // Artificial delay for visual feedback if it's too fast
        setTimeout(() => setSavingId(null), 500);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500">Loading paragraphs...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-red-500">
                    Error: {error || 'An unknown error occurred'}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Paragraphs</h3>
                <button
                    onClick={handleCreateParagraph}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Paragraph
                </button>
            </div>

            <div className="space-y-3">
                {paragraphs.map((paragraph) => (
                    <div
                        key={paragraph.id}
                        id={`paragraph-${paragraph.id}`}
                        draggable
                        onDragStart={() => handleDragStart(paragraph.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, paragraph.id)}
                        className={`border border-border rounded-lg overflow-hidden transition-all ${draggedId === paragraph.id ? 'opacity-50' : ''} ${editingId === paragraph.id ? 'ring-2 ring-primary shadow-lg scale-[1.01]' : 'shadow-sm'}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    Paragraph {paragraph.order_key}
                                </span>
                                {paragraph.statements && paragraph.statements.length > 0 && (
                                    <button
                                        onClick={() => toggleExpanded(paragraph.id)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {expandedIds.has(paragraph.id) ? (
                                            <ChevronDown className="w-3 h-3" />
                                        ) : (
                                            <ChevronRight className="w-3 h-3" />
                                        )}
                                        {paragraph.statements.length} statements
                                    </button>
                                )}
                                {savingId === paragraph.id && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Saving...
                                    </div>
                                )}
                                {savingId !== paragraph.id && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Saved
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingId(editingId === paragraph.id ? null : paragraph.id)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                    title="Edit paragraph"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowTranslationsId(showTranslationsId === paragraph.id ? null : paragraph.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                    <Eye className="w-3 h-3" />
                                    Translate
                                </button>
                                <button
                                    onClick={() => deleteParagraph(paragraph.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    title="Delete paragraph"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {editingId === paragraph.id ? (
                                <div className="border border-border rounded-md">
                                    <TipTapEditor
                                        docId={null}
                                        className=""
                                        onEditorReady={(editor: any) => {
                                            if (paragraph.text && editor) {
                                                editor.commands.setContent(paragraph.text);
                                            }
                                            // Set up content change listener
                                            editor.on('update', ({ editor }: any) => {
                                                const content = editor.getHTML();
                                                handleUpdateParagraph(paragraph.id, content);
                                            });

                                            editor.on('blur', () => {
                                                setEditingId(null);
                                            });
                                        }}
                                        onBreakStatements={async () => {
                                            // Not applicable for paragraph editing
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="prose prose-sm max-w-none text-foreground"
                                    dangerouslySetInnerHTML={{ __html: paragraph.text || paragraph.content }}
                                />
                            )}
                        </div>

                        {/* Validation Feedback */}
                        {(() => {
                            const validation = validateParagraph(paragraph.text || paragraph.content);
                            if (!validation.isValid) {
                                return (
                                    <div className="mx-4 mb-4 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                            {validation.errors.map((error, idx) => (
                                                <p key={idx}>{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Translations */}
                        {showTranslationsId === paragraph.id && (
                            <div className="border-t border-border bg-purple-50/30 dark:bg-purple-950/10">
                                <div className="p-4">
                                    <TranslationInterface
                                        paragraphId={paragraph.id}
                                        originalText={paragraph.text || paragraph.content}
                                        onTranslationUpdate={(translation) => {
                                            // Handle translation updates if needed
                                            console.log('Translation updated:', translation);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Statements */}
                        {expandedIds.has(paragraph.id) && (
                            <div className="border-t border-border bg-muted/20">
                                <div className="p-4">
                                    <StatementsEditor paragraphId={paragraph.id} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {paragraphs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No paragraphs yet</h3>
                    <p className="text-sm mb-6">Start building your topic content by adding paragraphs</p>
                    <button
                        onClick={createParagraph}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Add First Paragraph
                    </button>
                </div>
            )}
        </div>
    );
}
