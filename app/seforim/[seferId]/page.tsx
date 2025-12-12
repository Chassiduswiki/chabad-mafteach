'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, ChevronLeft, FileText, Eye, EyeOff, X, ArrowLeft, Settings, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';

interface Statement {
    id: number;
    text: string;
    appended_text: string;
    order_key: string;
    metadata?: {
        citation_references?: any[];
    };
}

interface ContentBlock {
    id: number;
    title?: string;
    order_key: string;
    content?: string;
    block_type?: string;
    page_number?: string;
    chapter_number?: number;
    halacha_number?: number;
    daf_number?: string;
    section_number?: number;
    citation_refs?: any[];
    metadata?: any;
    statements: Statement[];
    commentaries: BlockCommentary[];
}

interface BlockCommentary {
    id: number;
    block_id: number;
    commentary_text: string;
    author?: string;
    source?: string;
    commentary_type: string;
    language: string;
    order_position: number;
    is_official: boolean;
    quality_score: number;
    citation_source?: number;
    citation_page?: string;
    citation_reference?: string;
}

interface Document {
    id: number;
    title: string;
    doc_type?: string;
    author?: string; // Added for hierarchical display
    hasContent?: boolean; // Added for content detection
    contentBlocks: ContentBlock[];
}

interface CitationModal {
    isOpen: boolean;
    citation: string;
    context: string;
    references: any[];
}

interface ContentBlockModal {
    isOpen: boolean;
    contentBlock: ContentBlock | null;
    isBookmarked: boolean;
}

