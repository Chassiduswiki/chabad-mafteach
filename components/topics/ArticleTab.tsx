'use client';

import { useEffect, useState } from 'react';
import { Topic } from '@/lib/types';
import { FileText, BookOpen, Plus, X, MessageSquare } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';

interface Statement {
    id: number;
    order_key: string;
    text: string;
    paragraph_id?: number;
}

interface ArticleTabProps {
    topic: Topic;
}

export default function ArticleTab({ topic }: ArticleTabProps) {
    const { paragraphs = [] } = topic;
    const [selectedParagraph, setSelectedParagraph] = useState<typeof paragraphs[0] | null>(null);
    const [statements, setStatements] = useState<Record<number, Statement[]>>({});
    const [newStatementText, setNewStatementText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Group paragraphs by document
    const paragraphsByDocument = paragraphs.reduce((acc, para) => {
        const docTitle = para.document_title || 'Unknown Document';
        if (!acc[docTitle]) {
            acc[docTitle] = [];
        }
        acc[docTitle].push(para);
        return acc;
    }, {} as Record<string, typeof paragraphs>);

    const docEntries = Object.entries(paragraphsByDocument);
    const showDocHeaders = docEntries.length > 1;

    // Seed statements map from API payload (document > paragraphs > statements)
    useEffect(() => {
        if (!paragraphs.length) return;
        setStatements(prev => {
            const next = { ...prev };
            for (const para of paragraphs) {
                if (para.statements && para.statements.length > 0) {
                    next[para.id] = para.statements as Statement[];
                }
            }
            return next;
        });
    }, [paragraphs]);

    // Fetch statements for a paragraph
    const fetchStatements = async (paragraphId: number) => {
        if (statements[paragraphId]) return; // Already fetched
        
        try {
            const result = await directus.request(readItems('statements', {
                filter: { paragraph_id: { _eq: paragraphId } },
                fields: ['id', 'order_key', 'text', 'paragraph_id'],
                sort: ['order_key'],
                limit: -1
            }));
            
            const statementsArray = Array.isArray(result) ? result : result ? [result] : [];
            setStatements(prev => ({ ...prev, [paragraphId]: statementsArray }));
        } catch (error) {
            console.error('Error fetching statements:', error);
        }
    };

    // Handle opening paragraph modal
    const handleParagraphClick = async (paragraph: typeof paragraphs[0]) => {
        setSelectedParagraph(paragraph);
        await fetchStatements(paragraph.id);
        setNewStatementText('');
    };

    // Handle creating new statement
    const handleCreateStatement = async () => {
        if (!selectedParagraph || !newStatementText.trim()) return;
        
        setIsCreating(true);
        try {
            // Create the statement
            const statement = await directus.request(createItem('statements', {
                text: newStatementText.trim(),
                paragraph_id: selectedParagraph.id,
                order_key: `${statements[selectedParagraph.id]?.length || 0 + 1}`,
                status: 'draft'
            }));

            // Link statement to topic
            await directus.request(createItem('statement_topics', {
                statement_id: statement.id,
                topic_id: topic.id,
                relevance_score: 0.8,
                is_primary: false
            }));

            // Update local state
            setStatements(prev => ({
                ...prev,
                [selectedParagraph.id]: [...(prev[selectedParagraph.id] || []), statement as Statement]
            }));
            setNewStatementText('');
        } catch (error) {
            console.error('Error creating statement:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (paragraphs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Article Coming Soon</h3>
                <p className="text-sm max-w-md mx-auto">
                    The full article content for this topic will be available once the document paragraphs are associated.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                {/* Article Content */}
                {docEntries.map(([docTitle, docParagraphs]) => (
                    <section key={docTitle} className="space-y-6">
                        {showDocHeaders && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-semibold">{docTitle}</h2>
                            </div>
                        )}

                        <div className="space-y-4">
                            {docParagraphs
                                .sort((a, b) => a.order_key.localeCompare(b.order_key))
                                .map((para, index) => (
                                    <div key={index} className="prose prose-slate dark:prose-invert max-w-none">
                                        <div className="p-4 rounded-lg border bg-card/50 group hover:bg-card/70 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {para.order_key}
                                                    </p>
                                                    <div
                                                        className="prose-sm dark:prose-invert text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: para.text }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleParagraphClick(para)}
                                                    className="ml-4 p-2 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                                                    title="Annotate paragraph"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Statement Editing Modal */}
            {selectedParagraph && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setSelectedParagraph(null)}>
                    <div 
                        className="w-full max-w-2xl rounded-t-2xl bg-background border-t border-border shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <div className="flex justify-center py-3">
                            <div className="h-1.5 w-12 bg-muted-foreground/30 rounded-full" />
                        </div>
                        
                        <div className="px-4 pb-6 sm:px-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Annotate Paragraph {selectedParagraph.order_key}
                                </div>
                                <button
                                    onClick={() => setSelectedParagraph(null)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded hover:bg-accent"
                                >
                                    Close
                                </button>
                            </div>
                            
                            {/* Paragraph Text */}
                            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Paragraph Text
                                </div>
                                <div 
                                    className="prose-sm dark:prose-invert text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedParagraph.text }}
                                />
                            </div>

                            {/* Existing Statements */}
                            {statements[selectedParagraph.id] && statements[selectedParagraph.id].length > 0 && (
                                <div className="mb-6">
                                    <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Existing Statements ({statements[selectedParagraph.id].length})
                                    </div>
                                    <div className="space-y-3">
                                        {statements[selectedParagraph.id].map((statement) => (
                                            <div key={statement.id} className="bg-accent/30 rounded-lg p-3 border border-border">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        Statement {statement.order_key}
                                                    </span>
                                                </div>
                                                <div className="text-sm leading-relaxed">
                                                    {statement.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Create New Statement */}
                            <div>
                                <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Create New Statement
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        value={newStatementText}
                                        onChange={(e) => setNewStatementText(e.target.value)}
                                        placeholder="Enter statement text..."
                                        className="w-full p-3 rounded-lg border border-border bg-background resize-none h-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleCreateStatement}
                                            disabled={!newStatementText.trim() || isCreating}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Create Statement
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
