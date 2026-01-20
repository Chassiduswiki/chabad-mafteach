'use client';

import { useEffect, useState } from 'react';
import { Topic, ContentBlock, Statement } from '@/lib/types';
import { BookOpen, Target, Lightbulb, Clock, Info, FileText, Plus, X, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import { safeDirectusCall, directusPool } from '@/lib/integration-hardening';
import { ArticleReader } from './ArticleReader';

// Lazy client initialization to avoid client-side URL errors
let _directus: ReturnType<typeof createClient> | null = null;
const getDirectus = () => {
    if (!_directus) {
        try {
            _directus = createClient();
        } catch (e) {
            console.warn('Failed to create Directus client:', e);
            return null;
        }
    }
    return _directus;
};

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

interface StatementWithTopics {
    id: number;
    order_key: string;
    text: string;
    appended_text?: string; // Citation HTML from API
    topics: Topic[];
    sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
    document_title?: string;
}

interface OverviewTabProps {
    topic: Topic;
}

export default function OverviewTab({ topic }: OverviewTabProps) {
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [statements, setStatements] = useState<Record<number, Statement[]>>({});
    const [newStatementText, setNewStatementText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [loadingStatements, setLoadingStatements] = useState<Set<number>>(new Set());
    const [selectedContentBlock, setSelectedContentBlock] = useState<ContentBlock | null>(null);

    useEffect(() => {
        loadContentBlocks();
    }, [topic.id]);

    const loadContentBlocks = async () => {
        try {
            setIsLoading(true);
            // CORRECT APPROACH: Get documents (articles) linked to this topic
            const directus = getDirectus();
            if (!directus) throw new Error('Directus client not available');

            const documents = await safeDirectusCall(
                () => directusPool.acquire(() =>
                    directus.request(readItems('documents', {
                        filter: {
                            topic: { _eq: topic.id },
                            doc_type: { _eq: 'entry' },
                            status: { _eq: 'published' }
                        },
                        fields: ['id', 'title'],
                        limit: -1
                    })) as Promise<{ id: number; title: string }[]>
                ),
                {
                    retries: 3,
                    timeout: 10000,
                    fallback: []
                }
            ) as { id: number; title: string }[];

            // Add null check for documents response
            if (!documents || !Array.isArray(documents) || documents.length === 0) {
                console.log(`No documents found for topic ${topic.id}`);
                setContentBlocks([]);
                return;
            }

            const documentIds = documents.map((doc: any) => doc.id);

            // Get content blocks for these documents
            const contentBlocksResult = await safeDirectusCall(
                () => directusPool.acquire(() =>
                    directus.request(readItems('content_blocks', {
                        filter: { document_id: { _in: documentIds } },
                        fields: ['id', 'order_key', 'content', 'block_type', 'page_number', 'chapter_number', 'halacha_number', 'daf_number', 'section_number', 'citation_refs', 'metadata', 'document_id'],
                        sort: ['order_key']
                    })) as Promise<any[]>
                ),
                {
                    retries: 3,
                    timeout: 10000,
                    fallback: []
                }
            ) as any[];

            // Add null check for content blocks response
            if (!contentBlocksResult || !Array.isArray(contentBlocksResult) || contentBlocksResult.length === 0) {
                console.log(`No content blocks found for documents: ${documentIds.join(', ')}`);
                setContentBlocks([]);
                return;
            }

            // Get all block IDs to fetch statements
            const blockIds = contentBlocksResult.map((block: any) => block.id);

            // Get statements for these content blocks - workaround for Directus SDK _in filter issue
            let statementsData: any[] = [];
            for (const blockId of blockIds) {
                try {
                    const blockStatements = await safeDirectusCall(
                        () => directusPool.acquire(() =>
                            directus.request(readItems('statements', {
                                filter: { block_id: { _eq: blockId } },
                                fields: ['id', 'text', 'appended_text', 'order_key', 'block_id'],
                                limit: -1
                            })) as Promise<any[]>
                        ),
                        {
                            retries: 2, // Fewer retries for individual statements
                            timeout: 5000,
                            fallback: []
                        }
                    ) as any[];

                    if (blockStatements && Array.isArray(blockStatements) && blockStatements.length > 0) {
                        statementsData.push(...blockStatements);
                    }
                } catch (error) {
                    console.error(`Error fetching statements for block ${blockId}:`, error);
                    // Continue with other blocks instead of failing completely
                }
            }

            // Group statements by block_id
            const statementsByBlock = statementsData.reduce((acc: any, stmt: any) => {
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
            // Improved error handling with meaningful messages
            let errorMessage = 'Unknown error occurred';
            let errorDetails = '';

            if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = error.stack || '';
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error && typeof error === 'object') {
                try {
                    errorMessage = JSON.stringify(error);
                } catch {
                    errorMessage = String(error);
                }
            }

            console.error('Error loading content blocks:', {
                message: errorMessage,
                details: errorDetails,
                topicId: topic.id,
                error
            });
            setContentBlocks([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback to original overview display if no article content
    const hasRichContent = topic.overview || topic.article || topic.practical_takeaways || topic.historical_context;

    if (!hasRichContent && !topic.description) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Info className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No Overview Available</h3>
                <p className="text-sm max-w-md mx-auto px-6">
                    This topic is currently being researched. Check back soon for a comprehensive overview.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Overview / Article */}
            {(topic.overview || topic.article) && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    {topic.overview && (
                        <div
                            className="text-lg leading-relaxed mb-8"
                            dangerouslySetInnerHTML={{ __html: topic.overview }}
                        />
                    )}
                    {topic.article && (
                        <div
                            className="mt-8 border-t border-border pt-8"
                            dangerouslySetInnerHTML={{ __html: topic.article }}
                        />
                    )}
                </div>
            )}

            {/* Quick Insights Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
                {topic.definition_positive && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Target className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-foreground">Core Definition</h3>
                        </div>
                        <div className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: topic.definition_positive }} />
                    </div>
                )}

                {topic.practical_takeaways && (
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-foreground">Practical Takeaway</h3>
                        </div>
                        <div className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: topic.practical_takeaways }} />
                    </div>
                )}
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                {topic.difficulty_level && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Info className="h-3 w-3" />
                        Level: <span className="text-foreground capitalize">{topic.difficulty_level}</span>
                    </div>
                )}
                {topic.estimated_read_time && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {topic.estimated_read_time} min read
                    </div>
                )}
            </div>
        </div>
    );
}
