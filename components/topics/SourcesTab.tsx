'use client';

import { useState } from 'react';
import { TopicCitation, Location, Sefer } from '@/lib/directus';
import SourceCard from './SourceCard';
import { Filter, SlidersHorizontal } from 'lucide-react';

interface SourcesTabProps {
    sources: (TopicCitation & {
        source_id: Location & {
            sefer: Sefer;
        };
    })[];
}

export default function SourcesTab({ sources }: SourcesTabProps) {
    const [filterType, setFilterType] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Get unique categories from seforim
    const categories = Array.from(new Set(sources.map(s => s.source_id.sefer.category).filter(Boolean)));

    // Filter sources
    const filteredSources = sources.filter(source => {
        const typeMatch = filterType === 'all' || source.citation_role === filterType;
        const categoryMatch = filterCategory === 'all' || source.source_id.sefer.category === filterCategory;
        return typeMatch && categoryMatch;
    });

    // Group by sefer
    const groupedSources = filteredSources.reduce((acc, source) => {
        const seferTitle = source.source_id.sefer.title;
        if (!acc[seferTitle]) {
            acc[seferTitle] = [];
        }
        acc[seferTitle].push(source);
        return acc;
    }, {} as Record<string, typeof filteredSources>);

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                {/* Citation Type Filter */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">All Types</option>
                    <option value="definition">Definition</option>
                    <option value="boundary">Boundary</option>
                    <option value="explanation">Explanation</option>
                    <option value="commentary">Commentary</option>
                </select>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="capitalize">
                                {cat}
                            </option>
                        ))}
                    </select>
                )}

                {/* Results count */}
                <span className="ml-auto text-sm text-muted-foreground">
                    {filteredSources.length} {filteredSources.length === 1 ? 'source' : 'sources'}
                </span>
            </div>

            {/* Sources List - Grouped by Sefer */}
            {Object.keys(groupedSources).length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(groupedSources).map(([seferTitle, seferSources]) => (
                        <div key={seferTitle}>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                {seferTitle}
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({seferSources.length})
                                </span>
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {seferSources.map((source) => (
                                    <SourceCard key={source.id} citation={source} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center">
                    <Filter className="mx-auto h-16 w-16 text-muted-foreground/20" />
                    <p className="mt-4 text-muted-foreground">No sources found matching your filters.</p>
                </div>
            )}
        </div>
    );
}
