'use client';

import { useEffect, useState } from 'react';
import { Topic } from '@/lib/types';
import { FileText, BookOpen, Plus, X, MessageSquare } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import { ArticleReader } from './ArticleReader';

/**
 * ArticleTab Component
 *
 * Manages topic article display and editing functionality.
 *
 * RESPONSIBILITIES:
 * - Receives topic object with paragraphs from API
 * - Prepares paragraph data for ArticleReader
 * - Handles statement annotation/editing
 * - Provides editing modal for paragraph content
 *
 * DATA TRANSFORMATION:
 * Topic.paragraphs[] → prepareArticleData() → ParagraphWithStatements[] → ArticleReader
 */

interface Statement {
    id: number;
    order_key: string;
    text: string;
    paragraph_id?: number;
}

interface StatementWithTopics {
    id: number;
    order_key: string;
    text: string;
    appended_text?: string; // Citation HTML from API
    topics: Topic[];
    sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
    document_title?: string;
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

    // Prepare data for ArticleReader
    const prepareArticleData = () => {
        // Transform paragraphs to include statements from both sources
        // Input: Topic.paragraphs[] (from API)
        // Output: ParagraphWithStatements[] (for ArticleReader)
        const paragraphsWithStatements = paragraphs.map(para => {
            const paraStatements = statements[para.id] || para.statements || [];
            const statementsWithTopics: StatementWithTopics[] = paraStatements.map((stmt: Statement) => ({
                id: stmt.id,
                order_key: stmt.order_key,
                text: stmt.text,
                appended_text: (stmt as any).appended_text, // Citation HTML
                topics: [topic], // For now, just the current topic
                sources: [], // TODO: Fetch sources when available
                document_title: para.document_title
            }));

            return {
                id: para.id,
                text: para.text, // Full HTML paragraph content
                order_key: para.order_key,
                document_title: para.document_title,
                statements: statementsWithTopics // Footnotes with citations
            };
        });

        // Collect all topics and sources
        const allTopics = new Map<number, Topic>();
        const allSources: { id: number; title: string; external_url?: string | null }[] = [];

        paragraphsWithStatements.forEach(para => {
            para.statements.forEach(stmt => {
                stmt.topics.forEach(topic => allTopics.set(topic.id, topic));
            });
        });

        return {
            paragraphs: paragraphsWithStatements,
            topicsInArticle: Array.from(allTopics.values()),
            sources: allSources
        };
    };

    if (paragraphs.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">Article in Development</h3>

                {/* Show topic description if available */}
                {topic.description && (
                    <div className="mb-6 max-w-2xl mx-auto">
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            {topic.description}
                        </p>
                    </div>
                )}

                {/* Helpful next steps */}
                <div className="space-y-4 max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground">
                        While we build the full article, explore related content:
                    </p>

                    <div className="grid gap-3">
                        {/* Check if we have sources to show */}
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <h4 className="font-medium mb-2 text-foreground">📚 Explore Sources</h4>
                            <p className="text-xs text-muted-foreground mb-3">
                                See where this concept appears in Chassidic literature
                            </p>
                            <button className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                                View Sources Tab
                            </button>
                        </div>

                        {/* Related topics hint */}
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <h4 className="font-medium mb-2 text-foreground">🔗 Related Concepts</h4>
                            <p className="text-xs text-muted-foreground">
                                Discover interconnected Chassidic ideas
                            </p>
                        </div>

                        {/* Contribution hint */}
                        <div className="p-4 bg-muted/30 rounded-lg border border-border">
                            <h4 className="font-medium mb-2 text-foreground">✨ Help Build This</h4>
                            <p className="text-xs text-muted-foreground">
                                This platform grows with community contributions
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { paragraphs: articleParagraphs, topicsInArticle, sources } = prepareArticleData();

    return (
        <>
            {/* Article Reader */}
            <ArticleReader
                paragraphs={articleParagraphs}
                topicsInArticle={topicsInArticle}
                sources={sources}
                articleTitle={topic.canonical_title || topic.name || 'Article'}
                isLoading={isLoading}
            />

            {/* Statement Editing Modal - Keep for annotation */}
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
                                    Annotate Paragraph {selectedParagraph?.order_key}
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
                                    dangerouslySetInnerHTML={{ __html: selectedParagraph?.text || '' }}
                                />
                            </div>

                            {/* Existing Statements */}
                            {selectedParagraph && statements[selectedParagraph.id] && statements[selectedParagraph.id].length > 0 && (
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
                                            disabled={!selectedParagraph || !newStatementText.trim() || isCreating}
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
