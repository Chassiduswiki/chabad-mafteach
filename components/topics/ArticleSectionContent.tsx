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
import { Topic, Source } from '@/lib/types';

// This is a simplified version of the config. In a real app, this would be shared.
const sectionConfig: Record<string, { title: string; shortTitle: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
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
}

export const ArticleSectionContent = ({ section, topic }: ArticleSectionContentProps) => {
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
                    {parse(DOMPurify.sanitize(section.content))}
                </div>
            )}
        </>
    );
};
