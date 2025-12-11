'use client';

import { useEffect, useState } from 'react';
import { Topic, ContentBlock, Statement } from '@/lib/types';
import { FileText, BookOpen, Plus, X, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems, createItem } from '@directus/sdk';
import { ArticleReader } from './ArticleReader';

// Input validation utilities
const sanitizeText = (text: string): string => {
    return text
        .trim()
        .replace(/[<>]/g, '') // Basic XSS prevention
        .slice(0, 1000); // Limit length
};

const validateStatementText = (text: string): boolean => {
    const sanitized = sanitizeText(text);
    return sanitized.length >= 3 && sanitized.length <= 1000;
};

/**
 * ArticleTab Component
 *
 * Manages topic article display and editing functionality.
 *
 * RESPONSIBILITIES:
 * - Receives topic object with content_blocks from API **[UPDATED]**
 * - Prepares content_block data for ArticleReader **[UPDATED]**
 * - Handles statement annotation/editing
 * - Provides editing modal for content_block content **[UPDATED]**
 *
 * DATA TRANSFORMATION:
 * Topic.contentBlocks[] → prepareArticleData() → ContentBlockWithStatements[] → ArticleReader **[UPDATED]**
 */

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
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [statements, setStatements] = useState<Record<number, Statement[]>>({});
    const [newStatementText, setNewStatementText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [loadingStatements, setLoadingStatements] = useState<Set<number>>(new Set());
    const [selectedContentBlock, setSelectedContentBlock] = useState<ContentBlock | null>(null);

    // Load contentBlocks for this topic
    useEffect(() => {
        loadContentBlocks();
    }, [topic.id]);

    // Seed statements map from API payload (document > contentBlocks > statements)
    useEffect(() => {
        if (!contentBlocks.length) return;
        setStatements(prev => {
            const next = { ...prev };
            for (const block of contentBlocks) {
                if (block.statements && block.statements.length > 0) {
                    next[block.id] = block.statements as Statement[];
                }
            }
            return next;
        });
    }, [contentBlocks]);

    const loadContentBlocks = async () => {
        try {
            setIsLoading(true);
            // Fetch statements for this topic
            const statementResults = await directus.request(readItems('statement_topics', {
                filter: { topic_id: { _eq: topic.id } },
                fields: ['statement_id'],
                limit: -1
            })) as any;

            if (statementResults.length === 0) {
                setContentBlocks([]);
                return;
            }

            const statementIds = statementResults.map((st: any) => st.statement_id);

            // Fetch the actual statements
            const statements = await directus.request(readItems('statements', {
                filter: { id: { _in: statementIds } },
                fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
                limit: -1
            })) as any;

            if (statements.length === 0) {
                setContentBlocks([]);
                return;
            }

            // Get unique block_ids
            const blockIds: number[] = Array.from(new Set(
                statements
                    .map((s: any) => s.block_id)
                    .filter((id: any): id is number => typeof id === 'number' && id !== null && id !== undefined)
            ));

            if (blockIds.length === 0) {
                setContentBlocks([]);
                return;
            }

            // Fetch content blocks
            const contentBlocksResult = await directus.request(readItems('content_blocks', {
                filter: { id: { _in: blockIds } },
                fields: ['id', 'order_key', 'content', 'block_type', 'page_number', 'chapter_number', 'halacha_number', 'daf_number', 'section_number', 'citation_refs', 'metadata', 'document_id'],
                sort: ['order_key']
            })) as any;

            // Group statements by block_id
            const statementsByBlock = statements.reduce((acc: any, stmt: any) => {
                if (!acc[stmt.block_id]) acc[stmt.block_id] = [];
                acc[stmt.block_id].push(stmt);
                return acc;
            }, {});

            // Attach statements to content blocks
            const contentBlocksWithStatements = contentBlocksResult.map((block: any) => ({
                ...block,
                statements: statementsByBlock[block.id] || []
            }));

            setContentBlocks(contentBlocksWithStatements);
        } catch (error) {
            console.error('Error loading content blocks:', error);
            setContentBlocks([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch statements for a content block
    const fetchStatements = async (contentBlockId: number) => {
        if (statements[contentBlockId]) return; // Already fetched
        
        setLoadingStatements(prev => new Set(prev).add(contentBlockId));
        try {
            const result = await directus.request(readItems('statements', {
                filter: { block_id: { _eq: contentBlockId } },
                fields: ['id', 'order_key', 'text', 'block_id'],
                sort: ['order_key'],
                limit: -1
            }));
            
            const statementsArray = Array.isArray(result) ? result : result ? [result] : [];
            setStatements(prev => ({ ...prev, [contentBlockId]: statementsArray }));
        } catch (error) {
            console.error('Error fetching statements:', error);
        } finally {
            setLoadingStatements(prev => {
                const next = new Set(prev);
                next.delete(contentBlockId);
                return next;
            });
        }
    };

    // Handle opening content block modal
    const handleContentBlockClick = async (contentBlock: typeof contentBlocks[0]) => {
        setSelectedContentBlock(contentBlock);
        await fetchStatements(contentBlock.id);
        setNewStatementText('');
    };

    // Handle creating new statement
    const handleCreateStatement = async () => {
        if (!selectedContentBlock || !newStatementText.trim()) return;

        const sanitizedText = sanitizeText(newStatementText);
        if (!validateStatementText(sanitizedText)) {
            alert('Statement must be between 3 and 1000 characters long.');
            return;
        }
        
        setIsCreating(true);
        try {
            // Create the statement
            const statement = await directus.request(createItem('statements', {
                text: sanitizedText,
                block_id: selectedContentBlock.id,
                order_key: `${statements[selectedContentBlock.id]?.length || 0 + 1}`,
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
                [selectedContentBlock.id]: [...(prev[selectedContentBlock.id] || []), statement as Statement]
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
        // Transform contentBlocks to include statements from both sources
        // Input: Topic.contentBlocks[] (from API)
        // Output: ContentBlockWithStatements[] (for ArticleReader)
        const contentBlocksWithStatements = contentBlocks.map(block => {
            const blockStatements = statements[block.id] || block.statements || [];
            const statementsWithTopics: StatementWithTopics[] = blockStatements.map((stmt: Statement) => ({
                id: stmt.id,
                order_key: stmt.order_key,
                text: stmt.text,
                appended_text: (stmt as any).appended_text, // Citation HTML
                topics: [topic], // For now, just the current topic
                sources: [], // TODO: Fetch sources when available
                document_title: undefined // ContentBlock doesn't have document_title
            }));

            return {
                id: block.id,
                content: block.content, // Full HTML content block content
                order_key: block.order_key,
                document_title: undefined, // ContentBlock doesn't have document_title
                statements: statementsWithTopics // Footnotes with citations
            };
        });

        // Collect all topics and sources
        const allTopics = new Map<number, Topic>();
        const allSources: { id: number; title: string; external_url?: string | null }[] = [];

        contentBlocksWithStatements.forEach(block => {
            block.statements.forEach(stmt => {
                stmt.topics.forEach(topic => allTopics.set(topic.id, topic));
            });
        });

        return {
            contentBlocks: contentBlocksWithStatements,
            topicsInArticle: Array.from(allTopics.values()),
            sources: allSources
        };
    };

    if (contentBlocks.length === 0) {
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

    const { contentBlocks: articleContentBlocks, topicsInArticle, sources } = prepareArticleData();

    return (
        <>
            {/* Article Reader */}
            <ArticleReader
                contentBlocks={articleContentBlocks}
                topicsInArticle={topicsInArticle}
                sources={sources}
                articleTitle={topic.canonical_title || topic.name || 'Article'}
                isLoading={isLoading}
            />

            {/* Statement Editing Modal - Keep for annotation */}
            {selectedContentBlock && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setSelectedContentBlock(null)}>
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
                                    Annotate Content Block {selectedContentBlock?.order_key}
                                </div>
                                <button
                                    onClick={() => setSelectedContentBlock(null)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded hover:bg-accent"
                                >
                                    Close
                                </button>
                            </div>
                            
                            {/* Content Block Text */}
                            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Content Block Text
                                </div>
                                <div 
                                    className="prose-sm dark:prose-invert text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedContentBlock?.content || '' }}
                                />
                            </div>

                            {/* Existing Statements */}
                            {selectedContentBlock && statements[selectedContentBlock.id] && statements[selectedContentBlock.id].length > 0 && (
                                <div className="mb-6">
                                    <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Existing Statements ({statements[selectedContentBlock.id].length})
                                    </div>
                                    <div className="space-y-3">
                                        {statements[selectedContentBlock.id].map((statement) => (
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

                            {/* Loading state for statements */}
                            {selectedContentBlock && loadingStatements.has(selectedContentBlock.id) && (
                                <div className="mb-6">
                                    <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Loading Statements...
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border animate-pulse">
                                                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                                                <div className="h-3 bg-muted rounded w-full"></div>
                                                <div className="h-3 bg-muted rounded w-3/4 mt-1"></div>
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
                                            disabled={!selectedContentBlock || !newStatementText.trim() || isCreating}
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
