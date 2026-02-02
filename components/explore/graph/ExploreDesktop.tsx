'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, X, PanelLeftClose, PanelLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterPanel } from './FilterPanel';
import { TopicInspector } from './TopicInspector';
import { useExploreFilters, useGraphData, nodesToTopicSummaries } from './useExploreFilters';
import { GraphNode, GraphData } from './types';

// Lazy load ForceGraph to avoid SSR issues
const ForceGraph = dynamic(
    () => import('@/components/graph/ForceGraph').then(mod => mod.ForceGraph),
    { ssr: false, loading: () => <GraphLoading /> }
);

function GraphLoading() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading graph...</span>
            </div>
        </div>
    );
}

interface ExploreDesktopProps {
    initialData?: GraphData;
}

/**
 * ExploreDesktop - Full 3-panel research workbench for desktop
 * Left: Filters | Center: Graph | Right: Topic Inspector
 */
export function ExploreDesktop({ initialData }: ExploreDesktopProps) {
    const {
        filters,
        toggleTopicType,
        toggleRelationshipType,
        setLayout,
        setDepth,
        setSearchQuery,
        centerOnTopic,
        resetFilters,
        hasActiveFilters,
        filterQueryString,
    } = useExploreFilters();

    const { data, isLoading, error } = useGraphData(filterQueryString);

    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);

    // Use initial data if available, otherwise fetched data
    const graphData = initialData || data;

    // Filter nodes by search query (client-side for instant feedback)
    const filteredData = useMemo(() => {
        if (!filters.searchQuery.trim()) return graphData;

        const query = filters.searchQuery.toLowerCase();
        const matchingNodes = graphData.nodes.filter(
            node =>
                node.label.toLowerCase().includes(query) ||
                node.labelHebrew?.includes(filters.searchQuery)
        );
        const matchingIds = new Set(matchingNodes.map(n => n.id));

        // Include connected nodes (1 hop)
        const connectedIds = new Set(matchingIds);
        for (const edge of graphData.edges) {
            const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

            if (matchingIds.has(sourceId)) connectedIds.add(targetId);
            if (matchingIds.has(targetId)) connectedIds.add(sourceId);
        }

        return {
            nodes: graphData.nodes.filter(n => connectedIds.has(n.id)),
            edges: graphData.edges.filter(e => {
                const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
                const targetId = typeof e.target === 'string' ? e.target : e.target.id;
                return connectedIds.has(sourceId) && connectedIds.has(targetId);
            }),
        };
    }, [graphData, filters.searchQuery]);

    // Search results for dropdown
    const searchResults = useMemo(() => {
        if (!filters.searchQuery.trim()) return [];
        const query = filters.searchQuery.toLowerCase();
        return nodesToTopicSummaries(graphData)
            .filter(
                t =>
                    t.label.toLowerCase().includes(query) ||
                    t.labelHebrew?.includes(filters.searchQuery)
            )
            .slice(0, 8);
    }, [graphData, filters.searchQuery]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node);
        setRightPanelOpen(true);
    }, []);

    const handleSearchResultClick = useCallback(
        (slug: string) => {
            const node = graphData.nodes.find(n => n.slug === slug);
            if (node) {
                setSelectedNode(node);
                setRightPanelOpen(true);
            }
            setSearchQuery('');
            setSearchFocused(false);
        },
        [graphData.nodes, setSearchQuery]
    );

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top Bar */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={leftPanelOpen ? 'Hide filters' : 'Show filters'}
                    >
                        {leftPanelOpen ? (
                            <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
                        ) : (
                            <PanelLeft className="w-5 h-5 text-muted-foreground" />
                        )}
                    </button>
                    <div>
                        <h1 className="font-semibold text-lg">Explore</h1>
                        <p className="text-xs text-muted-foreground">
                            {filteredData.nodes.length} topics &bull; {filteredData.edges.length} connections
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full max-w-md mx-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        placeholder="Search topics..."
                        className="w-full pl-10 pr-10 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    {filters.searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}

                    {/* Search dropdown */}
                    {searchFocused && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                            {searchResults.map(result => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSearchResultClick(result.slug)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate block">
                                            {result.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {result.connectionCount} connections
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right panel toggle */}
                <button
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                    className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        selectedNode
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                >
                    {selectedNode ? selectedNode.label : 'Inspector'}
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Filters */}
                <aside
                    className={cn(
                        'border-r border-border bg-background transition-all duration-300 overflow-hidden',
                        leftPanelOpen ? 'w-64' : 'w-0'
                    )}
                >
                    <FilterPanel
                        filters={filters}
                        onToggleTopicType={toggleTopicType}
                        onToggleRelationshipType={toggleRelationshipType}
                        onSetLayout={setLayout}
                        onSetDepth={setDepth}
                        onReset={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                    />
                </aside>

                {/* Center - Graph Canvas */}
                <main className="flex-1 relative">
                    {isLoading ? (
                        <GraphLoading />
                    ) : error ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-muted-foreground mb-2">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : filteredData.nodes.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-muted-foreground mb-2">
                                    No topics match your filters
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Reset filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ForceGraph
                            nodes={filteredData.nodes}
                            edges={filteredData.edges}
                            width={1200}
                            height={800}
                            onNodeClick={handleNodeClick}
                            highlightedNodeId={selectedNode?.id}
                            interactive={true}
                            className="w-full h-full"
                        />
                    )}

                    {/* Graph instructions overlay */}
                    <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border">
                        Drag to move &bull; Scroll to zoom &bull; Click to select
                    </div>
                </main>

                {/* Right Panel - Inspector */}
                <aside
                    className={cn(
                        'border-l border-border bg-background transition-all duration-300 overflow-hidden',
                        rightPanelOpen ? 'w-80' : 'w-0'
                    )}
                >
                    <TopicInspector
                        node={selectedNode}
                        edges={filteredData.edges}
                        allNodes={filteredData.nodes}
                        onClose={() => setSelectedNode(null)}
                        onCenterOnTopic={centerOnTopic}
                        onNodeClick={handleNodeClick}
                    />
                </aside>
            </div>
        </div>
    );
}

export default ExploreDesktop;
