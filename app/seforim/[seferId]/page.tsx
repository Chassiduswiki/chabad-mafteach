'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { BookOpen, ChevronLeft, FileText, Eye, EyeOff, Type, Minus, Plus, X } from 'lucide-react';
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

interface Paragraph {
    id: number;
    title?: string;
    order_key: string;
    text?: string;
    statements: Statement[];
}

interface Document {
    id: number;
    title: string;
    doc_type?: string;
    author?: string; // Added for hierarchical display
    hasContent?: boolean; // Added for content detection
    paragraphs: Paragraph[];
}

interface CitationModal {
    isOpen: boolean;
    citation: string;
    context: string;
    references: any[];
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
    const observerRef = useRef<IntersectionObserver | null>(null);
    const paragraphRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [citationModal, setCitationModal] = useState<CitationModal>({
        isOpen: false,
        citation: '',
        context: '',
        references: []
    });

    // Hebrew detection helper
    const isHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

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
                // First check if this document has children (hierarchical navigation)
                const childrenResult = await directus.request(readItems('documents', {
                    filter: { parent_id: { _eq: seferId } },
                    fields: ['id', 'title', 'doc_type', 'author', 'category'],
                    sort: ['title']
                })) as any;

                const childrenArray = Array.isArray(childrenResult) ? childrenResult : [childrenResult];

