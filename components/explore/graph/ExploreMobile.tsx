'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Search, X, ChevronRight, Maximize2, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FilterPanel } from './FilterPanel';
import { useExploreFilters, useGraphData, nodesToTopicSummaries } from './useExploreFilters';
import { GraphNode, GraphData, TopicSummary, TOPIC_TYPE_CONFIG, TopicType } from './types';

// Lazy load ForceGraph
const ForceGraph = dynamic(
    () => import('@/components/graph/ForceGraph').then(mod => mod.ForceGraph),
    { ssr: false, loading: () => <MiniGraphLoading /> }
);

function MiniGraphLoading() {
    return (
        <div className="w-full h-48 flex items-center justify-center bg-muted/30 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );
}

interface ExploreMobileProps {
    initialData?: GraphData;
}

/**
 * ExploreMobile - Mobile-optimized explore with list-first approach
 * Features: search bar, filter chips, topic list, mini graph, bottom sheet details
 */
export function ExploreMobile({ initialData }: ExploreMobileProps) {
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

    const [selectedTopic, setSelectedTopic] = useState<TopicSummary | null>(null);
    const [showFullGraph, setShowFullGraph] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Use initial data if available
    const graphData = initialData || data;

    // Convert to sortable list
    const topicList = useMemo(() => {
        let topics = nodesToTopicSummaries(graphData);

        // Filter by search
        if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase();
            topics = topics.filter(
                t =>
                    t.label.toLowerCase().includes(query) ||
                    t.labelHebrew?.includes(filters.searchQuery)
            );
        }

        return topics;
    }, [graphData, filters.searchQuery]);

    // Get local graph data for selected topic
    const selectedTopicGraph = useMemo(() => {
        if (!selectedTopic) return { nodes: [], edges: [] };

        const centerNode = graphData.nodes.find(n => n.id === selectedTopic.id);
        if (!centerNode) return { nodes: [], edges: [] };

        // Get 1-hop neighbors
        const neighborIds = new Set<string>([centerNode.id]);
        const relevantEdges = graphData.edges.filter(edge => {
            const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

            if (sourceId === centerNode.id) {
                neighborIds.add(targetId);
                return true;
            }
            if (targetId === centerNode.id) {
                neighborIds.add(sourceId);
                return true;
            }
            return false;
        });

        return {
            nodes: graphData.nodes.filter(n => neighborIds.has(n.id)),
            edges: relevantEdges,
        };
    }, [selectedTopic, graphData]);

    const handleTopicSelect = useCallback((topic: TopicSummary) => {
        setSelectedTopic(topic);
    }, []);

    const handleGraphNodeClick = useCallback(
        (node: GraphNode) => {
            const topic = topicList.find(t => t.id === node.id);
            if (topic) {
                setSelectedTopic(topic);
            }
        },
        [topicList]
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="px-4 py-3">
                    <h1 className="font-semibold text-lg mb-3">Explore</h1>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={filters.searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full pl-10 pr-10 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                        {filters.searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Filter chips */}
                    <FilterPanel
                        filters={filters}
                        onToggleTopicType={toggleTopicType}
                        onToggleRelationshipType={toggleRelationshipType}
                        onSetLayout={setLayout}
                        onSetDepth={setDepth}
                        onReset={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                        compact={true}
                    />
                </div>
            </header>

            {/* Mini Graph Preview */}
            <div className="px-4 py-3">
                <div className="relative">
                    <div className="rounded-xl overflow-hidden border border-border">
                        {isLoading ? (
                            <MiniGraphLoading />
                        ) : graphData.nodes.length > 0 ? (
                            <ForceGraph
                                nodes={graphData.nodes.slice(0, 30)}
                                edges={graphData.edges.slice(0, 50)}
                                width={400}
                                height={180}
                                onNodeClick={handleGraphNodeClick}
                                highlightedNodeId={selectedTopic?.id}
                                interactive={false}
                            />
                        ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">No connections found</p>
                            </div>
                        )}
                    </div>

                    {/* Expand button */}
                    {graphData.nodes.length > 0 && (
                        <button
                            onClick={() => setShowFullGraph(true)}
                            className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-background transition-colors"
                        >
                            <Maximize2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-2">
                    {graphData.nodes.length} topics &bull; Tap to expand
                </p>
            </div>

            {/* Topic List */}
            <div className="flex-1 px-4 pb-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                    {filters.searchQuery ? 'Search Results' : 'All Topics'}
                    <span className="ml-2 text-xs">({topicList.length})</span>
                </h2>

                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : topicList.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">No topics found</p>
                        {hasActiveFilters && (
                            <button onClick={resetFilters} className="text-sm text-primary">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {topicList.map(topic => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                onClick={() => handleTopicSelect(topic)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Topic Detail Sheet */}
            <BottomSheet
                isOpen={!!selectedTopic}
                onClose={() => setSelectedTopic(null)}
                title={selectedTopic?.label || ''}
                height="h-[70vh]"
            >
                {selectedTopic && (
                    <TopicDetailContent
                        topic={selectedTopic}
                        localGraph={selectedTopicGraph}
                        onNodeClick={handleGraphNodeClick}
                        onCenterGraph={() => {
                            centerOnTopic(selectedTopic.slug);
                            setSelectedTopic(null);
                        }}
                    />
                )}
            </BottomSheet>

            {/* Full Graph Sheet */}
            <BottomSheet
                isOpen={showFullGraph}
                onClose={() => setShowFullGraph(false)}
                title="Knowledge Graph"
                height="h-[85vh]"
            >
                <div className="h-full -mx-6 -mb-6">
                    <ForceGraph
                        nodes={graphData.nodes}
                        edges={graphData.edges}
                        width={400}
                        height={500}
                        onNodeClick={node => {
                            const topic = topicList.find(t => t.id === node.id);
                            if (topic) {
                                setShowFullGraph(false);
                                setTimeout(() => setSelectedTopic(topic), 300);
                            }
                        }}
                        highlightedNodeId={selectedTopic?.id}
                        interactive={true}
                    />
                </div>
            </BottomSheet>
        </div>
    );
}

// Topic card for list view
function TopicCard({ topic, onClick }: { topic: TopicSummary; onClick: () => void }) {
    const typeConfig = TOPIC_TYPE_CONFIG[topic.category as TopicType];

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left active:scale-[0.98]"
        >
            {typeConfig && (
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${typeConfig.color}20` }}
                >
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: typeConfig.color }}
                    />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{topic.label}</h3>
                {topic.labelHebrew && topic.labelHebrew !== topic.label && (
                    <p className="text-xs text-muted-foreground truncate" dir="rtl">
                        {topic.labelHebrew}
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                    {topic.connectionCount} connections
                </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>
    );
}

// Topic detail content for bottom sheet
function TopicDetailContent({
    topic,
    localGraph,
    onNodeClick,
    onCenterGraph,
}: {
    topic: TopicSummary;
    localGraph: GraphData;
    onNodeClick: (node: GraphNode) => void;
    onCenterGraph: () => void;
}) {
    const typeConfig = TOPIC_TYPE_CONFIG[topic.category as TopicType];

    // Get connected topics
    const connectedTopics = localGraph.nodes.filter(n => n.id !== topic.id);

    return (
        <div className="space-y-4">
            {/* Type badge */}
            {typeConfig && (
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: typeConfig.color }}
                    />
                    <span className="text-sm text-muted-foreground">{typeConfig.label}</span>
                </div>
            )}

            {/* Hebrew name */}
            {topic.labelHebrew && topic.labelHebrew !== topic.label && (
                <p className="text-lg" dir="rtl">
                    {topic.labelHebrew}
                </p>
            )}

            {/* Local graph */}
            {localGraph.nodes.length > 1 && (
                <div className="rounded-xl overflow-hidden border border-border">
                    <ForceGraph
                        nodes={localGraph.nodes}
                        edges={localGraph.edges}
                        width={350}
                        height={180}
                        onNodeClick={onNodeClick}
                        highlightedNodeId={topic.id}
                        interactive={false}
                    />
                </div>
            )}

            {/* Connected topics */}
            {connectedTopics.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-2">
                        Connected Topics ({connectedTopics.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {connectedTopics.slice(0, 10).map(node => {
                            const nodeType = TOPIC_TYPE_CONFIG[node.category as TopicType];
                            return (
                                <button
                                    key={node.id}
                                    onClick={() => onNodeClick(node)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-xs hover:bg-muted/80 transition-colors"
                                >
                                    {nodeType && (
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: nodeType.color }}
                                        />
                                    )}
                                    {node.label}
                                </button>
                            );
                        })}
                        {connectedTopics.length > 10 && (
                            <span className="text-xs text-muted-foreground px-2 py-1.5">
                                +{connectedTopics.length - 10} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
                <Link
                    href={`/topics/${topic.slug}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Full Topic
                </Link>
            </div>
        </div>
    );
}

export default ExploreMobile;
