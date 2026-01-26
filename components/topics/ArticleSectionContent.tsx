'use client';

import React, { useMemo } from 'react';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseGlossaryContent } from '@/lib/content/glossary-parser';
import GlossaryGrid from '@/components/topics/smart-content/GlossaryGrid';
import { SoulLevelsDisplay } from '@/components/topics/custom-content/SoulLevelsDisplay';
import { TabularDataDisplay } from '@/components/topics/custom-content/TabularDataDisplay';
import { CitationReference } from '@/components/citations/CitationReference';
import { LucideIcon } from 'lucide-react';
import { Topic, Source } from '@/lib/types';
import { CitationReference as CitationReferenceType } from '@/lib/citation-utils';

// Dynamic import for SefirosChart to avoid SSR issues
import dynamic from 'next/dynamic';
const SefirosChart = dynamic(() => import('@/components/graph/SefirosChart').then(mod => mod.SefirosChart), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full animate-pulse bg-muted rounded-xl" />
});

interface SectionConfig {
    title: string;
    shortTitle: string;
    icon: LucideIcon | null;
    color: string;
    bgColor: string;
    borderColor: string;
}

// This is a simplified version of the config. In a real app, this would be shared.
const sectionConfig: Record<string, SectionConfig> = {
    definition: { title: 'Definition', shortTitle: 'Define', icon: null, color: 'text-primary', bgColor: 'bg-primary/5', borderColor: 'border-primary/20' },
    mashal: { title: 'Analogy', shortTitle: 'Mashal', icon: null, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/5', borderColor: 'border-amber-500/20' },
    personal_nimshal: { title: 'Personal Application', shortTitle: 'Personal', icon: null, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/5', borderColor: 'border-purple-500/20' },
    global_nimshal: { title: 'Universal Meaning', shortTitle: 'Universal', icon: null, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/5', borderColor: 'border-emerald-500/20' },
    sources: { title: 'Further Reading', shortTitle: 'Reading', icon: null, color: 'text-muted-foreground', bgColor: 'bg-muted/30', borderColor: 'border-border' },
};

interface ArticleSectionProps {
    type: string;
    content: string;
}

interface ArticleSectionContentProps {
    section: ArticleSectionProps;
    topic: Topic;
    citationMap?: Record<string, CitationReferenceType>;
}

export const ArticleSectionContent = ({ section, topic, citationMap }: ArticleSectionContentProps) => {

    const glossaryItems = useMemo(() => {
        if (['definition', 'mashal', 'personal_nimshal', 'global_nimshal'].includes(section.type)) {
            const textContent = section.content.replace(/<[^>]*>/g, ' ');
            return parseGlossaryContent(textContent, topic.canonical_title, topic.name_hebrew);
        }
        return null;
    }, [section.type, section.content, topic.canonical_title, topic.name_hebrew]);

    // Detect if content is markdown (contains markdown bullets, tables, or headers)
    const isMarkdown = useMemo(() => {
        const markdownPatterns = [
            /^\s*[•\-\*]\s+/m,           // Bullet points
            /^\s*\d+\.\s+/m,             // Numbered lists
            /^\s*#{1,6}\s+/m,            // Headers
            /^\s*\|.*\|.*\|/m,           // Tables
            /^\s*[-]{3,}/m               // Horizontal rules
        ];
        return markdownPatterns.some(pattern => pattern.test(section.content));
    }, [section.content]);

    const isGlossary = glossaryItems && glossaryItems.length > 0;
    const isSoulLevelContent = section.content.includes('Nefesh') && section.content.includes('Yechidah');
    const isTabularData = section.content.includes('Reference Chart') || (section.content.includes('\t') && section.content.split('\n').length > 5);
    const config = sectionConfig[section.type];
    const Icon = config?.icon;

    // Custom renderer for specific content
    if (isSoulLevelContent) {
        return <SoulLevelsDisplay content={section.content} />;
    }
    
    if (isTabularData) {
        return <TabularDataDisplay content={section.content} />;
    }

    // Special case: Sefiros Chart for the Sefiros topic
    if (section.type === 'charts' && topic.slug === 'sefiros') {
        console.log('Rendering SefirosChart for sefiros topic');
        return (
            <div className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                    <h3 className="text-2xl font-semibold text-foreground">The Ten Sefiros</h3>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                        Click on any Sefirah to explore its unique qualities and connections in the divine flow of creation.
                    </p>
                </div>
                <SefirosChart interactive={true} />
            </div>
        );
    }

    return (
        <>
            {!isGlossary && Icon && (
                <div className="flex items-center justify-between mb-5 select-none">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">{config.title}</h2>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-50 uppercase tracking-widest hidden sm:block">Double tap to focus</span>
                </div>
            )}
            {isGlossary ? (
                <GlossaryGrid items={glossaryItems} />
            ) : isMarkdown ? (
                <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline prose-ul:list-disc prose-ul:space-y-2 prose-ol:list-decimal prose-ol:space-y-2 prose-li:ml-4 prose-li:leading-relaxed prose-table:w-full prose-table:border-collapse prose-table:shadow-sm prose-table:rounded-lg prose-table:overflow-hidden prose-thead:bg-gradient-to-r prose-thead:from-muted/80 prose-thead:to-muted/60 prose-th:text-left prose-th:font-semibold prose-th:text-sm prose-th:uppercase prose-th:tracking-wide prose-th:px-6 prose-th:py-4 prose-th:border-b-2 prose-th:border-border/50 prose-td:px-6 prose-td:py-4 prose-td:border-b prose-td:border-border/30 prose-tr:transition-colors hover:prose-tr:bg-muted/20 prose-tbody:divide-y prose-tbody:divide-border/20">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline">
                    {(() => {
                        // Track citation index outside the replace function
                        let citationIndex = 0;
                        
                        // Regex to match plain text citations like [section 1], [ch. 5], [p. 23], etc.
                        const plainCitationRegex = /\[([^\]]+)\]/g;
                        
                        return parse(DOMPurify.sanitize(section.content, {
                            ADD_TAGS: ['span'],
                            ADD_ATTR: ['class', 'data-citation-id', 'data-source-id', 'data-source-title', 'data-reference', 'data-quote', 'data-note', 'data-url']
                        }), {
                            replace: (domNode: DOMNode) => {
                                // Handle span-based citation references (new format)
                                if (domNode instanceof Element && 
                                    domNode.name === 'span' && 
                                    (domNode.attribs.class === 'citation-ref' || domNode.attribs['data-citation-id'])) {
                                    
                                    citationIndex++;
                                    const id = domNode.attribs['data-citation-id'] || `inline-${citationIndex}`;
                                    const sourceId = domNode.attribs['data-source-id'];
                                    const sourceTitle = domNode.attribs['data-source-title'] || 'Source';
                                    const reference = domNode.attribs['data-reference'];
                                    const quote = domNode.attribs['data-quote'];
                                    const note = domNode.attribs['data-note'];
                                    const url = domNode.attribs['data-url'];
                                    
                                    const citation = citationMap?.[id];
                                    
                                    return (
                                        <CitationReference
                                            key={id}
                                            id={id}
                                            sourceId={sourceId || citation?.sourceId || ''}
                                            sourceTitle={sourceTitle || citation?.sourceTitle || 'Source'}
                                            reference={reference || citation?.reference}
                                            quote={quote}
                                            note={note}
                                            url={url}
                                            index={citationIndex}
                                        />
                                    );
                                }
                                
                                // Handle plain text nodes that may contain [bracketed citations]
                                if (domNode.type === 'text' && domNode.data) {
                                    const text = domNode.data;
                                    if (plainCitationRegex.test(text)) {
                                        // Reset regex state
                                        plainCitationRegex.lastIndex = 0;
                                        
                                        const parts: React.ReactNode[] = [];
                                        let lastIndex = 0;
                                        let match;
                                        
                                        while ((match = plainCitationRegex.exec(text)) !== null) {
                                            // Add text before the match
                                            if (match.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, match.index));
                                            }
                                            
                                            citationIndex++;
                                            const citationText = match[1]; // The text inside brackets
                                            const id = `plain-${citationIndex}`;
                                            
                                            parts.push(
                                                <CitationReference
                                                    key={id}
                                                    id={id}
                                                    sourceId=""
                                                    sourceTitle={citationText}
                                                    reference={citationText}
                                                    index={citationIndex}
                                                />
                                            );
                                            
                                            lastIndex = match.index + match[0].length;
                                        }
                                        
                                        // Add remaining text after last match
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        
                                        return <>{parts}</>;
                                    }
                                }
                            }
                        });
                    })()}
                </div>
            )}
        </>
    );
};