                if (childrenArray.length > 0) {
                    // This document has children - show hierarchical navigation
                    const childrenWithContent = await Promise.all(
                        childrenArray.map(async (child: any) => {
                            try {
                                const paragraphs = await directus.request(readItems('paragraphs', {
                                    filter: { doc_id: { _eq: child.id } },
                                    limit: 1
                                })) as any;
                                const paraArray = Array.isArray(paragraphs) ? paragraphs : paragraphs ? [paragraphs] : [];
                                return { ...child, hasContent: paraArray.length > 0 };
                            } catch {
                                return { ...child, hasContent: false };
                            }
                        })
                    );

                    // Get parent document info
                    const parentDoc = await directus.request(readItems('documents', {
                        filter: { id: { _eq: seferId } },
                        fields: ['id', 'title', 'doc_type'],
                        limit: 1
                    })) as any;

                    const parentArray = Array.isArray(parentDoc) ? parentDoc : [parentDoc];
                    setDocument(parentArray[0] || null);
                    setChildDocuments(childrenWithContent);
                } else {
                    // This document has no children - show content
                    // Fetch the document first
                    const docResult = await directus.request(readItems('documents', {
                        filter: { id: { _eq: seferId } },
                        fields: ['id', 'title', 'doc_type'],
                        limit: 1
                    })) as any;

                    const docsArray = Array.isArray(docResult) ? docResult : docResult ? [docResult] : [];
                    const doc = docsArray[0] || null;

                    if (doc) {
                        // Fetch paragraphs separately
                        const paraResult = await directus.request(readItems('paragraphs', {
                            filter: { doc_id: { _eq: seferId } },
                            fields: ['id', 'order_key', 'text'],
                            sort: ['order_key']
                        })) as any;

                        const paragraphsArray = Array.isArray(paraResult) ? paraResult : [paraResult];
                        doc.paragraphs = paragraphsArray;

                        // Fetch statements for all paragraphs
                        const paragraphIds = paragraphsArray.map((p: any) => p.id);
                        if (paragraphIds.length > 0) {
                            const statementsResult = await (directus.request(readItems('statements', {
                                filter: { paragraph_id: { _in: paragraphIds } },
                                fields: ['id', 'text', 'appended_text', 'order_key', 'metadata', 'paragraph_id'] as any,
                                sort: ['order_key']
                            })) as Promise<any>);

                            const statementsArray = Array.isArray(statementsResult) ? statementsResult : [statementsResult];

                            // Group statements by paragraph_id
                            const statementsByParagraph = statementsArray.reduce((acc: any, stmt: any) => {
                                if (!acc[stmt.paragraph_id]) acc[stmt.paragraph_id] = [];
                                acc[stmt.paragraph_id].push(stmt);
                                return acc;
                            }, {});

                            // Attach statements to paragraphs
                            doc.paragraphs = doc.paragraphs.map((p: any) => ({
                                ...p,
                                statements: statementsByParagraph[p.id] || []
                            }));
                        }

                        setDocument(doc);
                        setChildDocuments([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching sefer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [seferId]);

    // Font size controls
    const cycleFontSize = () => {
        setFontSize(current => {
            if (current === 'small') return 'medium';
            if (current === 'medium') return 'large';
            return 'small';
        });
    };

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
                                <h1 className="text-xl font-semibold text-foreground">{document.title}</h1>
                                <p className="text-sm text-muted-foreground capitalize">{document.doc_type}</p>
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">{document.title}</h1>
                            <p className="text-sm text-muted-foreground capitalize">{document.doc_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Font Size Control */}
                        <button
                            onClick={cycleFontSize}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                            title={`Font size: ${fontSize}`}
                        >
                            <Type className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {fontSize === 'small' && 'Small'}
                                {fontSize === 'medium' && 'Medium'}
                                {fontSize === 'large' && 'Large'}
                            </span>
                        </button>

                        {/* Citation Toggle */}
                        <button
                            onClick={() => setShowCitations(!showCitations)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                        >
                            {showCitations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="hidden sm:inline">
                                {showCitations ? 'Hide Citations' : 'Show Citations'}
                            </span>
                        </button>
                        <Link
                            href="/seforim"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ← Back to Seforim
                        </Link>
                    </div>
                </div>

                {/* Content - Continuous Flow */}
                <div className="bg-background rounded-2xl p-8 sm:p-10 lg:p-14">
                    <div className={`font-serif ${fontSizeClasses[fontSize]} leading-[2.2] text-foreground tracking-wide`}>
                        {document.paragraphs && document.paragraphs.length > 0 ? (
                            document.paragraphs.map((paragraph, paraIndex) => (
                                <div
                                    key={paragraph.id}
                                    ref={(el) => observeParagraph(paragraph.id, el)}
                                    data-paragraph-id={paragraph.id}
                                    className={`mb-12 transition-opacity duration-700 ${
                                        visibleParagraphs.has(paragraph.id) ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    style={{
                                        direction: isHebrew(paragraph.text || '') ? 'rtl' : 'ltr',
                                        textAlign: isHebrew(paragraph.text || '') ? 'right' : 'left'
                                    }}
                                >
                                    {paragraph.title && (
                                        <h3 className="text-2xl font-semibold mb-6 text-primary border-b border-primary/20 pb-3">
                                            {paragraph.title}
                                        </h3>
                                    )}

                                    <div className="space-y-6">
                                        {paragraph.statements && paragraph.statements.length > 0 ? (
                                            paragraph.statements
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
                                                                className="inline-block mx-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
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
                                                        {stmtIndex < paragraph.statements.length - 1 && ' '}
                                                    </span>
                                                ))
                                        ) : (
                                            <p className="text-muted-foreground italic">
                                                {paragraph.text || 'No content available for this paragraph.'}
                                            </p>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.paragraphs?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Paragraphs</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.paragraphs?.reduce((total, p) => total + (p.statements?.length || 0), 0) || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Statements</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.paragraphs?.reduce((total, p) =>
                                    total + (p.statements?.filter(s => s.appended_text)?.length || 0), 0) || 0
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">With Citations</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-primary">
                                {document.paragraphs?.reduce((total, p) =>
                                    total + (p.statements?.reduce((stmtTotal, s) =>
                                        stmtTotal + (s.metadata?.citation_references?.length || 0), 0) || 0), 0) || 0
                                }
                            </div>
                            <div className="text-sm text-muted-foreground">Citation Refs</div>
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
        </div>
    );
}
