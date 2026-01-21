'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, Lightbulb, User, Globe, Library, ChevronRight, ExternalLink, Sparkles, Share2, Bookmark, BarChart, ArrowUp, ArrowDown, RefreshCcw, GitBranch, Loader2 } from 'lucide-react';
import { stripHtml } from '@/lib/utils/text';
import { ImmersiveHero } from '@/components/topics/hero/ImmersiveHero';
import { TopicSkeleton } from '@/components/topics/loading/TopicSkeleton';
import { ConceptConstellation } from '@/components/topics/visualization/ConceptConstellation';
import { ConstellationErrorBoundary } from '@/components/topics/visualization/ConstellationErrorBoundary';
import { ScrollProgressIndicator } from '@/components/topics/ScrollProgressIndicator';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Topic, Source } from '@/lib/types';
import { parseGlossaryContent } from '@/lib/content/glossary-parser';
import GlossaryGrid from '@/components/topics/smart-content/GlossaryGrid';
import { FocusModeTutorial } from '@/components/topics/FocusModeTutorial';
import { SourceViewerModal } from '@/components/topics/SourceViewerModal';
import { ArticleSectionContent } from '@/components/topics/ArticleSectionContent';
import { DeepDiveMode } from '@/components/topics/DeepDiveMode';
import { AnnotationHighlight } from '@/components/topics/annotations/AnnotationHighlight';
import { GlobalNav } from '@/components/layout/GlobalNav';

// Types
type SectionType = 'definition' | 'mashal' | 'personal_nimshal' | 'global_nimshal' | 'charts' | 'sources';

interface ArticleSection {
    type: SectionType;
    content: string;
    order: number;
}

interface TopicExperienceProps {
    topic: Topic;
    relatedTopics: any[];
    sources: Source[];
    citations: any[];
}

