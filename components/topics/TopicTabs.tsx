"use client";

import { useState } from 'react';
import ArticleTab from "./ArticleTab";
import BoundariesTab from "./BoundariesTab";
import SourcesTab from "./SourcesTab";
import RelatedTab from "./RelatedTab";
import { Topic } from "@/lib/types";
import { FileText, Target, BookOpen, Sparkles } from 'lucide-react';

type TabType = 'overview' | 'boundaries' | 'sources' | 'related';

interface TopicTabsProps {
    topic: Topic;
    relatedTopics?: any[];
}

const tabs: { id: TabType; label: string; icon: React.ComponentType<any>; description: string; comingSoon?: boolean }[] = [
    { id: 'overview', label: 'Article', icon: FileText, description: 'Full document content and paragraphs' },
    { id: 'boundaries', label: 'Boundaries', icon: Target, description: 'What it is and what it\'s not', comingSoon: true },
    { id: 'sources', label: 'Seforim', icon: BookOpen, description: 'References and citations', comingSoon: true },
    { id: 'related', label: 'Related', icon: Sparkles, description: 'Connected concepts', comingSoon: true },
];

export default function TopicTabs({ topic, relatedTopics }: TopicTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Check which tabs have content
    const hasBoundaries = topic.definition_positive || topic.definition_negative;
    const hasSources = false; // TODO: Implement when topic_citations table exists
    const hasRelated = relatedTopics && relatedTopics.length > 0;

    const renderTabContent = () => {
        // Check if current tab is coming soon AND has no content
        const currentTabData = tabs.find(tab => tab.id === activeTab);
        const hasContent = activeTab === 'overview' ||
            (activeTab === 'boundaries' && hasBoundaries) ||
            (activeTab === 'sources' && hasSources) ||
            (activeTab === 'related' && hasRelated);
        const isComingSoon = currentTabData?.comingSoon && !hasContent;

        if (isComingSoon) {
            const Icon = currentTabData!.icon;
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <Icon className="mx-auto h-16 w-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium mb-2">{currentTabData!.label} Coming Soon</h3>
                    <p className="text-sm max-w-md mx-auto">
                        {currentTabData!.description} will be available once this topic's content is fully developed.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'overview':
                return <ArticleTab topic={topic} />;
            case 'boundaries':
                return hasBoundaries ? (
                    <BoundariesTab topic={topic} />
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Target className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">Boundaries Coming Soon</h3>
                        <p className="text-sm max-w-md mx-auto">
                            Detailed boundaries and definitions will be available once this topic's content is fully developed.
                        </p>
                    </div>
                );
            case 'sources':
                return hasSources ? (
                    <SourcesTab sources={[]} />
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">Seforim Coming Soon</h3>
                        <p className="text-sm max-w-md mx-auto">
                            Seforim citations and references will be available once the citation system is fully implemented.
                        </p>
                    </div>
                );
            case 'related':
                return hasRelated ? (
                    <RelatedTab topic={topic} relatedTopics={relatedTopics} />
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="mx-auto h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">Related Topics Coming Soon</h3>
                        <p className="text-sm max-w-md mx-auto">
                            Related concepts and connections will be available once topic relationships are established.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                <div className="flex space-x-8 overflow-x-auto whitespace-nowrap scrollbar-hide lg:overflow-visible">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const hasContent = tab.id === 'overview' ||
                            (tab.id === 'boundaries' && hasBoundaries) ||
                            (tab.id === 'sources' && hasSources) ||
                            (tab.id === 'related' && hasRelated);
                        const isComingSoon = tab.comingSoon && !hasContent; // Only show as coming soon if no content

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                disabled={isComingSoon}
                                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-primary text-primary'
                                        : isComingSoon
                                        ? 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isComingSoon ? 'opacity-50' : ''}`} />
                                <span className={`font-medium ${isComingSoon ? 'opacity-50' : ''}`}>{tab.label}</span>
                                {isComingSoon && (
                                    <span className="text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">
                                        Soon
                                    </span>
                                )}
                                {!hasContent && !isComingSoon && (
                                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                        Empty
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {renderTabContent()}
            </div>
        </div>
    );
}
