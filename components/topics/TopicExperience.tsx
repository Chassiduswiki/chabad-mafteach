'use client';

import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect, useMemo, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    BookOpen,
    Lightbulb,
    User,
    Globe,
    Library,
    ChevronRight,
    ExternalLink,
    Sparkles,
    Share2,
    Bookmark,
    BarChart,
    ArrowUp,
    ArrowDown,
    RefreshCcw,
    GitBranch,
    Loader2,
    Edit3
} from 'lucide-react';
import { ImmersiveHero } from '@/components/topics/hero/ImmersiveHero';
import { TopicSkeleton } from '@/components/topics/loading/TopicSkeleton';
// Heavy components loaded dynamically to improve LCP
const ConceptConstellation = dynamic(() => import('@/components/topics/visualization/ConceptConstellation').then(mod => mod.ConceptConstellation), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-muted rounded-xl" />
});

const DeepDiveMode = dynamic(() => import('@/components/topics/DeepDiveMode').then(mod => mod.DeepDiveMode), {
    ssr: false
});

const ForceGraph = dynamic(() => import('@/components/graph/ForceGraph').then(mod => mod.ForceGraph), {
    ssr: false
});

const ConstellationErrorBoundary = dynamic(() => import('@/components/topics/visualization/ConstellationErrorBoundary').then(mod => mod.ConstellationErrorBoundary), {
    ssr: false
});

const SourceViewerModal = dynamic(() => import('@/components/topics/SourceViewerModal').then(mod => mod.SourceViewerModal), {
    ssr: false
});

const FocusModeTutorial = dynamic(() => import('@/components/topics/FocusModeTutorial').then(mod => mod.FocusModeTutorial), {
    ssr: false
});

import { ScrollProgressIndicator } from '@/components/topics/ScrollProgressIndicator';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Topic, Source, Citation, TopicRelationship } from '@/lib/types';
import { parseGlossaryContent } from '@/lib/content/glossary-parser';
import { computeSmartVisibility } from '@/lib/utils/smart-visibility';
import GlossaryGrid from '@/components/topics/smart-content/GlossaryGrid';
// FocusModeTutorial and SourceViewerModal moved to dynamic imports
import { ArticleSectionContent } from '@/components/topics/ArticleSectionContent';
import { AnnotationHighlight } from '@/components/topics/annotations/AnnotationHighlight';
import { SerendipityCard } from '@/components/features/SerendipityCard';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TopicAnnotations } from '@/components/annotations/TopicAnnotations';
import { MobileFeedbackButton } from '@/components/feedback/MobileFeedbackButton';
import { TranslationFeedback } from '@/components/feedback/TranslationFeedback';
import { TranslationSurvey } from '@/components/feedback/TranslationSurvey';

// Types
type SectionType = 'definition' | 'overview' | 'article' | 'mashal' | 'personal_nimshal' | 'global_nimshal' | 'historical_context' | 'charts' | 'confusions' | 'sources';

interface ArticleSection {
    type: SectionType;
    content: string;
    order: number;
}

interface RelatedTopic extends Topic {
    relationship: {
        type?: string;
        strength?: number;
        description?: string;
        direction: 'child' | 'parent';
    };
}