export default function SeferPage() {
    const params = useParams();
    const router = useRouter();
    const seferId = parseInt(params.seferId as string);
    const [document, setDocument] = useState<Document | null>(null);
    const [childDocuments, setChildDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCitations, setShowCitations] = useState(true);
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [visibleParagraphs, setVisibleParagraphs] = useState<Set<number>>(new Set());
    const [citationModal, setCitationModal] = useState<CitationModal>({
        isOpen: false,
        citation: '',
        context: '',
        references: []
    });
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const paragraphRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const [contentBlockModal, setContentBlockModal] = useState<ContentBlockModal>({
        isOpen: false,
        contentBlock: null,
        isBookmarked: false
    });

    // Citation Info Component
    const CitationInfo = ({ contentBlock }: { contentBlock: ContentBlock }) => {
        const citationParts = [];
        if (contentBlock.page_number) citationParts.push(`Page ${contentBlock.page_number}`);
        if (contentBlock.chapter_number) citationParts.push(`Chapter ${contentBlock.chapter_number}`);
        if (contentBlock.halacha_number) citationParts.push(`Halacha ${contentBlock.halacha_number}`);
        if (contentBlock.daf_number) citationParts.push(`Daf ${contentBlock.daf_number}`);
        if (contentBlock.section_number) citationParts.push(`Section ${contentBlock.section_number}`);

        if (citationParts.length === 0) return null;

        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border/50 pb-2 mb-4">
                <span className="font-medium text-primary">📖</span>
                <span>{citationParts.join(' • ')}</span>
                {contentBlock.citation_refs && contentBlock.citation_refs.length > 0 && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                        {contentBlock.citation_refs.length} citation format{contentBlock.citation_refs.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        );
    };

    // Hebrew detection helper
    const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
    const CommentaryPanel = ({ commentary }: { commentary: BlockCommentary }) => {
        const getTypeIcon = (type: string) => {
            switch (type) {
                case 'commentary': return '💬';
                case 'translation': return '🌍';
                case 'cross_reference': return '🔗';
                case 'explanation': return '💡';
                default: return '📝';
            }
        };

        return (
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50 mb-2">
                <div className="flex items-center gap-2 mb-2 text-xs">
                    <span>{getTypeIcon(commentary.commentary_type)}</span>
                    <span className="font-medium">{commentary.author || 'Anonymous'}</span>
                    {commentary.source && <span className="text-muted-foreground">• {commentary.source}</span>}
                    {commentary.is_official && <span className="bg-primary/10 text-primary px-1 rounded text-xs">Official</span>}
                </div>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: commentary.commentary_text }} />
                {commentary.citation_reference && (
                    <div className="mt-2 text-xs text-muted-foreground italic">
                        Source: {commentary.citation_reference}
                    </div>
                )}
            </div>
        );
    };

    // Font size classes
    const fontSizeClasses = {
        small: 'text-lg sm:text-xl lg:text-2xl',
        medium: 'text-xl sm:text-2xl lg:text-3xl',
        large: 'text-2xl sm:text-3xl lg:text-4xl'
    };

    // Intersection Observer for virtual scrolling
    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const paragraphId = parseInt(entry.target.getAttribute('data-paragraph-id') || '0');
                    setVisibleParagraphs(prev => {
                        const newSet = new Set(prev);
                        if (entry.isIntersecting) {
                            newSet.add(paragraphId);
                        } else {
                            newSet.delete(paragraphId);
                        }
                        return newSet;
                    });
                });
            },
            { rootMargin: '100px' }
        );

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Observe paragraphs when they mount
    const observeParagraph = (paragraphId: number, element: HTMLDivElement | null) => {
        if (element && observerRef.current) {
            paragraphRefs.current.set(paragraphId, element);
            observerRef.current.observe(element);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!seferId) return;

            try {
                console.log('Fetching sefer data from API for seferId:', seferId);
                const response = await fetch(`/api/seforim/${seferId}`);
                console.log('API response status:', response.status);
                console.log('API response ok:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('API error response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
                }

                const data = await response.json();
                console.log('API response data:', data);

                setDocument(data.document);
                setChildDocuments(data.childDocuments || []);
                console.log('Document and child documents set successfully');
            } catch (error) {
                console.error('Error fetching sefer data:', error);
                console.error('Error type:', typeof error);
                console.error('Error details:', {
                    message: (error as any)?.message,
                    code: (error as any)?.code,
                    stack: (error as any)?.stack
                });
                // Don't re-throw, just log - the component will handle null document state
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [seferId]);

    // Handle citation clicks
    const handleCitationClick = (citation: string, statement: Statement) => {
        // Extract plain text from HTML citation
        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = citation;
        const plainCitation = tempDiv.textContent || citation;

        setCitationModal({
            isOpen: true,
            citation: plainCitation,
            context: statement.text,
            references: statement.metadata?.citation_references || []
        });
    };

    // Close citation modal
    const closeCitationModal = () => {
        setCitationModal(prev => ({ ...prev, isOpen: false }));
    };

    // Long-press handlers for content blocks
    const handleContentBlockMouseDown = (contentBlock: ContentBlock) => {
        longPressTimer.current = setTimeout(() => {
            // Check if content block has citations
            const hasCitations = contentBlock.statements.some(s => s.appended_text);
            if (hasCitations) {
                setContentBlockModal({
                    isOpen: true,
                    contentBlock,
                    isBookmarked: false // TODO: Check actual bookmark status
                });
            }
        }, 500); // 500ms long press
    };

    const handleContentBlockMouseUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleContentBlockMouseLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Touch handlers for mobile
    const handleContentBlockTouchStart = (contentBlock: ContentBlock) => {
        longPressTimer.current = setTimeout(() => {
            const hasCitations = contentBlock.statements.some(s => s.appended_text);
            if (hasCitations) {
                setContentBlockModal({
                    isOpen: true,
                    contentBlock,
                    isBookmarked: false // TODO: Check actual bookmark status
                });
            }
        }, 500);
    };

    const handleContentBlockTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Close content block modal
    const closeContentBlockModal = () => {
        setContentBlockModal(prev => ({ ...prev, isOpen: false }));
    };

    // Toggle bookmark
    const toggleBookmark = () => {
        setContentBlockModal(prev => ({
            ...prev,
            isBookmarked: !prev.isBookmarked
        }));
        // TODO: Save bookmark to backend/collections
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded-lg w-48"></div>
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-muted rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">Sefer not found</h3>
                        <p className="text-sm mb-4">The requested sefer could not be found.</p>
                        <Link href="/seforim" className="text-primary hover:underline">
                            ← Back to Seforim
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // If this document has children, show hierarchical navigation
    if (childDocuments.length > 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">{document?.title || 'Untitled'}</h1>
                                <p className="text-sm text-muted-foreground capitalize">{document?.doc_type || ''}</p>
                            </div>
                        </div>
                        <Link
                            href="/seforim"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ← Back to Seforim
                        </Link>
                    </div>

                    {/* Child Documents Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {childDocuments.map((child) => (
                            <Link
                                key={child.id}
                                href={`/seforim/${child.id}`}
                                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 block"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {/* Icon based on type and content */}
                                            {child.hasContent ? (
                                                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            )}

                                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {child.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {child.doc_type && (
                                                <span className="capitalize">{child.doc_type}</span>
                                            )}
                                        </div>

                                        {child.author && (
                                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                                by {child.author}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Statistics */}
                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {childDocuments.length}
                                </div>
                                <div className="text-sm text-muted-foreground">Sections</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {childDocuments.filter(c => c.hasContent).length}
                                </div>
                                <div className="text-sm text-muted-foreground">With Content</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If no children, show content (existing logic)
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur flex items-center justify-between mb-8 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">{document.title}</h1>
                            <p className="text-sm text-muted-foreground capitalize">{document.doc_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        {/* Settings Popup */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettingsPopup(!showSettingsPopup)}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                            >
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>

                            {/* Settings Dropdown */}
                            {showSettingsPopup && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowSettingsPopup(false)}
                                    />

                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-40">
                                        <div className="space-y-4">
                                            {/* Font Size Control */}
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-2 block">
                                                    Font Size
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setFontSize('small')}
                                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                                            fontSize === 'small'
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border hover:bg-accent'
                                                        }`}
                                                    >
                                                        Small
                                                    </button>
                                                    <button
                                                        onClick={() => setFontSize('medium')}
                                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                                            fontSize === 'medium'
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border hover:bg-accent'
                                                        }`}
                                                    >
                                                        Medium
                                                    </button>
                                                    <button
                                                        onClick={() => setFontSize('large')}
                                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                                            fontSize === 'large'
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border hover:bg-accent'
                                                        }`}
                                                    >
                                                        Large
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Citation Toggle */}
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-2 block">
                                                    Citations
                                                </label>
                                                <button
                                                    onClick={() => setShowCitations(!showCitations)}
                                                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors w-full ${
                                                        showCitations
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'border-border hover:bg-accent'
                                                    }`}
                                                >
                                                    {showCitations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    {showCitations ? 'Hide Citations' : 'Show Citations'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link
                            href="/seforim"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Content - Al HaTorah Style Layered Display */}
                <div className="bg-card/90 dark:bg-card/30 rounded-2xl p-8 sm:p-10 lg:p-14 border border-border/50">
                    <div className={`leading-[2.2] text-foreground tracking-wide`}>
                        {document.contentBlocks && document.contentBlocks.length > 0 ? (
                            document.contentBlocks.map((contentBlock, blockIndex) => (
                                <div
                                    key={contentBlock.id}
                                    ref={(el) => observeParagraph(contentBlock.id, el)}
                                    data-paragraph-id={contentBlock.id}
                                    className={`mb-12 transition-opacity duration-700 ${
                                        visibleParagraphs.has(contentBlock.id) ? 'opacity-100' : 'opacity-0'
                                    } ${contentBlock.statements.some(s => s.appended_text) ? 'cursor-pointer select-none' : ''}`}
                                >
                                    {/* Citation Info Header */}
                                    <CitationInfo contentBlock={contentBlock} />

                                    {/* Al HaTorah Style Layout: Base Text + Commentaries */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Text Column */}
                                        <div className="lg:col-span-2">
                                            <div
                                                className={`${fontSizeClasses[fontSize]} font-serif`}
                                                style={{
                                                    direction: isHebrew(contentBlock.content || '') ? 'rtl' : 'ltr',
                                                    textAlign: 'justify',
                                                    textAlignLast: isHebrew(contentBlock.content || '') ? 'right' : 'left'
                                                }}
                                                onMouseDown={() => handleContentBlockMouseDown(contentBlock)}
                                                onMouseUp={handleContentBlockMouseUp}
                                                onMouseLeave={handleContentBlockMouseLeave}
                                                onTouchStart={() => handleContentBlockTouchStart(contentBlock)}
                                                onTouchEnd={handleContentBlockTouchEnd}
                                            >
                                                {contentBlock.title && (
                                                    <h3 className="text-2xl font-semibold mb-6 text-primary border-b border-primary/20 pb-3">
                                                        {contentBlock.title}
                                                    </h3>
                                                )}

                                                <div className="space-y-6">
                                                    {contentBlock.statements && contentBlock.statements.length > 0 ? (
                                                        contentBlock.statements
                                                            .sort((a, b) => a.order_key.localeCompare(b.order_key))
                                                            .map((statement, stmtIndex) => (
                                                                <span key={statement.id} className="inline">
                                                                    {/* Main text */}
                                                                    <span
                                                                        className="text-foreground"
                                                                        dangerouslySetInnerHTML={{ __html: statement.text }}
                                                                    />

                                                                    {/* Citation with hover effect */}
                                                                    {statement.appended_text && showCitations && (
                                                                        <span
                                                                            className="inline-block mx-1 px-2 py-1 text-xs bg-accent/60 text-accent-foreground hover:bg-accent rounded border border-accent/20 hover:border-accent/40 transition-colors cursor-pointer"
                                                                            dangerouslySetInnerHTML={{ __html: statement.appended_text }}
                                                                            onClick={() => handleCitationClick(statement.appended_text, statement)}
                                                                        />
                                                                    )}

                                                                    {/* Citation references indicator */}
                                                                    {statement.metadata?.citation_references && statement.metadata.citation_references.length > 0 && (
                                                                        <span className="mx-1 text-xs text-muted-foreground">
                                                                            ({statement.metadata.citation_references.length} refs)
                                                                        </span>
                                                                    )}

                                                                    {/* Add space between statements unless it's the last one */}
                                                                    {stmtIndex < contentBlock.statements.length - 1 && ' '}
                                                                </span>
                                                            ))
                                                    ) : (
                                                        <p className="text-muted-foreground italic">
                                                            {contentBlock.content || 'No content available for this block.'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Commentaries Column - Al HaTorah Style */}
                                        {contentBlock.commentaries && contentBlock.commentaries.length > 0 && (
                                            <div className="lg:col-span-1">
                                                <div className="sticky top-8">
                                                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                                                        <span>📚</span>
                                                        Commentaries ({contentBlock.commentaries.length})
                                                    </h4>
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {contentBlock.commentaries
                                                            .sort((a, b) => (a.order_position || 0) - (b.order_position || 0))
                                                            .map((commentary) => (
                                                                <CommentaryPanel key={commentary.id} commentary={commentary} />
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                                <h3 className="text-lg font-medium mb-2">No content available</h3>
                                <p className="text-sm">This sefer doesn't have any content yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistics */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.contentBlocks?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Content Blocks</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.contentBlocks?.reduce((total, b) => total + (b.statements?.length || 0), 0) || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Statements</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.contentBlocks?.reduce((total, b) =>
                                    total + (b.statements?.filter(s => s.appended_text)?.length || 0), 0) || 0
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">With Citations</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.contentBlocks?.reduce((total, b) =>
                                    total + (b.commentaries?.length || 0), 0) || 0
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">Commentaries</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.contentBlocks?.filter(b =>
                                    (b.page_number || b.chapter_number || b.halacha_number || b.daf_number || b.section_number)
                                ).length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">With Citation Info</div>
                        </div>
                    </div>
                </div>

                {/* Citation Modal */}
                {citationModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={closeCitationModal}
                        />

                        {/* Modal */}
                        <div className="relative w-full max-w-2xl mx-4 mb-4 bg-background rounded-t-2xl border border-border shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <h3 className="text-lg font-semibold text-foreground">Citation</h3>
                                <button
                                    onClick={closeCitationModal}
                                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div
                                className="p-6 max-h-96 overflow-y-auto"
                                style={{
                                    direction: isHebrew(citationModal.citation) ? 'rtl' : 'ltr',
                                    textAlign: isHebrew(citationModal.citation) ? 'right' : 'left'
                                }}
                            >
                                {/* Citation - Show First */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Citation</h4>
                                    <div className="bg-muted/50 rounded-lg p-4 font-serif text-foreground">
                                        {citationModal.citation}
                                    </div>
                                </div>

                                {/* Context - Show Second */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Context</h4>
                                    <p className="text-foreground italic">"{citationModal.context}"</p>
                                </div>

                                {/* References */}
                                {citationModal.references.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">References</h4>
                                        <div className="space-y-2">
                                            {citationModal.references.map((ref: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 text-sm"
                                                    style={{
                                                        direction: isHebrew(ref.text) ? 'rtl' : 'ltr',
                                                        textAlign: isHebrew(ref.text) ? 'right' : 'left'
                                                    }}
                                                >
                                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                                        {ref.type}
                                                    </span>
                                                    <span className="text-foreground">{ref.text}</span>
                                                    <span className="text-muted-foreground ml-auto">
                                                        {Math.round(ref.confidence * 100)}% confidence
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Block Modal */}
            {contentBlockModal.isOpen && contentBlockModal.contentBlock && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeContentBlockModal}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-2xl mx-4 mb-4 bg-background rounded-t-2xl border border-border shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">Content Block Actions</h3>
                            <button
                                onClick={closeContentBlockModal}
                                className="p-2 rounded-lg hover:bg-accent transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {/* Context Preview */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Context</h4>
                                <p className="text-foreground italic text-sm">
                                    "{contentBlockModal.contentBlock.statements.slice(0, 2).map(s => s.text).join(' ').slice(0, 150)}..."
                                </p>
                            </div>

                            {/* Citations List */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Citations</h4>
                                <div className="space-y-2">
                                    {contentBlockModal.contentBlock.statements
                                        .filter(statement => statement.appended_text)
                                        .map((statement, index) => (
                                            <button
                                                key={statement.id}
                                                onClick={() => {
                                                    closeContentBlockModal();
                                                    handleCitationClick(statement.appended_text, statement);
                                                }}
                                                className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-foreground line-clamp-2">
                                                            {statement.text}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                                            {statement.appended_text.replace(/<[^>]*>/g, '').slice(0, 60)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={toggleBookmark}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                                        contentBlockModal.isBookmarked
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'border-border hover:bg-accent'
                                    }`}
                                >
                                    {contentBlockModal.isBookmarked ? (
                                        <BookmarkCheck className="h-4 w-4" />
                                    ) : (
                                        <Bookmark className="h-4 w-4" />
                                    )}
                                    <span className="text-sm">
                                        {contentBlockModal.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => {
                                        // TODO: Open collections modal for saving
                                        closeContentBlockModal();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
                                >
                                    <Bookmark className="h-4 w-4" />
                                    <span className="text-sm">Save to Collection</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
