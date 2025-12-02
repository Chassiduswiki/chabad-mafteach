'use client';

import { useState, useEffect } from 'react';
import { Topic } from '@/lib/directus';
import OverviewTab from './OverviewTab';
import BoundariesTab from './BoundariesTab';
import SourcesTab from './SourcesTab';
import RelatedTab from './RelatedTab';
import SourceCard from './SourceCard';

interface TopicTabsProps {
    topic: Topic;
}

interface TopicSource {
    id: number;
    excerpt: string;
    relevance: string;
    notes: string | null;
    location: {
        id: number;
        display_name: string;
        page?: string;
        section?: string;
        sefer: {
            id: number;
            title: string;
            author?: string;
            category?: string;
        };
    };
}

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sources', label: 'Sources' },
    { id: 'boundaries', label: 'Boundaries' },
    { id: 'related', label: 'Related' }
] as const;

type TabId = typeof tabs[number]['id'];

export default function TopicTabs({ topic }: TopicTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [sources, setSources] = useState<TopicSource[]>([]);
    const [sourcesLoading, setSourcesLoading] = useState(false);

    // Fetch sources when Sources tab is clicked
    useEffect(() => {
        if (activeTab === 'sources' && sources.length === 0) {
            setSourcesLoading(true);
            fetch(`/api/topics/${topic.slug}/sources`)
                .then(res => res.json())
                .then(data => {
                    setSources(data.sources || []);
                    setSourcesLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch sources:', err);
                    setSourcesLoading(false);
                });
        }
    }, [activeTab, topic.slug, sources.length]);

    return (
        <div>
            {/* Tab Navigation */}
            <div className="mb-8 border-b">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs" role="tablist">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`${tab.id}-panel`}
                            className={`
                                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
                <div
                    id="overview-panel"
                    role="tabpanel"
                    aria-labelledby="overview-tab"
                    hidden={activeTab !== 'overview'}
                >
                    {activeTab === 'overview' && <OverviewTab topic={topic} />}
                </div>

                <div
                    id="sources-panel"
                    role="tabpanel"
                    aria-labelledby="sources-tab"
                    hidden={activeTab !== 'sources'}
                >
                    {activeTab === 'sources' && (
                        sourcesLoading ? (
                            <div className="rounded-2xl border bg-card p-12 text-center">
                                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <p className="text-muted-foreground">Loading sources...</p>
                            </div>
                        ) : sources.length > 0 ? (
                            <div className="space-y-6">
                                {/* Group by sefer */}
                                {(() => {
                                    const grouped = sources.reduce((acc, citation: any) => {
                                        const sefer = citation.location?.sefer;
                                        const seferTitle = sefer?.title || 'Unknown Sefer';
                                        if (!acc[seferTitle]) acc[seferTitle] = [];
                                        acc[seferTitle].push(citation);
                                        return acc;
                                    }, {} as Record<string, any[]>);

                                    return Object.entries(grouped).map(([seferTitle, citations]) => (
                                        <div key={seferTitle}>
                                            <h3 className="mb-4 text-xl font-semibold">{seferTitle}</h3>
                                            <div className="space-y-4">
                                                {citations.map((citation: any) => (
                                                    <SourceCard key={citation.id} citation={citation} />
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="rounded-2xl border bg-card p-12 text-center">
                                <p className="text-muted-foreground">No sources available yet for this topic.</p>
                            </div>
                        )
                    )}
                </div>

                <div
                    id="boundaries-panel"
                    role="tabpanel"
                    aria-labelledby="boundaries-tab"
                    hidden={activeTab !== 'boundaries'}
                >
                    {activeTab === 'boundaries' && <BoundariesTab topic={topic} />}
                </div>

                <div
                    id="related-panel"
                    role="tabpanel"
                    aria-labelledby="related-tab"
                    hidden={activeTab !== 'related'}
                >
                    {activeTab === 'related' && <RelatedTab topic={topic} />}
                </div>
            </div>
        </div>
    );
}
