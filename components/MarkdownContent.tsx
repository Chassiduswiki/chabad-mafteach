'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { InstantLookup } from './InstantLookup';
import { FootnotePopup } from './FootnotePopup';
import { usePopup, PopupType } from '@/lib/popup-context';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
    const { activePopup, showPopup } = usePopup();

    if (!content) return null;

    // Remove manual "Footnotes" heading if present, as remark-gfm adds its own
    const cleanContent = content.replace(/^##\s+Footnotes\s*$/gim, '');

    // Extract footnote definitions from markdown
    const footnoteMap = new Map<string, string>();
    // Regex to match [^id]: definition
    // We use a more robust regex that handles multi-line footnotes if they are indented
    const footnoteRegex = /\[\^([^\]]+)\]:\s*([\s\S]+?)(?=\n\[\^|$)/g;
    const matches = cleanContent.matchAll(footnoteRegex);
    for (const match of matches) {
        footnoteMap.set(match[1], match[2].trim());
    }

    return (
        <>
            <div
                className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
                onClick={(e) => {
                    // Handle footnote reference clicks
                    const target = e.target as HTMLElement;

                    // Check if clicked element is a footnote reference link
                    if (target.tagName === 'A' && target.hasAttribute('data-footnote-ref')) {
                        e.preventDefault();
                        e.stopPropagation();

                        const footnoteId = target.getAttribute('href')?.replace('#user-content-fn-', '') || '';
                        const footnoteText = footnoteMap.get(footnoteId) || 'Citation not found';

                        const rect = target.getBoundingClientRect();
                        showPopup(PopupType.FOOTNOTE, {
                            footnoteId,
                            footnoteText
                        }, { x: rect.left, y: rect.bottom });
                    }

                    // Also handle if user clicks the <sup> wrapper
                    if (target.tagName === 'SUP') {
                        const link = target.querySelector('a[data-footnote-ref]') as HTMLAnchorElement;
                        if (link) {
                            e.preventDefault();
                            e.stopPropagation();

                            const footnoteId = link.getAttribute('href')?.replace('#user-content-fn-', '') || '';
                            const footnoteText = footnoteMap.get(footnoteId) || 'Citation not found';

                            const rect = target.getBoundingClientRect();
                            showPopup(PopupType.FOOTNOTE, {
                                footnoteId,
                                footnoteText
                            }, { x: rect.left, y: rect.bottom });
                        }
                    }
                }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
                    components={{
                        // Custom link rendering
                        a: ({ node, href, children, ...props }) => {
                            if (href?.startsWith('lookup:')) {
                                return (
                                    <span
                                        className="text-primary hover:underline font-medium cursor-pointer border-b border-dashed border-primary/50 hover:border-solid"
                                        onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            // Use the text content as the search term
                                            const term = String(children);
                                            showPopup(PopupType.INSTANT_LOOKUP, { term }, { x: rect.left, y: rect.bottom });
                                        }}
                                    >
                                        {children}
                                    </span>
                                );
                            }
                            return (
                                <a href={href} {...props} className="text-primary hover:underline font-medium">
                                    {children}
                                </a>
                            );
                        },
                        // Style blockquotes for chassidic quotes
                        blockquote: ({ node, ...props }) => (
                            <blockquote {...props} className="border-l-4 border-primary/30 bg-muted/30 p-4 italic rounded-r-lg" />
                        ),
                        // Tables
                        table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-8 rounded-lg border border-border">
                                <table {...props} className="w-full" />
                            </div>
                        ),
                        th: ({ node, ...props }) => (
                            <th {...props} className="bg-muted/50 p-4 text-left font-semibold" />
                        ),
                        td: ({ node, ...props }) => (
                            <td {...props} className="border-t border-border p-4" />
                        )
                    }}
                >
                    {cleanContent}
                </ReactMarkdown>
            </div>

        </>
    );
}
