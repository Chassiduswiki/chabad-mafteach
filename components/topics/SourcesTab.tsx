'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopicCitation, Location, Sefer } from '@/lib/directus';
import SourceCard from './SourceCard';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

interface SourcesTabProps {
    sources: (TopicCitation & {
        source_id: Location & {
            sefer: Sefer;
        };
    })[];
}

export default function SourcesTab({ sources }: SourcesTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize filters from URL params
    const [filterRole, setFilterRole] = useState<string>(searchParams.get('role') || 'all');
    const [filterCategory, setFilterCategory] = useState<string>(searchParams.get('category') || 'all');
    const [filterImportance, setFilterImportance] = useState<string>(searchParams.get('importance') || 'all');
    const [filterSefer, setFilterSefer] = useState<string>(searchParams.get('sefer') || 'all');

    // Get unique values for filters
    const categories = Array.from(new Set(sources.map(s => s.source_id.sefer.category).filter(Boolean)));
    const seforim = Array.from(new Set(sources.map(s => s.source_id.sefer.title))).sort();
    const roles = Array.from(new Set(sources.map(s => s.citation_role).filter(Boolean)));
    const importanceLevels = Array.from(new Set(sources.map(s => s.importance).filter(Boolean)));

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (filterRole !== 'all') params.set('role', filterRole);
        if (filterCategory !== 'all') params.set('category', filterCategory);
        if (filterImportance !== 'all') params.set('importance', filterImportance);
        if (filterSefer !== 'all') params.set('sefer', filterSefer);

        const query = params.toString();
        router.replace(`?${query}`, { scroll: false });
    }, [filterRole, filterCategory, filterImportance, filterSefer, router]);

    // Filter sources
    const filteredSources = sources.filter(source => {
        const roleMatch = filterRole === 'all' || source.citation_role === filterRole;
        const categoryMatch = filterCategory === 'all' || source.source_id.sefer.category === filterCategory;
        const importanceMatch = filterImportance === 'all' || source.importance === filterImportance;
        const seferMatch = filterSefer === 'all' || source.source_id.sefer.title === filterSefer;
        return roleMatch && categoryMatch && importanceMatch && seferMatch;
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

    const clearFilters = () => {
        setFilterRole('all');
        setFilterCategory('all');
        setFilterImportance('all');
        setFilterSefer('all');
    };

    const hasActiveFilters = filterRole !== 'all' || filterCategory !== 'all' || filterImportance !== 'all' || filterSefer !== 'all';

    return (
        <div className="space-y-6">
            {/* Filter Panel */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Filters</span>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3 w-3" />
                            Clear all
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Citation Role Filter */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Citation Role
                        </label>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Roles ({sources.length})</option>
                            {roles.map(role => {
                                const count = sources.filter(s => s.citation_role === role).length;
                                return (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Importance Filter */}
                    {importanceLevels.length > 0 && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Importance
                            </label>
                            <select
                                value={filterImportance}
                                onChange={(e) => setFilterImportance(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Levels ({sources.length})</option>
                                {importanceLevels.map(importance => {
                                    const count = sources.filter(s => s.importance === importance).length;
                                    return (
                                        <option key={importance} value={importance}>
                                            {importance.charAt(0).toUpperCase() + importance.slice(1)} ({count})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {/* Sefer Filter */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Sefer
                        </label>
                        <select
                            value={filterSefer}
                            onChange={(e) => setFilterSefer(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Seforim ({sources.length})</option>
                            {seforim.map(sefer => {
                                const count = sources.filter(s => s.source_id.sefer.title === sefer).length;
                                return (
                                    <option key={sefer} value={sefer}>
                                        {sefer} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Category Filter */}
                    {categories.length > 0 && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                Category
                            </label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Categories ({sources.length})</option>
                                {categories.map(cat => {
                                    const count = sources.filter(s => s.source_id.sefer.category === cat).length;
                                    return (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{filteredSources.length}</span> of {sources.length} {filteredSources.length === 1 ? 'source' : 'sources'}
                    </span>
                </div>
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
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
