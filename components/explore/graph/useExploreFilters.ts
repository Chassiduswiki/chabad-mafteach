'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    ExploreFilters,
    TopicType,
    RelationshipType,
    LayoutMode,
    DEFAULT_FILTERS,
    GraphData,
    TopicSummary,
} from './types';

interface UseExploreFiltersOptions {
    syncToUrl?: boolean;
}

interface UseExploreFiltersReturn {
    filters: ExploreFilters;
    setFilters: React.Dispatch<React.SetStateAction<ExploreFilters>>;

    // Convenience setters
    toggleTopicType: (type: TopicType) => void;
    toggleRelationshipType: (type: RelationshipType) => void;
    setLayout: (layout: LayoutMode) => void;
    setSearchQuery: (query: string) => void;
    centerOnTopic: (slug: string | null) => void;
    setDepth: (depth: number) => void;
    resetFilters: () => void;

    // Computed
    hasActiveFilters: boolean;
    filterQueryString: string;
}

/**
 * Hook for managing explore graph filter state
 * Optionally syncs to URL for shareable views
 */
export function useExploreFilters(options: UseExploreFiltersOptions = {}): UseExploreFiltersReturn {
    const { syncToUrl = true } = options;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize from URL or defaults
    const [filters, setFilters] = useState<ExploreFilters>(() => {
        if (!syncToUrl) return DEFAULT_FILTERS;

        const types = searchParams.get('types');
        const relationships = searchParams.get('relationships');
        const layout = searchParams.get('layout');
        const search = searchParams.get('q');
        const center = searchParams.get('center');
        const depth = searchParams.get('depth');

        return {
            topicTypes: types
                ? types.split(',').filter(t => t) as TopicType[]
                : DEFAULT_FILTERS.topicTypes,
            relationshipTypes: relationships
                ? relationships.split(',').filter(r => r) as RelationshipType[]
                : DEFAULT_FILTERS.relationshipTypes,
            layout: (layout as LayoutMode) || DEFAULT_FILTERS.layout,
            searchQuery: search || '',
            centerTopicSlug: center || null,
            depth: depth ? parseInt(depth, 10) : DEFAULT_FILTERS.depth,
        };
    });

    // Sync to URL when filters change
    useEffect(() => {
        if (!syncToUrl) return;

        const params = new URLSearchParams();

        // Only add non-default values to keep URL clean
        if (filters.topicTypes.join(',') !== DEFAULT_FILTERS.topicTypes.join(',')) {
            params.set('types', filters.topicTypes.join(','));
        }
        if (filters.relationshipTypes.join(',') !== DEFAULT_FILTERS.relationshipTypes.join(',')) {
            params.set('relationships', filters.relationshipTypes.join(','));
        }
        if (filters.layout !== DEFAULT_FILTERS.layout) {
            params.set('layout', filters.layout);
        }
        if (filters.searchQuery) {
            params.set('q', filters.searchQuery);
        }
        if (filters.centerTopicSlug) {
            params.set('center', filters.centerTopicSlug);
        }
        if (filters.depth !== DEFAULT_FILTERS.depth) {
            params.set('depth', filters.depth.toString());
        }

        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        // Use replaceState to avoid creating history entries for every filter change
        window.history.replaceState(null, '', newUrl);
    }, [filters, pathname, syncToUrl]);

    // Convenience setters
    const toggleTopicType = useCallback((type: TopicType) => {
        setFilters(prev => ({
            ...prev,
            topicTypes: prev.topicTypes.includes(type)
                ? prev.topicTypes.filter(t => t !== type)
                : [...prev.topicTypes, type],
        }));
    }, []);

    const toggleRelationshipType = useCallback((type: RelationshipType) => {
        setFilters(prev => ({
            ...prev,
            relationshipTypes: prev.relationshipTypes.includes(type)
                ? prev.relationshipTypes.filter(t => t !== type)
                : [...prev.relationshipTypes, type],
        }));
    }, []);

    const setLayout = useCallback((layout: LayoutMode) => {
        setFilters(prev => ({ ...prev, layout }));
    }, []);

    const setSearchQuery = useCallback((searchQuery: string) => {
        setFilters(prev => ({ ...prev, searchQuery }));
    }, []);

    const centerOnTopic = useCallback((slug: string | null) => {
        setFilters(prev => ({ ...prev, centerTopicSlug: slug }));
    }, []);

    const setDepth = useCallback((depth: number) => {
        setFilters(prev => ({ ...prev, depth: Math.min(Math.max(depth, 1), 5) }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    // Computed values
    const hasActiveFilters = useMemo(() => {
        return (
            filters.topicTypes.join(',') !== DEFAULT_FILTERS.topicTypes.join(',') ||
            filters.relationshipTypes.join(',') !== DEFAULT_FILTERS.relationshipTypes.join(',') ||
            filters.layout !== DEFAULT_FILTERS.layout ||
            filters.searchQuery !== '' ||
            filters.centerTopicSlug !== null ||
            filters.depth !== DEFAULT_FILTERS.depth
        );
    }, [filters]);

    const filterQueryString = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.topicTypes.length > 0) {
            params.set('types', filters.topicTypes.join(','));
        }
        if (filters.relationshipTypes.length > 0) {
            params.set('relationships', filters.relationshipTypes.join(','));
        }
        if (filters.centerTopicSlug) {
            params.set('center', filters.centerTopicSlug);
        }
        params.set('depth', filters.depth.toString());
        return params.toString();
    }, [filters]);

    return {
        filters,
        setFilters,
        toggleTopicType,
        toggleRelationshipType,
        setLayout,
        setSearchQuery,
        centerOnTopic,
        setDepth,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
    };
}

/**
 * Hook for fetching graph data with filters applied
 */
export function useGraphData(filterQueryString: string) {
    const [data, setData] = useState<GraphData>({ nodes: [], edges: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/graph?${filterQueryString}&limit=100`);
            if (!res.ok) throw new Error('Failed to fetch graph data');

            const json = await res.json();
            setData({
                nodes: json.nodes || [],
                edges: json.edges || [],
            });
        } catch (err) {
            console.error('Graph data fetch error:', err);
            setError('Failed to load graph data');
        } finally {
            setIsLoading(false);
        }
    }, [filterQueryString]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

/**
 * Convert graph nodes to topic summaries for list view
 */
export function nodesToTopicSummaries(data: GraphData): TopicSummary[] {
    const connectionCounts = new Map<string, number>();

    // Count connections for each node
    for (const edge of data.edges) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
        connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
    }

    return data.nodes
        .map(node => ({
            id: node.id,
            slug: node.slug,
            label: node.label,
            labelHebrew: node.labelHebrew,
            category: node.category as TopicSummary['category'],
            connectionCount: connectionCounts.get(node.id) || 0,
        }))
        .sort((a, b) => b.connectionCount - a.connectionCount);
}
