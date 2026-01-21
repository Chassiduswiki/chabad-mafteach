'use client';

import { useState, useEffect, Suspense } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { createClient } from '@/lib/directus';
// No top-level call here - we use the API routes for data fetching
import { readItems } from '@directus/sdk';
import { Document } from '@/lib/directus';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic';

interface HierarchicalDocument {
    id: number;
    title: string;
    doc_type?: string;
    parent_id?: number;
    author?: string;
    category?: string;
    children?: HierarchicalDocument[];
    hasContent?: boolean;
}

function DocumentTree({ documents, level = 0 }: { documents: HierarchicalDocument[], level?: number }) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpanded = (docId: number) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(docId)) {
            newExpanded.delete(docId);
        } else {
            newExpanded.add(docId);
        }
        setExpanded(newExpanded);
    };

    return (
        <div className={`${level > 0 ? 'ml-6 border-l border-border pl-4' : ''}`}>
            {documents.map((doc) => {
                const hasChildren = doc.children && doc.children.length > 0;
                const isExpanded = expanded.has(doc.id);

                return (
                    <div key={doc.id} className="mb-2">
                        <div className="flex items-center group">
                            {/* Expand/Collapse Button */}
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpanded(doc.id)}
                                    className="p-1 rounded hover:bg-accent transition-colors mr-2"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>
                            ) : (
                                <div className="w-8" /> // Spacer for alignment
                            )}

                            {/* Document Link */}
                            <Link
                                href={`/seforim/${doc.id}`}
                                className="flex-1 group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {/* Icon based on type and content */}
                                            {doc.hasContent ? (
                                                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                                            ) : hasChildren ? (
                                                <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            )}

                                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {doc.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {doc.doc_type && (
                                                <span className="capitalize">{doc.doc_type}</span>
                                            )}
                                            {hasChildren && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                    {doc.children!.length} sections
                                                </span>
                                            )}
                                        </div>

                                        {doc.author && (
                                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                                by {doc.author}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Children */}
                        {hasChildren && isExpanded && (
                            <div className="mt-2">
                                <DocumentTree documents={doc.children!} level={level + 1} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SeforimContent() {
    const searchParams = useSearchParams();
    const category = searchParams?.get('category');

    const [seforim, setSeforim] = useState<HierarchicalDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeforim = async () => {
            try {
                // Fetch from server-side API with optional category filter
                const url = category
                    ? `/api/seforim?category=${encodeURIComponent(category)}`
                    : '/api/seforim';

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const roots = await response.json();
                setSeforim(roots);
            } catch (error: any) {
                console.error('Failed to fetch hierarchical seforim:', error);
                setSeforim([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSeforim();
    }, [category]);

    return (
        <>
            <GlobalNav />
            <div className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-5xl px-6 pt-6 pb-32 sm:px-8">

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                        <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Sources & Seforim
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        {category ? (
                            <span>
                                Showing <span className="font-semibold text-foreground capitalize">{category}</span> sources
                            </span>
                        ) : (
                            'Browse the Chabad literature collection and explore source texts'
                        )}
                    </p>
                </div>

                {/* Clean Grid Layout */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seforim.map((sefer) => (
                        <Link
                            key={sefer.id}
                            href={`/seforim/${sefer.id}`}
                            className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 block"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* Icon based on type and content */}
                                        {sefer.hasContent ? (
                                            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                                        ) : sefer.children && sefer.children.length > 0 ? (
                                            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}

                                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                            {sefer.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {sefer.doc_type && (
                                            <span className="capitalize">{sefer.doc_type}</span>
                                        )}
                                        {sefer.children && sefer.children.length > 0 && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                {sefer.children.length} sections
                                            </span>
                                        )}
                                    </div>

                                    {sefer.author && (
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            by {sefer.author}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {seforim.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No sources found</h3>
                        <p className="text-muted-foreground">
                            {category
                                ? `No sources found in the ${category} category.`
                                : 'Sources will appear here once they are added to the system.'
                            }
                        </p>
                    </div>
                )}
                </div>
            </div>
        </>
    );
}

export default function SeforimPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 sm:px-8 sm:py-16">
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
        }>
            <SeforimContent />
        </Suspense>
    );
}