// Helper: Auto-link topic names in text
function linkifyTopicReferences(text: string, availableTopics: Array<{ name?: string; canonical_title: string; slug: string; name_hebrew?: string; alternate_names?: string[] }>): ReactNode {
    if (!text || availableTopics.length === 0) return text;
    
    // Build a map of topic names to slugs (case-insensitive matching)
    // Include canonical_title, name, Hebrew name, and alternate names
    const topicMap = new Map<string, string>();
    availableTopics.forEach(t => {
        if (!t.slug) return;
        
        // Add canonical title
        if (t.canonical_title) {
            topicMap.set(t.canonical_title.toLowerCase(), t.slug);
        }
        // Add name if different
        if (t.name && t.name !== t.canonical_title) {
            topicMap.set(t.name.toLowerCase(), t.slug);
        }
        // Add Hebrew name
        if ((t as any).name_hebrew) {
            topicMap.set((t as any).name_hebrew, t.slug); // Hebrew is case-sensitive
        }
        // Add alternate names
        if ((t as any).alternate_names && Array.isArray((t as any).alternate_names)) {
            (t as any).alternate_names.forEach((altName: string) => {
                if (altName) topicMap.set(altName.toLowerCase(), t.slug);
            });
        }
    });
    
    if (topicMap.size === 0) return text;
    
    // Create regex pattern matching any topic name (longest first to avoid partial matches)
    const sortedNames = Array.from(topicMap.keys()).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${sortedNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    // Split text by matches and rebuild with links
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIdx = 0;
    
    while ((match = pattern.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        
        // Add linked topic
        const matchedText = match[1];
        const slug = topicMap.get(matchedText.toLowerCase());
        if (slug) {
            parts.push(
                <Link 
                    key={`topic-link-${keyIdx++}`}
                    href={`/topics/${slug}`}
                    className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2 transition-colors"
                >
                    {matchedText}
                </Link>
            );
        } else {
            parts.push(matchedText);
        }
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
}

// Config
const sectionConfig: Record<SectionType, { title: string; shortTitle: string; icon: typeof BookOpen; color: string; bgColor: string; borderColor: string }> = {
    definition: {
        title: 'Definition',
        shortTitle: 'Define',
        icon: BookOpen,
        color: 'text-primary',
        bgColor: 'bg-primary/5',
        borderColor: 'border-primary/20'
    },
    mashal: {
        title: 'Analogy',
        shortTitle: 'Mashal',
        icon: Lightbulb,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/20'
    },
    personal_nimshal: {
        title: 'Personal Application',
        shortTitle: 'Personal',
        icon: User,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-500/5',
        borderColor: 'border-purple-500/20'
    },
    global_nimshal: {
        title: 'Universal Meaning',
        shortTitle: 'Universal',
        icon: Globe,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/5',
        borderColor: 'border-emerald-500/20'
    },
    charts: {
        title: 'Charts & Tables',
        shortTitle: 'Charts',
        icon: BarChart,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-500/5',
        borderColor: 'border-sky-500/20'
    },
    sources: {
        title: 'Further Reading',
        shortTitle: 'Reading',
        icon: Library,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-border'
    }
};

export function TopicExperience({ topic, relatedTopics, sources, citations }: TopicExperienceProps) {
    const [activeSection, setActiveSection] = useState<SectionType>('definition');
    const [isLoading, setIsLoading] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [allTopicsForLinking, setAllTopicsForLinking] = useState<Array<{ name?: string; canonical_title: string; slug: string }>>([]);

    // Fetch all topics for auto-linking in sources (lightweight call for names/slugs only)
    useEffect(() => {
        async function fetchAllTopicNames() {
            try {
                const res = await fetch('/api/topics?fields=name,canonical_title,slug,name_hebrew,alternate_names&limit=500');
                if (res.ok) {
                    const data = await res.json();
                    setAllTopicsForLinking(data.topics || []);
                }
            } catch (e) {
                // Fallback to related topics if fetch fails
                setAllTopicsForLinking(relatedTopics);
            }
        }
        fetchAllTopicNames();
    }, [relatedTopics]);
    const [focusedSection, setFocusedSection] = useState<SectionType | null>(null);
    const [sheetContent, setSheetContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Source | null>(null);
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
    const [showStickyTitle, setShowStickyTitle] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Show sticky title when scrolled past hero
    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                const heroBottom = heroRef.current.getBoundingClientRect().bottom;
                setShowStickyTitle(heroBottom < 56); // 56px = navbar height
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleTutorialClose = () => {
        setIsTutorialOpen(false);
        localStorage.setItem('hasSeenFocusModeTutorial', 'true');
    };

    const handleSourceClick = (source: Source) => {
        setSelectedSource(source);
    };

    const sectionRefs = useRef<Record<SectionType, HTMLElement | null>>({
        definition: null,
        mashal: null,
        personal_nimshal: null,
        global_nimshal: null,
        charts: null,
        sources: null
    });
    const tabsRef = useRef<HTMLDivElement>(null);

    // Simulate loading for smooth transition
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        const hasSeenTutorial = localStorage.getItem('hasSeenFocusModeTutorial');
        if (!hasSeenTutorial) {
            setIsTutorialOpen(true);
        }
        return () => clearTimeout(timer);
    }, []);

    // Helper: Highlight key concepts in text
    // Note: In a real app, do this safer to avoid breaking HTML tags.
    // Ideally use a parser or do this on the server.
    const highlightTerms = (html: string) => {
        if (!html || !topic.key_concepts || topic.key_concepts.length === 0) return html;

        let enhanced = html;
        // Sort by length desc to handle multi-word terms first
        const sortedConcepts = [...topic.key_concepts].sort((a, b) => b.concept.length - a.concept.length);

        sortedConcepts.forEach(({ concept }) => {
            // Simple negative lookahead to avoid replacing inside existing tags is hard with regex alone
            // We'll trust the content for this demo or use a simple boundary
            // This regex matches the word NOT inside a tag (roughly)
            const regex = new RegExp(`(?<!<[^>]*)(\b${concept}\b)`, 'gi');
            enhanced = enhanced.replace(regex, `<span role="button" tabindex="0" class="interactive-term font-medium" data-term="${concept}">$1</span>`);
        });
        return enhanced;
    };

    // Construct Sections from Topic Data
    const sections: ArticleSection[] = [
        {
            type: 'definition',
            order: 1,
            // Combine short description and detailed definition
            content: highlightTerms(`
                <div class="space-y-4">
                    ${topic.definition_positive
                    ? `<div class="prose-content">${topic.definition_positive}</div>`
                    : (topic.description ? `<p class="text-lg leading-relaxed font-medium">${topic.description}</p>` : '')
                }
                    ${topic.definition_negative ? `
                        <div class="pl-4 border-l-2 border-red-200 dark:border-red-900 mt-4">
                            <h4 class="text-sm font-semibold text-muted-foreground uppercase mb-1">What it is NOT</h4>
                            <div class="prose-content">${topic.definition_negative}</div>
                        </div>
                    ` : ''}
                </div>
            `)
        },
        // Only include optional sections if content exists
        ...(topic.mashal ? [{
            type: 'mashal' as SectionType,
            order: 2,
            content: highlightTerms(topic.mashal)
        }] : []),
        ...(topic.practical_takeaways ? [{
            type: 'personal_nimshal' as SectionType,
            order: 3,
            content: highlightTerms(topic.practical_takeaways)
        }] : []),
        ...(topic.global_nimshal ? [{
            type: 'global_nimshal' as SectionType,
            order: 4,
            content: highlightTerms(topic.global_nimshal)
        }] : []),
        ...(topic.charts ? [{
            type: 'charts' as SectionType,
            order: 5,
            content: highlightTerms(topic.charts)
        }] : []),
        // Always include sources
        {
            type: 'sources',
            order: 5,
            content: ''
        }
    ];

    // Handle Inline Term Clicks (if we have a way to detect them in HTML content)
        const handleContentInteraction = (term: string) => {
        const conceptData = topic.key_concepts?.find(c => c.concept.toLowerCase() === term.toLowerCase());
        if (conceptData) {
            setSheetContent({
                title: conceptData.concept,
                content: (
                    <div className="space-y-4">
                        <p className="text-lg leading-relaxed">{conceptData.explanation}</p>
                        {conceptData.link && (
                            <a href={conceptData.link} className="inline-flex items-center text-primary hover:underline">
                                Learn more <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                        )}
                    </div>
                )
            });
        } else {
            console.warn('No definition found for:', term);
        }
    };

    const handleContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const termEl = target.closest('.interactive-term');
        if (termEl) {
            const term = termEl.getAttribute('data-term');
            if (term) handleContentInteraction(term);
        }
    };

    const handleContentKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target as HTMLElement;
            const termEl = target.closest('.interactive-term');
            if (termEl) {
                e.preventDefault();
                const term = termEl.getAttribute('data-term');
                if (term) handleContentInteraction(term);
            }
        }
    };

    const toggleFocusMode = (section: SectionType) => {
        if (focusMode && focusedSection === section) {
            setFocusMode(false);
            setFocusedSection(null);
        } else {
            setFocusMode(true);
            setFocusedSection(section);
        }
    };

    const [isNavigating, setIsNavigating] = useState(false);

    const getRelationshipIcon = (type: string) => {
        switch (type) {
            case 'parent': return <ArrowUp className="w-4 h-4" />;
            case 'child': return <ArrowDown className="w-4 h-4" />;
            case 'opposite': return <RefreshCcw className="w-4 h-4" />;
            default: return <GitBranch className="w-4 h-4" />;
        }
    };

    const getRelationshipColor = (type: string) => {
        switch (type) {
            case 'parent': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
            case 'child': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'opposite': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            default: return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
        }
    };

    const handleGraphClick = (node: string, type: string) => {
        const relatedTopic = relatedTopics.find(t => t.canonical_title === node);
        const cleanDescription = relatedTopic?.description ? stripHtml(relatedTopic.description) : null;

        setSheetContent({
            title: node,
            content: (
                <div className="space-y-5">
                    {/* Type Badge with Icon */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getRelationshipColor(type)}`}>
                        {getRelationshipIcon(type)}
                        <span className="capitalize">{type} Concept</span>
                    </div>

                    {/* Description */}
                    <p className="text-lg leading-relaxed text-foreground">
                        {cleanDescription || `A related concept to ${topic.canonical_title}.`}
                    </p>

                    {/* Relationship Card */}
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <GitBranch className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-sm text-primary">How They Connect</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {relatedTopic?.relationship?.description 
                                ? stripHtml(relatedTopic.relationship.description)
                                : `Explore how ${node} relates to ${topic.canonical_title}.`}
                        </p>
                    </div>

                    {/* Hebrew Name if available */}
                    {relatedTopic?.name_hebrew && (
                        <div className="text-center py-2">
                            <span className="text-2xl font-hebrew text-muted-foreground">{relatedTopic.name_hebrew}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    {relatedTopic && (
                        <a 
                            href={`/topics/${relatedTopic.slug}`}
                            onClick={() => setIsNavigating(true)}
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                        >
                            {isNavigating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                            ) : (
                                <><span>Explore {node}</span> <ChevronRight className="w-4 h-4" /></>
                            )}
                        </a>
                    )}
                </div>
            )
        });
    };

    const scrollToSection = (sectionType: SectionType) => {
        setActiveSection(sectionType);
        const element = sectionRefs.current[sectionType];
        if (element) {
            const offset = 160;
            const top = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentSections = Object.entries(sectionRefs.current) as [SectionType, HTMLElement | null][];
                    // Optimization: Check if we are at bottom
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
                        // At bottom, probably sources
                        const lastSection = currentSections[currentSections.length - 1];
                        if (lastSection) setActiveSection(lastSection[0]);
                        ticking = false;
                        return;
                    }

                    for (const [type, element] of currentSections.reverse()) {
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            if (rect.top <= 200) { // Slight offset adjustment
                                setActiveSection(type);
                                break;
                            }
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoading) {
        return <TopicSkeleton />;
    }

    // Extract connected topics for graph
    const graphData = {
        centerConcept: topic.canonical_title,
        relatedConcepts: {
            parent: relatedTopics.find(t => t.relationship.direction === 'child')?.canonical_title,
            opposite: relatedTopics.find(t => t.relationship.type === 'opposite' || t.relationship.description?.includes('contrast'))?.canonical_title,
            components: relatedTopics.filter(t => t.relationship.direction === 'parent').map(t => t.canonical_title).slice(0, 3)
        }
    };

    return (
        <div className="min-h-screen bg-background relative">
            <GlobalNav showBack backHref="/topics" backLabel="Topics" />
            <ScrollProgressIndicator />
            <SourceViewerModal isOpen={!!selectedSource} onClose={() => setSelectedSource(null)} source={selectedSource} />
            <FocusModeTutorial isOpen={isTutorialOpen} onClose={handleTutorialClose} />
            {/* Immersive Hero */}
            <div ref={heroRef}>
                <ImmersiveHero
                    title={topic.canonical_title}
                    titleHebrew={topic.name_hebrew || ''}
                    category={topic.topic_type || 'Concept'}
                    definitionShort={topic.description}
                    topicSlug={topic.slug}
                />
            </div>

            {/* Sticky Title + Tab Navigation Container */}
            <div className="sticky top-[56px] z-40 bg-background border-b border-border shadow-sm">
                {/* Topic Title - shows when scrolled past hero */}
                <div className={`overflow-hidden transition-all duration-300 ${showStickyTitle ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {topic.topic_type || 'Concept'}
                        </span>
                        <h2 className="font-semibold text-foreground truncate">{topic.canonical_title}</h2>
                    </div>
                </div>
                
                {/* Tab Navigation with scroll indicators and keyboard support */}
                <div className="max-w-4xl mx-auto relative">
                    {/* Left scroll indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 sm:hidden" />
                    {/* Right scroll indicator */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />
                    
                    <div
                        ref={tabsRef}
                        className="flex overflow-x-auto overflow-y-hidden scrollbar-hide -mx-1 px-4 sm:px-6 snap-x snap-mandatory touch-pan-x"
                        role="tablist"
                        aria-label="Topic Sections"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        onKeyDown={(e) => {
                            const sectionTypes = sections.map(s => s.type);
                            const currentIndex = sectionTypes.indexOf(activeSection);
                            
                            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextIndex = (currentIndex + 1) % sectionTypes.length;
                                scrollToSection(sectionTypes[nextIndex]);
                                // Focus the next tab
                                const nextTab = document.getElementById(`tab-${sectionTypes[nextIndex]}`);
                                nextTab?.focus();
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevIndex = (currentIndex - 1 + sectionTypes.length) % sectionTypes.length;
                                scrollToSection(sectionTypes[prevIndex]);
                                // Focus the previous tab
                                const prevTab = document.getElementById(`tab-${sectionTypes[prevIndex]}`);
                                prevTab?.focus();
                            } else if (e.key === 'Home') {
                                e.preventDefault();
                                scrollToSection(sectionTypes[0]);
                                document.getElementById(`tab-${sectionTypes[0]}`)?.focus();
                            } else if (e.key === 'End') {
                                e.preventDefault();
                                scrollToSection(sectionTypes[sectionTypes.length - 1]);
                                document.getElementById(`tab-${sectionTypes[sectionTypes.length - 1]}`)?.focus();
                            }
                        }}
                    >
                        {sections.map((section, index) => {
                            const config = sectionConfig[section.type];
                            const Icon = config.icon;
                            const isActive = activeSection === section.type;

                            return (
                                <button
                                    key={section.type}
                                    id={`tab-${section.type}`}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`panel-${section.type}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => scrollToSection(section.type)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 border-b-2 transition-all whitespace-nowrap snap-start flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${isActive
                                        ? `border-primary ${config.color}`
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium hidden sm:inline">{config.title}</span>
                                    <span className="text-sm font-medium sm:hidden">{config.shortTitle}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 pb-48">
                {/* Article Sections */}
                {sections.map((section) => {
                    const config = sectionConfig[section.type];
                    const Icon = config.icon;

                    // SOURCES SECTION
                    if (section.type === 'sources') {
                        return (
                            <section
                                key={section.type}
                                id={`panel-${section.type}`}
                                role="tabpanel"
                                aria-labelledby={`tab-${section.type}`}
                                ref={(el: HTMLDivElement | null) => { sectionRefs.current[section.type] = el; }}
                                className="scroll-mt-36"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-foreground">{config.title}</h2>
                                </div>

                                <div className="space-y-4 pl-2">
                                    {/* Primary Sources from metadata */}
                                    {(() => {
                                        const metadataSources = topic.metadata?.sources;
                                        const hasSources = metadataSources && Array.isArray(metadataSources) && metadataSources.length > 0;
                                        
                                        if (!hasSources) return null;
                                        
                                        return (
                                            <div className="space-y-3 mb-6">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Primary Sources</h4>
                                                {(metadataSources as string[]).map((sourceText: string, idx: number) => (
                                                    <div
                                                        key={`meta-${idx}`}
                                                        className="group flex items-start gap-3 pl-2"
                                                    >
                                                        <span className="text-muted-foreground text-sm font-mono opacity-50 mt-0.5">{idx + 1}.</span>
                                                        <div className="flex-1">
                                                            <span className="font-medium text-foreground leading-relaxed">
                                                                {linkifyTopicReferences(sourceText, allTopicsForLinking)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {/* Database Sources */}
                                    {sources.length > 0 && (
                                        <>
                                            {(() => {
                                                const metadataSources = topic.metadata?.sources;
                                                const hasSources = metadataSources && Array.isArray(metadataSources) && metadataSources.length > 0;
                                                return hasSources ? (
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">Additional References</h4>
                                                ) : null;
                                            })()}
                                            {sources.map((source, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group flex items-baseline gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg"
                                                    onClick={() => handleSourceClick(source)}
                                                >
                                                    <span className="text-muted-foreground text-sm font-mono opacity-50">{idx + 1}.</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-foreground">{source.title}</span>
                                                            {source.external_url && (
                                                                <a
                                                                    href={source.external_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                                                                    title="Read Source"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        {(source.author || source.publication_year) && (
                                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                                {source.author} {source.author && source.publication_year && '•'} {source.publication_year}
                                                            </p>
                                                        )}
                                                        {/* Display Source Relationships (Page/Verse) */}
                                                        {source.relationships && source.relationships.length > 0 && (
                                                            <div className="mt-1.5 flex flex-wrap gap-2">
                                                                {source.relationships.map((rel: any, rIdx: number) => (
                                                                    (rel.page_number || rel.verse_reference) && (
                                                                        <span key={rIdx} className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                                            {rel.page_number && <span className="mr-1">p. {rel.page_number}</span>}
                                                                            {rel.verse_reference && <span>{rel.verse_reference}</span>}
                                                                        </span>
                                                                    )
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Fallback for Citations if no primary sources */}
                                    {sources.length === 0 && citations.length > 0 && (
                                        <div className="pl-8 pt-2">
                                            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Related Citations</h4>
                                            <ul className="space-y-3">
                                                {citations.slice(0, 5).map((cit, idx) => (
                                                    <li key={`cit-${idx}`} className="text-sm text-foreground/80 leading-relaxed list-disc marker:text-muted-foreground">
                                                        <span className="font-medium text-foreground">{cit.document_title}:</span> <span className="italic">"{cit.text.slice(0, 100)}..."</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {(() => {
                                        const metadataSources = topic.metadata?.sources;
                                        const hasMetadataSources = metadataSources && Array.isArray(metadataSources) && metadataSources.length > 0;
                                        const hasNoSources = sources.length === 0 && citations.length === 0 && !hasMetadataSources;
                                        
                                        return hasNoSources ? (
                                            <div className="text-muted-foreground text-sm italic">
                                                No explicit sources listed for this entry.
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </section>
                        );
                    }

                    return (
                        <section
                            key={section.type}
                            ref={(el: HTMLDivElement | null) => { sectionRefs.current[section.type] = el; }}
                            id={`panel-${section.type}`}
                            role="tabpanel"
                            aria-labelledby={`tab-${section.type}`}
                            className={`scroll-mt-40 transition-all duration-500 ${focusMode && focusedSection !== section.type ? 'opacity-20 scale-95 blur-[1px]' : 'opacity-100 scale-100'} ${focusMode && focusedSection === section.type ? 'relative z-50' : ''}`}
                            onClick={handleContentClick}
                            onDoubleClick={() => toggleFocusMode(section.type)}
                            onKeyDown={handleContentKeyDown}
                        >
                            {/* Section Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
                            </div>
                            
                            {/* Section Content */}
                            <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 sm:p-8 transition-shadow ${focusMode && focusedSection === section.type ? 'shadow-2xl ring-2 ring-primary/20 bg-background' : ''}`}>
                               <ArticleSectionContent section={section} topic={topic} />
                            </div>
                        </section>
                    );
                })}

                {/* Smart Pathways & Constellation */}
            <div className="pt-8 border-t border-border space-y-8">
                {/* Visual Graph */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Concept Constellation
                        </h3>
                        <button
                            onClick={() => setIsDeepDiveOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-sm font-medium hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Deep Dive Mode
                        </button>
                    </div>
                    <div className="flex justify-center">
                        <ConstellationErrorBoundary>
                            <ConceptConstellation
                                centerConcept={graphData.centerConcept}
                                relatedConcepts={graphData.relatedConcepts}
                                onNodeClick={handleGraphClick}
                            />
                        </ConstellationErrorBoundary>
                    </div>
                </div>
            </div>
        </main>


            {/* Interactive Bottom Sheet */}
            <BottomSheet
                isOpen={!!sheetContent}
                onClose={() => setSheetContent(null)}
                title={sheetContent?.title}
            >
                {sheetContent?.content}
            </BottomSheet>

            {/* Focus Mode Overlay */}
            {focusMode && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-30 transition-opacity duration-500"
                    onClick={() => { setFocusMode(false); setFocusedSection(null); }}
                />
            )}

            {/* Deep Dive Mode */}
            <DeepDiveMode
                currentTopic={{ slug: topic.slug, canonical_title: topic.canonical_title }}
                relatedTopics={relatedTopics}
                isOpen={isDeepDiveOpen}
                onClose={() => setIsDeepDiveOpen(false)}
            />
        </div>
    );
}