interface TopicExperienceProps {
    topic: Topic;
    relatedTopics: RelatedTopic[];
    sources: Source[];
    citations: Citation[];
    inlineCitations: Source[];
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
        if (t.name_hebrew) {
            topicMap.set(t.name_hebrew, t.slug); // Hebrew is case-sensitive
        }
        // Add alternate names
        if (t.alternate_names && Array.isArray(t.alternate_names)) {
            t.alternate_names.forEach((altName: string) => {
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

// Language Selector Wrapper Component
function LanguageSelectorWrapper({ topicSlug }: { topicSlug: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentLang = searchParams.get('lang') || 'en';

    const handleLanguageChange = (newLang: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('lang', newLang);
        router.push(`/topics/${topicSlug}?${params.toString()}`);
    };

    return (
        <LanguageSelector
            value={currentLang}
            onChange={handleLanguageChange}
        />
    );
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
    overview: {
        title: 'Overview',
        shortTitle: 'Overview',
        icon: BookOpen,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/20'
    },
    article: {
        title: 'In-Depth Article',
        shortTitle: 'Article',
        icon: BookOpen,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-500/5',
        borderColor: 'border-indigo-500/20'
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
    historical_context: {
        title: 'Historical Context',
        shortTitle: 'History',
        icon: BookOpen,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/20'
    },
    charts: {
        title: 'Charts & Tables',
        shortTitle: 'Charts',
        icon: BarChart,
        color: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-500/5',
        borderColor: 'border-sky-500/20'
    },
    confusions: {
        title: 'Common Confusions',
        shortTitle: 'FAQs',
        icon: Lightbulb,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-500/5',
        borderColor: 'border-rose-500/20'
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

interface GraphNode {
    id: string;
    label: string;
    slug: string;
    category?: string;
    size?: number;
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
    strength: number;
}

export function TopicExperience({ topic, relatedTopics, sources, citations, inlineCitations }: TopicExperienceProps) {
    const [activeSection, setActiveSection] = useState<SectionType>('definition');
    const [isLoading, setIsLoading] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [allTopicsForLinking, setAllTopicsForLinking] = useState<Array<{ name?: string; canonical_title: string; slug: string }>>([]);
    const [hasTranslations, setHasTranslations] = useState(false);
    const [showStickyTitle, setShowStickyTitle] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
    const [isTranslationFeedbackOpen, setIsTranslationFeedbackOpen] = useState(false);
    const [isTranslationSurveyOpen, setIsTranslationSurveyOpen] = useState(false);
    const [focusedSection, setFocusedSection] = useState<SectionType | null>(null);
    const [sheetContent, setSheetContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Source | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.role !== userRole) {
                        setUserRole(payload.role);
                    }
                    if (payload.userId !== currentUserId) {
                        setCurrentUserId(payload.userId);
                    }
                } catch (e) {
                    console.error('Failed to parse token in TopicExperience');
                }
            } else {
                // Check legacy keys just in case
                const legacyRole = localStorage.getItem('chabad-mafteach:user-role');
                const legacyUserId = localStorage.getItem('chabad-mafteach:user-id');
                if (legacyRole && legacyRole !== userRole) setUserRole(legacyRole);
                if (legacyUserId && legacyUserId !== currentUserId) setCurrentUserId(legacyUserId);
            }
        }
    }, [currentUserId, userRole]);

    const isAuthorized = useMemo(() => {
        return userRole === 'admin' || userRole === 'editor';
    }, [userRole]);

    // Show sticky title when scrolled past hero
    const heroRef = useRef<HTMLDivElement>(null);

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

    // Check if topic has translations
    useEffect(() => {
        async function checkTranslations() {
            try {
                const res = await fetch(`/api/topics/translations?topic_id=${topic.id}`);
                if (res.ok) {
                    const translations = await res.json();
                    setHasTranslations(Array.isArray(translations) && translations.length > 0);
                }
            } catch (e) {
                console.error('Failed to check translations:', e);
                setHasTranslations(false);
            }
        }
        if (topic.id) {
            checkTranslations();
        }
    }, [topic.id]);

    const sectionRefs = useRef<Record<SectionType, HTMLElement | null>>({
        definition: null,
        overview: null,
        article: null,
        mashal: null,
        personal_nimshal: null,
        global_nimshal: null,
        historical_context: null,
        charts: null,
        confusions: null,
        sources: null
    });
    const tabsRef = useRef<HTMLDivElement>(null);

    // Simulate loading for smooth transition
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);

        if (typeof window !== 'undefined') {
            const hasSeenTutorial = localStorage.getItem('hasSeenFocusModeTutorial');
            if (!hasSeenTutorial && !isTutorialOpen) {
                // Use a microtask to avoid synchronous setState warning
                Promise.resolve().then(() => setIsTutorialOpen(true));
            }
        }

        return () => clearTimeout(timer);
    }, [isTutorialOpen]);

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

