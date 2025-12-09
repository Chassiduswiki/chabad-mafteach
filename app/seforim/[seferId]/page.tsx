'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { BookOpen, ChevronLeft, FileText } from 'lucide-react';
import Link from 'next/link';

interface Document {
    id: number;
    title: string;
    doc_type?: string;
}

interface Chapter {
    id: number;
    title: string;
    order_key: string;
    paragraph_count: number;
}

export default function SeferPage() {
    const params = useParams();
    const router = useRouter();
    const seferId = parseInt(params.seferId as string);
    const [document, setDocument] = useState<Document | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!seferId) return;

            try {
                // Fetch the document details
                const docResult = await directus.request(readItems('documents', {
                    filter: { id: { _eq: seferId } },
                    fields: ['id', 'title', 'doc_type'],
                    limit: 1
                }));

                const docsArray = Array.isArray(docResult) ? docResult : docResult ? [docResult] : [];
                const doc = docsArray[0] || null;

                if (doc) {
                    setDocument(doc);

                    // For now, create placeholder chapters based on document structure
                    // In a real implementation, this would fetch actual chapter/section data
                    const placeholderChapters: Chapter[] = [
                        { id: 1, title: 'Chapter 1: Introduction', order_key: '1', paragraph_count: 0 },
                        { id: 2, title: 'Chapter 2: Main Content', order_key: '2', paragraph_count: 0 },
                        { id: 3, title: 'Chapter 3: Conclusion', order_key: '3', paragraph_count: 0 },
                    ];
                    setChapters(placeholderChapters);
                }
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

                {/* Chapters/Sections */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold mb-4">Chapters & Sections</h2>
                    
                    {chapters.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="mx-auto h-16 w-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium mb-2">No chapters available</h3>
                            <p className="text-sm">This sefer doesn't have any chapters or sections yet.</p>
                        </div>
                    ) : (
                        chapters.map((chapter) => (
                            <Link
                                key={chapter.id}
                                href={`/seforim/${seferId}/${chapter.order_key}`}
                                className="block p-6 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">{chapter.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {chapter.paragraph_count > 0 
                                                ? `${chapter.paragraph_count} paragraphs`
                                                : 'View content'
                                            }
                                        </p>
                                    </div>
                                    <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
