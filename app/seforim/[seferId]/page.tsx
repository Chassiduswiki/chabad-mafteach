'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TorahReader } from '@/components/TorahReader';

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

    useEffect(() => {
        const fetchData = async () => {
            if (!seferId) return;

            try {
                const response = await fetch(`/api/seforim/${seferId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setDocument(data.document);
                setChildDocuments(data.childDocuments || []);
            } catch (error) {
                console.error('Error fetching sefer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [seferId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading content...</p>
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
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
                                <p className="text-sm text-muted-foreground capitalize">{document.doc_type}</p>
                            </div>
                        </div>
                        <Link href="/seforim" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                            ← Back
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {childDocuments.map((child) => (
                            <Link
                                key={child.id}
                                href={`/seforim/${child.id}`}
                                className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                            {child.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                                            {child.doc_type || 'Section'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Use regular TorahReader for content display
    return (
        <TorahReader
            documentTitle={document.title}
            documentType={document.doc_type}
            sections={[
                {
                    id: document.id,
                    title: document.title,
                    order_key: "1",
                    statements: document.contentBlocks.flatMap(block =>
                        block.statements.map(s => ({
                            id: s.id,
                            order_key: s.order_key,
                            text: s.text,
                            translated_text: s.appended_text, // Use appended_text as translated for now if applicable, or just text
                            commentary_text: block.commentaries?.[0]?.commentary_text,
                            commentary_author: block.commentaries?.[0]?.author,
                            topics: [],
                            sources: []
                        }))
                    )
                }
            ]}
            currentSection={1}
            totalSections={1}
            topicsInDocument={[]}
            sources={[]}
        />
    );
}
