'use client';

import { useState } from 'react';
import { BookOpen, Layers, GitGraph, Brain, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
    id: string;
    label: string;
    icon: React.ElementType;
    count?: number;
}

interface TopicTabsProps {
    citationsCount: number;
    overviewContent: React.ReactNode;
    articleContent: React.ReactNode;
    sourcesContent: React.ReactNode;
    boundariesContent: React.ReactNode;
    relatedContent: React.ReactNode;
}

export function TopicTabs({
    citationsCount,
    overviewContent,
    articleContent,
    sourcesContent,
    boundariesContent,
    relatedContent
}: TopicTabsProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs: Tab[] = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'article', label: 'Article', icon: FileText },
        { id: 'sources', label: 'Sources', icon: Layers, count: citationsCount },
        { id: 'boundaries', label: 'Boundaries', icon: GitGraph },
        { id: 'related', label: 'Related', icon: Brain },
    ];

    return (
        <div>
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                                    }
                                `}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && overviewContent}
                        {activeTab === 'article' && articleContent}
                        {activeTab === 'sources' && sourcesContent}
                        {activeTab === 'boundaries' && boundariesContent}
                        {activeTab === 'related' && relatedContent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
