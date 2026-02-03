'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink, BookOpen, ArrowDown } from 'lucide-react';
import type { IdeaChainFull, IdeaNodeWithSource, ContributionType, RelationshipType } from '@/lib/idea-chains/types';

interface ChainPreviewProps {
    chain: IdeaChainFull;
    nodes: IdeaNodeWithSource[];
}

// Contribution type configuration - minimal, text-focused
const CONTRIBUTION_CONFIG: Record<ContributionType, {
    label: string;
}> = {
    origin: { label: 'Origin' },
    expansion: { label: 'Expansion' },
    application: { label: 'Application' },
    counterpoint: { label: 'Counterpoint' },
    synthesis: { label: 'Synthesis' },
    reframe: { label: 'Reframe' },
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
    cites: 'cites',
    builds_upon: 'builds upon',
    synthesizes_with: 'synthesizes',
    reframes_via: 'reframes via',
};

// Get the source display name
function getSourceDisplay(node: IdeaNodeWithSource): string {
    if (node.source?.title) return node.source.title;
    if (node.citation_reference) return node.citation_reference;
    return CONTRIBUTION_CONFIG[node.contribution_type].label;
}

// Format year display
function formatYear(year: number): string {
    return year > 0 ? `c. ${year}` : `c. ${Math.abs(year)} BCE`;
}

// Origin Node - Clean, text-focused design
function OriginNode({ node, isInView }: { node: IdeaNodeWithSource; isInView: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-6">
                {/* Source metadata - secondary */}
                <div className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium text-foreground">{getSourceDisplay(node)}</span>
                    {node.citation_reference && node.source?.title && (
                        <span className="ml-2">{node.citation_reference}</span>
                    )}
                    {node.approximate_year && (
                        <span className="ml-2">• {formatYear(node.approximate_year)}</span>
                    )}
                </div>

                {/* Hebrew Quote - THE hero content */}
                {node.quote_hebrew && (
                    <div className="border-l-2 border-amber-500/40 pl-4 mb-4">
                        <p className="text-xl md:text-2xl leading-relaxed font-serif" dir="rtl">
                            {node.quote_hebrew}
                        </p>
                        {node.quote_translated && (
                            <p className="mt-3 text-muted-foreground italic">
                                "{node.quote_translated}"
                            </p>
                        )}
                    </div>
                )}

                {/* Contribution summary */}
                <p className="text-foreground/90 leading-relaxed">
                    {node.contribution_summary}
                </p>

                {/* Key insight - inline, not collapsed */}
                {node.base_idea_summary && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        <span className="font-medium">Core concept:</span> {node.base_idea_summary}
                    </p>
                )}

                {/* External link */}
                {node.external_url && (
                    <a
                        href={node.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View source
                    </a>
                )}
            </div>
        </motion.div>
    );
}

// Transmission Node - Single column, text-focused
function TransmissionNode({
    node,
    isInView,
    relationshipType,
}: {
    node: IdeaNodeWithSource;
    index: number;
    isInView: boolean;
    relationshipType?: RelationshipType;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="max-w-2xl mx-auto bg-background border border-border rounded-lg p-6">
                {/* Relationship label - subtle */}
                {relationshipType && (
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                        {RELATIONSHIP_LABELS[relationshipType]}
                    </p>
                )}

                {/* Source metadata */}
                <div className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium text-foreground">{getSourceDisplay(node)}</span>
                    {node.citation_reference && node.source?.title && (
                        <span className="ml-2">{node.citation_reference}</span>
                    )}
                    {node.approximate_year && (
                        <span className="ml-2">• {formatYear(node.approximate_year)}</span>
                    )}
                </div>

                {/* Hebrew Quote - always visible, primary content */}
                {node.quote_hebrew && (
                    <div className="border-l-2 border-border pl-4 mb-4">
                        <p className="text-lg leading-relaxed font-serif" dir="rtl">
                            {node.quote_hebrew}
                        </p>
                        {node.quote_translated && (
                            <p className="mt-3 text-sm text-muted-foreground italic">
                                "{node.quote_translated}"
                            </p>
                        )}
                    </div>
                )}

                {/* Contribution summary */}
                <p className="text-foreground/90 leading-relaxed">
                    {node.contribution_summary}
                </p>

                {/* Key insight - inline */}
                {node.base_idea_summary && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        <span className="font-medium">Key insight:</span> {node.base_idea_summary}
                    </p>
                )}

                {/* External link */}
                {node.external_url && (
                    <a
                        href={node.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View source
                    </a>
                )}
            </div>
        </motion.div>
    );
}

// Simple connector between nodes
function FlowConnector() {
    return (
        <div className="flex justify-center py-4">
            <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <div className="w-px h-4 bg-border" />
            </div>
        </div>
    );
}

export function ChainPreview({ chain, nodes }: ChainPreviewProps) {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true });

    // Find origin node and others
    const originNode = nodes.find(n => n.is_origin);
    const transmissionNodes = nodes.filter(n => !n.is_origin);

    // Build relationship map from links
    const relationshipMap = new Map<number, RelationshipType>();
    chain.links?.forEach(link => {
        relationshipMap.set(link.child_node_id, link.relationship_type);
    });

    return (
        <div className="py-8 px-4">
            {/* Header */}
            <motion.header
                ref={headerRef}
                className="max-w-2xl mx-auto mb-8"
                initial={{ opacity: 0 }}
                animate={headerInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-foreground mb-1">
                    {chain.title}
                </h1>

                {chain.title_hebrew && (
                    <h2 className="text-lg text-muted-foreground font-serif mb-3" dir="rtl">
                        {chain.title_hebrew}
                    </h2>
                )}

                {chain.description && (
                    <p className="text-muted-foreground leading-relaxed">
                        {chain.description}
                    </p>
                )}

                {/* Simple stats */}
                <p className="mt-4 text-sm text-muted-foreground">
                    {nodes.length} sources
                    {nodes.length >= 2 && nodes[0]?.approximate_year && nodes[nodes.length - 1]?.approximate_year && (
                        <> • {Math.abs(nodes[0].approximate_year! - nodes[nodes.length - 1].approximate_year!)} year span</>
                    )}
                </p>
            </motion.header>

            {/* Nodes - single column */}
            <div>
                {originNode && (
                    <NodeWrapper node={originNode}>
                        {(isInView) => <OriginNode node={originNode} isInView={isInView} />}
                    </NodeWrapper>
                )}

                {originNode && transmissionNodes.length > 0 && <FlowConnector />}

                {transmissionNodes.map((node, index) => (
                    <React.Fragment key={node.id}>
                        <NodeWrapper node={node}>
                            {(isInView) => (
                                <TransmissionNode
                                    node={node}
                                    index={index + 1}
                                    isInView={isInView}
                                    relationshipType={relationshipMap.get(node.id)}
                                />
                            )}
                        </NodeWrapper>

                        {index < transmissionNodes.length - 1 && <FlowConnector />}
                    </React.Fragment>
                ))}
            </div>

            {/* Empty state - minimal */}
            {nodes.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                    <p>No nodes yet</p>
                </div>
            )}
        </div>
    );
}

// Wrapper for scroll-triggered animations
function NodeWrapper({
    node,
    children
}: {
    node: IdeaNodeWithSource;
    children: (isInView: boolean) => React.ReactNode
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <div ref={ref}>
            {children(isInView)}
        </div>
    );
}
