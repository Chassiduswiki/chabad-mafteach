"use client";

import { useState } from 'react';
import OverviewTab from "./OverviewTab";
import BoundariesTab from "./BoundariesTab";
import SourcesTab from "./SourcesTab";
import RelatedTab from "./RelatedTab";
import { Topic } from "@/lib/types";
import { FileText, Target, BookOpen, Sparkles } from 'lucide-react';

type TabType = 'overview' | 'boundaries' | 'sources' | 'related';

interface TopicTabsProps {
    topic: Topic;
}

const tabs: { id: TabType; label: string; icon: React.ComponentType<any>; description: string }[] = [
    { id: 'overview', label: 'Overview', icon: FileText, description: 'Definition and detailed explanation' },
    { id: 'boundaries', label: 'Boundaries', icon: Target, description: 'What it is and what it\'s not' },
    { id: 'sources', label: 'Sources', icon: BookOpen, description: 'References and citations' },
    { id: 'related', label: 'Related', icon: Sparkles, description: 'Connected concepts' },
];

export default function TopicTabs({ topic }: TopicTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Check which tabs have content
    const hasBoundaries = topic.definition_positive || topic.definition_negative;
    const hasSources = false; // TODO: Implement when topic_citations table exists
    const hasRelated = topic.topic_type; // At least show category-based related topics

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab topic={topic} />;
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
                        <h3 className="text-lg font-medium mb-2">Sources Coming Soon</h3>
                        <p className="text-sm max-w-md mx-auto">
                            Source citations and references will be available once the citation system is fully implemented.
                        </p>
                    </div>
                );
            case 'related':
                return hasRelated ? (
                    <RelatedTab topic={topic} />
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
            <div className="border-b border-border">
                <div className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const hasContent = tab.id === 'overview' ||
                            (tab.id === 'boundaries' && hasBoundaries) ||
                            (tab.id === 'sources' && hasSources) ||
                            (tab.id === 'related' && hasRelated);

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="font-medium">{tab.label}</span>
                                {!hasContent && (
                                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                        Soon
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
