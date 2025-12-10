'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { ExploreCategories } from '@/components/explore/ExploreCategories';
import dynamic from 'next/dynamic';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
// Lazy load search component
const ContextualSearch = dynamic(() => import('@/components/features/search/ContextualSearch'), {
  loading: () => <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
});

// Lazy load content discovery
const ContentDiscovery = dynamic(() => import('@/components/features/home/ContentDiscovery').then(mod => ({ default: mod.ContentDiscovery })), {
  loading: () => <div className="animate-pulse h-32 bg-muted rounded-lg"></div>
});

export default function ExplorePage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-32 pt-8 px-5">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        { label: 'Explore', href: undefined }
                    ]}
                />
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                        <Compass className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Discover Chassidic concepts by category or see what's new
                    </p>
                </div>

                {/* Search */}
                <div className="flex justify-center">
                    <ContextualSearch
                        placeholder="Search topics, sources or authors..."
                        searchType="topics"
                    />
                </div>

                {/* Categories */}
                <section>
                    <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
                        Browse by Category
                    </h2>
                    <ExploreCategories />
                </section>

                {/* Featured & Recent */}
                <section>
                    <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
                        Featured & New
                    </h2>
                    <ContentDiscovery />
                </section>
            </div>
        </div>
    );
}
