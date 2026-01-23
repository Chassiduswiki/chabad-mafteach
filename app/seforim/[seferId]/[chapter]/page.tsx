'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { BookOpen, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

interface Document {
    id: number;
    title: string;
    doc_type?: string;
}

interface Paragraph {
    id: number;
    text: string;
    order_key: string;
}

export default function ChapterPage() {
    const params = useParams();
    const router = useRouter();
    const seferId = parseInt(params.seferId as string);
    const chapter = params.chapter as string;
    const [document, setDocument] = useState<Document | null>(null);
    const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalChapters] = useState(3); // Placeholder total chapters

    useEffect(() => {
        const fetchData = async () => {
            if (!seferId || !chapter) return;

            try {
                // Fetch the document details
                const docResult = await directus.request(readItems('documents', {
                    filter: { id: { _eq: seferId } },
                    fields: ['id', 'title', 'doc_type'],
                    limit: 1
                }));

                const docsArray = Array.isArray(docResult) ? docResult : docResult ? [docResult] : [];
                const doc = (docsArray[0] as Document) || null;

                if (doc) {
                    setDocument(doc);

                    // Fetch paragraphs for this chapter
                    // In a real implementation, this would filter by chapter/section
                    const paraResult = await directus.request(readItems('paragraphs', {
                        filter: { doc_id: { _eq: seferId } },
                        fields: ['id', 'text', 'order_key'],
                        sort: ['order_key'],
                        limit: -1
                    }));

                    const paragraphsArray = (Array.isArray(paraResult) ? paraResult : paraResult ? [paraResult] : []) as Paragraph[];
                    setParagraphs(paragraphsArray);
                }
            } catch (error) {
                console.error('Error fetching chapter data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [seferId, chapter]);

    const navigateToChapter = (direction: 'prev' | 'next') => {
        const currentChapter = parseInt(chapter);
        let newChapter: number;
        
        if (direction === 'prev') {
            newChapter = Math.max(1, currentChapter - 1);
        } else {
            newChapter = Math.min(totalChapters, currentChapter + 1);
        }
        
        if (newChapter !== currentChapter) {
            router.push(`/seforim/${seferId}/${newChapter}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded-lg w-48"></div>
                        <div className="space-y-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-4 bg-muted rounded"></div>
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
                        <h3 className="text-lg font-medium mb-2">Content not found</h3>
                        <p className="text-sm mb-4">The requested content could not be found.</p>
                        <Link href="/seforim" className="text-primary hover:underline">
                            ← Back to Seforim
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                            <p className="text-sm text-muted-foreground">Chapter {chapter} of {totalChapters}</p>
                        </div>
                    </div>
                    <Link 
                        href={`/seforim/${seferId}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Chapters
                    </Link>
                </div>

                {/* Content */}
                <div className="bg-background/50 rounded-2xl border border-border p-8 sm:p-10 lg:p-14">
                    {paragraphs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium mb-2">No content available</h3>
                            <p className="text-sm">This chapter doesn't have any paragraphs yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {paragraphs.map((paragraph, index) => (
                                <div key={paragraph.id} className="prose prose-slate dark:prose-invert max-w-none">
                                    <div className="p-4 rounded-lg border bg-card/50">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {paragraph.order_key}
                                        </p>
                                        <div
                                            className="prose-sm dark:prose-invert text-sm leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: paragraph.text }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigateToChapter('prev')}
                        disabled={parseInt(chapter) <= 1}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                            ${parseInt(chapter) <= 1 
                                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Chapter
                    </button>

                    <div className="text-sm text-muted-foreground">
                        {chapter} of {totalChapters}
                    </div>

                    <button
                        onClick={() => navigateToChapter('next')}
                        disabled={parseInt(chapter) >= totalChapters}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                            ${parseInt(chapter) >= totalChapters 
                                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                    >
                        Next Chapter
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