    // Get display config from topic (if stored in database)
    const displayConfig = topic.display_config as Record<string, { visible?: boolean; format?: string }> | undefined;

    // Helper to check if a section should be visible using smart visibility
    const isSectionVisible = (sectionId: string, fieldValue: string | null | undefined | unknown): boolean => {
        const manualVisibility = displayConfig?.[sectionId]?.visible;
        const result = computeSmartVisibility(fieldValue, manualVisibility);
        return result.isVisible;
    };

    // Construct Sections from Topic Data with smart visibility
    const sections: ArticleSection[] = [
        // Definition is always shown if it has content
        ...((topic.definition_positive || topic.description) && isSectionVisible('description', topic.definition_positive || topic.description) ? [{
            type: 'definition' as SectionType,
            order: 1,
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
        }] : []),
        // Overview section
        ...(topic.overview && isSectionVisible('overview', topic.overview) ? [{
            type: 'overview' as SectionType,
            order: 2,
            content: highlightTerms(topic.overview)
        }] : []),
        // Article section  
        ...(topic.article && isSectionVisible('article', topic.article) ? [{
            type: 'article' as SectionType,
            order: 3,
            content: highlightTerms(topic.article)
        }] : []),
        // Optional sections: check both content existence AND smart visibility
        ...(topic.mashal && isSectionVisible('mashal', topic.mashal) ? [{
            type: 'mashal' as SectionType,
            order: 4,
            content: highlightTerms(topic.mashal)
        }] : []),
        ...(topic.practical_takeaways && isSectionVisible('practical_takeaways', topic.practical_takeaways) ? [{
            type: 'personal_nimshal' as SectionType,
            order: 5,
            content: highlightTerms(topic.practical_takeaways)
        }] : []),
        ...(topic.global_nimshal && isSectionVisible('global_nimshal', topic.global_nimshal) ? [{
            type: 'global_nimshal' as SectionType,
            order: 6,
            content: highlightTerms(topic.global_nimshal)
        }] : []),
        // Historical context section
        ...(topic.historical_context && isSectionVisible('historical_context', topic.historical_context) ? [{
            type: 'historical_context' as SectionType,
            order: 7,
            content: highlightTerms(topic.historical_context)
        }] : []),
        ...(topic.charts && isSectionVisible('charts', topic.charts) ? [{
            type: 'charts' as SectionType,
            order: 8,
            content: highlightTerms(topic.charts)
        }] : []),
        ...(topic.common_confusions && topic.common_confusions.length > 0 && isSectionVisible('common_confusions', topic.common_confusions) ? [{
            type: 'confusions' as SectionType,
            order: 9,
            content: (
                <div className="space-y-6">
                    {topic.common_confusions.map((item, idx) => (
                        <div key={idx} className="space-y-2 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                            <h4 className="font-bold text-foreground flex items-start gap-3">
                                <span className="text-primary opacity-50 font-mono">Q.</span>
                                <span>{item.question}</span>
                            </h4>
                            <div className="pl-7 text-muted-foreground flex items-start gap-3">
                                <span className="text-emerald-500 opacity-50 font-mono shrink-0">A.</span>
                                <div className="prose-content">{item.answer}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) as unknown as string
        }] : [])
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

    // Toggle scroll-to-top visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 500) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    // Transform related topics for ForceGraph
    const forceGraphData = useMemo(() => {
        const nodes: GraphNode[] = [
            {
                id: topic.slug,
                label: topic.canonical_title,
                slug: topic.slug,
                category: topic.topic_type || 'concept',
                size: 3
            }
        ];

        const edges: GraphEdge[] = [];

        // Add all related topics to the graph
        relatedTopics.forEach(related => {
            if (!related.slug) return;

            // Check if node already exists to avoid duplicates
            if (!nodes.find(n => n.id === related.slug)) {
                nodes.push({
                    id: related.slug,
                    label: related.canonical_title || related.name || 'Untitled',
                    slug: related.slug,
                    category: related.topic_type || 'concept',
                    size: related.relationship?.direction === 'parent' ? 1 : 2
                });
            }

            // Add edge
            edges.push({
                source: topic.slug,
                target: related.slug,
                type: related.relationship?.type || 'related_to',
                strength: related.relationship?.strength || 0.5
            });
        });

        return { nodes, edges };
    }, [topic, relatedTopics]);

    // Extract connected topics for graph (kept for reference)
    // const graphData = {
    //     centerConcept: topic.canonical_title,
    //     relatedConcepts: {
    //         parent: relatedTopics.find(t => t.relationship.direction === 'child')?.canonical_title,
    //         opposite: relatedTopics.find(t => t.relationship.type === 'opposite' || t.relationship.description?.includes('contrast'))?.canonical_title,
    //         components: relatedTopics.filter(t => t.relationship.direction === 'parent').map(t => t.canonical_title).slice(0, 3)
    //     }
    // };

    if (isLoading) {
        return <TopicSkeleton />;
    }

    return (
        <ErrorBoundary componentName="TopicExperience">
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
                        titleTransliteration={topic.canonical_title_transliteration}
                        category={topic.topic_type || 'Concept'}
                        definitionShort={topic.description ? topic.description.split('</p>')[0].replace(/^\s*<strong>\d+\.\s*/, '').replace(/^\s*\d+\.\s*/, '') + '</p>' : ''}
                        topicSlug={topic.slug}
                        isAuthorized={isAuthorized}
                    />
                </div>

                {/* Sticky Title + Tab Navigation Container */}
                <div className="sticky top-[56px] z-40 bg-background border-b border-border shadow-sm">
                    {/* Topic Title - shows when scrolled past hero */}
                    <div className={`overflow-hidden transition-all duration-300 ${showStickyTitle ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {topic.topic_type || 'Concept'}
                                </span>
                                <h2 className="font-semibold text-foreground truncate">{topic.canonical_title}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {isAuthorized && (
                                    <Link
                                        href={`/editor/topics/${topic.slug}`}
                                        className="p-1.5 rounded-lg hover:bg-primary/5 text-primary transition-colors flex items-center gap-1.5"
                                        title="Edit Topic"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Edit</span>
                                    </Link>
                                )}
                                <LanguageSelectorWrapper topicSlug={topic.slug} />
                            </div>
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
                            {sections.map((section) => {
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

                                    <div className="space-y-6 pl-2">
                                        {/* 📚 General Bibliography - Topic-level sources */}
                                        {sources.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General Bibliography</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3 pl-6">Books that discuss this topic</p>
                                                {sources.map((source, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="group flex items-baseline gap-3 cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg border border-transparent hover:border-blue-500/20 transition-all"
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
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {/* Show junction metadata: chapter, page, verse, notes */}
                                                            {(source.section_reference || source.page_number || source.verse_reference || source.notes) && (
                                                                <div className="mt-1.5 flex flex-wrap gap-2">
                                                                    {source.section_reference && (
                                                                        <span className="inline-flex items-center text-xs text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                                            {source.section_reference}
                                                                        </span>
                                                                    )}
                                                                    {source.page_number && (
                                                                        <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                                            p. {source.page_number}
                                                                        </span>
                                                                    )}
                                                                    {source.verse_reference && (
                                                                        <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                                            {source.verse_reference}
                                                                        </span>
                                                                    )}
                                                                    {source.notes && !source.notes.includes('Primary') && (
                                                                        <span className="inline-flex items-center text-xs text-muted-foreground italic">
                                                                            {source.notes}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 📖 Inline Citations - Statement-level citations */}
                                        {inlineCitations.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inline Citations</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3 pl-6">Specific quotes from article statements</p>
                                                {inlineCitations.map((citation, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="group flex items-baseline gap-3 cursor-pointer hover:bg-amber-500/5 p-2 rounded-lg border border-transparent hover:border-amber-500/20 transition-all"
                                                        onClick={() => handleSourceClick(citation)}
                                                    >
                                                        <span className="text-muted-foreground text-sm font-mono opacity-50">{idx + 1}.</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-foreground">{citation.title}</span>
                                                                {citation.external_url && (
                                                                    <a
                                                                        href={citation.external_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                                                                        title="Read Source"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {/* Show citation details */}
                                                            <div className="mt-1.5 flex flex-wrap gap-2">
                                                                {citation.section_reference && (
                                                                    <span className="inline-flex items-center text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                                        {citation.section_reference}
                                                                    </span>
                                                                )}
                                                                {citation.page_number && (
                                                                    <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                                        p. {citation.page_number}
                                                                    </span>
                                                                )}
                                                                {citation.verse_reference && (
                                                                    <span className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                                                        {citation.verse_reference}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Empty state */}
                                        {sources.length === 0 && inlineCitations.length === 0 && (
                                            <div className="text-muted-foreground text-sm italic">
                                                No sources or citations listed for this entry.
                                            </div>
                                        )}
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
                                    <ArticleSectionContent section={section} topic={topic} citationMap={topic.citationMap} />
                                </div>
                            </section>
                        );
                    })}

                    {/* Concept Constellation - Visual Discovery at Bottom */}
                    {relatedTopics.length > 0 && (
                        <div className="pt-12 mt-12 border-t border-border/50">
                            <div className="text-center mb-8">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Interactive Map
                                </span>
                                <h2 className="text-3xl font-serif italic text-foreground">How This Concept Connects</h2>
                                <p className="text-muted-foreground mt-2 max-w-lg mx-auto font-light">Explore the intricate web of relationships between {topic.canonical_title} and other Chassidic ideas.</p>
                            </div>
                            <ConstellationErrorBoundary>
                                {forceGraphData.nodes.length > 1 ? (
                                    <ForceGraph
                                        nodes={forceGraphData.nodes}
                                        edges={forceGraphData.edges}
                                        width={800}
                                        height={400}
                                        interactive={true}
                                    />
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center bg-muted/10 rounded-[2rem] border border-dashed border-border/40 p-8 transition-all hover:bg-muted/20">
                                        <GitBranch className="h-10 w-10 text-muted-foreground/20 mb-4" />
                                        <p className="text-sm text-muted-foreground text-center max-w-[320px] font-light leading-relaxed">
                                            {isAuthorized
                                                ? "This concept hasn't been connected to others yet. Use the relationship tool in the admin panel to map its place in the system."
                                                : "We are currently mapping the relationships for this concept. Explore other topics to see the connected web of Chassidus."}
                                        </p>
                                    </div>
                                )}
                            </ConstellationErrorBoundary>

                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setIsDeepDiveOpen(true)}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Enter Deep Dive Mode
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Community Annotations Section - Restricted to Admin/Editor */}
                    {isAuthorized && (
                        <div className="pt-12 mt-12 border-t border-border/50">
                            <TopicAnnotations
                                topicId={topic.id.toString()}
                                currentUserId={currentUserId || undefined}
                                className="max-w-4xl mx-auto"
                            />
                        </div>
                    )}

                    {/* Feedback & Contribution - Restricted to Admin/Editor */}
                    {isAuthorized && (
                        <MobileFeedbackButton
                            topicId={topic.id.toString()}
                            topicTitle={topic.canonical_title}
                        />
                    )}
                </main>

                {/* Modals & Overlays - Restricted to Admin/Editor */}
                {isAuthorized && (
                    <>
                        <TranslationFeedback
                            isOpen={isTranslationFeedbackOpen}
                            onClose={() => setIsTranslationFeedbackOpen(false)}
                            contentType="topic"
                            contentId={topic.id.toString()}
                            contentName={topic.canonical_title}
                        />

                        <TranslationSurvey
                            isOpen={isTranslationSurveyOpen}
                            onClose={() => setIsTranslationSurveyOpen(false)}
                        />
                    </>
                )}

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

                <DeepDiveMode
                    currentTopic={{ slug: topic.slug, canonical_title: topic.canonical_title }}
                    relatedTopics={relatedTopics}
                    isOpen={isDeepDiveOpen}
                    onClose={() => setIsDeepDiveOpen(false)}
                />
            </div>
        </ErrorBoundary>
    );
}
