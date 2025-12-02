'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Topic } from '@/lib/directus';
import { Lightbulb, BookOpen, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import { InstantLookup } from '@/components/InstantLookup';
import Link from 'next/link';
import { usePopup, PopupType } from '@/lib/popup-context';

interface OverviewTabProps {
    topic: Topic;
}

export default function OverviewTab({ topic }: OverviewTabProps) {
    // Parse key_concepts which might be a string
    const keyConcepts = (() => {
        if (!topic.key_concepts) return [];
        if (Array.isArray(topic.key_concepts)) return topic.key_concepts;
        try {
            const parsed = JSON.parse(topic.key_concepts);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    })();

    // Clean content to remove manual "Footnotes" heading
    const cleanOverview = topic.overview ? topic.overview.replace(/^##\s+Footnotes\s*$/gim, '') : '';

    const { showPopup } = usePopup();

    // Article expansion state
    const [articleExpanded, setArticleExpanded] = useState(false);

    // Helper component for clickable terms
    const TermButton = ({ term, children }: { term: string; children: React.ReactNode }) => (
        <button
            onClick={(e) => {
                showPopup(PopupType.INSTANT_LOOKUP, { term }, { x: e.clientX, y: e.clientY });
            }}
            className="text-primary underline decoration-dotted decoration-2 underline-offset-2 hover:decoration-solid transition-all"
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-12">
            {/* Definition Section */}


            {/* Overview Section - long-form Markdown content */}
            {cleanOverview && (
                <>
                    <div className={`prose prose-slate dark:prose-invert max-w-none ${!articleExpanded && cleanOverview.length > 1000 ? 'max-h-96 overflow-hidden relative' : ''}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                                rehypeSlug,
                                [rehypeAutolinkHeadings, { behavior: 'wrap' }]
                            ]}
                            components={{
                                // Custom rendering for better styling
                                h1: ({ node, ...props }) => <h1 className="mt-2 mb-6 text-3xl font-bold text-primary" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="mt-8 mb-4 text-2xl font-bold border-b pb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="mt-6 mb-3 text-xl font-semibold" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
                                ),
                                a: ({ node, href, children, ...props }) => {
                                    // Footnote reference links
                                    if (href?.startsWith('#fn-')) {
                                        return (
                                            <sup>
                                                <a
                                                    href={href}
                                                    className="text-primary hover:underline font-normal"
                                                    {...props}
                                                >
                                                    [{children}]
                                                </a>
                                            </sup>
                                        );
                                    }
                                    // Footnote backlinks
                                    if (href?.startsWith('#fnref-')) {
                                        return (
                                            <a
                                                href={href}
                                                className="text-primary hover:underline ml-2"
                                                {...props}
                                            >
                                                ↩
                                            </a>
                                        );
                                    }
                                    // Regular links
                                    return <a href={href} className="text-primary hover:underline" {...props}>{children}</a>;
                                },
                                // Style footnotes section
                                section: ({ node, ...props }) => {
                                    // Check if this is the footnotes section
                                    if (props.className === 'footnotes') {
                                        return (
                                            <section className="mt-12 pt-6 border-t" {...props}>
                                                <h2 className="text-xl font-semibold mb-4">Footnotes</h2>
                                                {props.children}
                                            </section>
                                        );
                                    }
                                    return <section {...props} />;
                                },
                                // Style individual footnotes
                                li: ({ node, ...props }) => {
                                    // Check if this is a footnote list item
                                    if (props.id?.startsWith('fn-')) {
                                        return <li className="text-sm text-muted-foreground mb-2" {...props} />;
                                    }
                                    return <li {...props} />;
                                },
                            }}
                        >
                            {cleanOverview}
                        </ReactMarkdown>

                        {/* Fade overlay for long articles */}
                        {!articleExpanded && cleanOverview.length > 1000 && (
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                        )}
                    </div>

                    {/* Expand/Collapse button for long articles */}
                    {cleanOverview.length > 1000 && (
                        <button
                            onClick={() => setArticleExpanded(!articleExpanded)}
                            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            {articleExpanded ? (
                                <>
                                    <ChevronUp className="h-4 w-4" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4" />
                                    Read more
                                </>
                            )}
                        </button>
                    )}
                </>
            )}

            {/* Key Concepts Section */}
            {keyConcepts.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-semibold">Key Concepts</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {keyConcepts.map((concept: any, index: number) => (
                            <Link
                                href={`/topics/${(concept.concept || concept).toLowerCase().replace(/\s+/g, '-')}`}
                                key={index}
                                className="group p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-sm transition-all text-left"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                        {concept.concept || concept}
                                    </h3>
                                    <span className="text-muted-foreground/50 group-hover:text-primary/50">
                                        <ArrowUpRight className="w-3 h-3" />
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                                    {concept.explanation || ''}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Demo: Add clickable term examples */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Try Instant Lookup
                </h3>
                <p className="text-sm text-muted-foreground">
                    Click on these terms to see instant definitions:{' '}
                    <TermButton term="Bittul">Bittul</TermButton>,{' '}
                    <TermButton term="Devekut">Devekut</TermButton>,{' '}
                    <TermButton term="Ahavah">Ahavah</TermButton>
                </p>
            </div>


        </div>
    );
}
