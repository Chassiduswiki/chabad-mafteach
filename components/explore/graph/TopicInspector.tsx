'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, GitBranch, X, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GraphNode, GraphEdge, TOPIC_TYPE_CONFIG, TopicType } from './types';

interface TopicInspectorProps {
    node: GraphNode | null;
    edges: GraphEdge[];
    allNodes: GraphNode[];
    onClose?: () => void;
    onCenterOnTopic?: (slug: string) => void;
    onNodeClick?: (node: GraphNode) => void;
    className?: string;
}

/**
 * TopicInspector - Right sidebar showing details about selected topic
 */
export function TopicInspector({
    node,
    edges,
    allNodes,
    onClose,
    onCenterOnTopic,
    onNodeClick,
    className,
}: TopicInspectorProps) {
    if (!node) {
        return (
            <div className={cn('flex flex-col items-center justify-center h-full text-center p-6', className)}>
                <GitBranch className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                    Select a topic to see details
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Click any node in the graph
                </p>
            </div>
        );
    }

    // Find connections for this node
    const connections = getNodeConnections(node.id, edges, allNodes);
    const typeConfig = TOPIC_TYPE_CONFIG[node.category as TopicType];

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-border">
                <div className="flex-1 min-w-0">
                    {typeConfig && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: typeConfig.color }}
                            />
                            <span className="text-xs text-muted-foreground capitalize">
                                {typeConfig.label}
                            </span>
                        </div>
                    )}
                    <h3 className="font-semibold text-lg leading-tight">{node.label}</h3>
                    {node.labelHebrew && node.labelHebrew !== node.label && (
                        <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">
                            {node.labelHebrew}
                        </p>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connections</span>
                    <span className="font-medium">{connections.length}</span>
                </div>
            </div>

            {/* Connections list */}
            <div className="flex-1 overflow-y-auto">
                {connections.length > 0 ? (
                    <div className="p-4">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Related Topics
                        </h4>
                        <div className="space-y-2">
                            {connections.map(conn => (
                                <ConnectionItem
                                    key={`${conn.node.id}-${conn.relationshipType}`}
                                    connection={conn}
                                    onClick={() => onNodeClick?.(conn.node)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No connections found
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <Link
                    href={`/topics/${node.slug}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Topic
                </Link>
                {onCenterOnTopic && (
                    <button
                        onClick={() => onCenterOnTopic(node.slug)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
                    >
                        <Crosshair className="w-4 h-4" />
                        Center Graph Here
                    </button>
                )}
            </div>
        </div>
    );
}

interface Connection {
    node: GraphNode;
    relationshipType: string;
    direction: 'incoming' | 'outgoing';
}

function getNodeConnections(nodeId: string, edges: GraphEdge[], allNodes: GraphNode[]): Connection[] {
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const connections: Connection[] = [];

    for (const edge of edges) {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        if (sourceId === nodeId) {
            const targetNode = nodeMap.get(targetId);
            if (targetNode) {
                connections.push({
                    node: targetNode,
                    relationshipType: edge.type,
                    direction: 'outgoing',
                });
            }
        } else if (targetId === nodeId) {
            const sourceNode = nodeMap.get(sourceId);
            if (sourceNode) {
                connections.push({
                    node: sourceNode,
                    relationshipType: edge.type,
                    direction: 'incoming',
                });
            }
        }
    }

    return connections;
}

function ConnectionItem({
    connection,
    onClick,
}: {
    connection: Connection;
    onClick: () => void;
}) {
    const { node, relationshipType, direction } = connection;
    const typeConfig = TOPIC_TYPE_CONFIG[node.category as TopicType];

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left group"
        >
            {typeConfig && (
                <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typeConfig.color }}
                />
            )}
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium group-hover:text-primary transition-colors truncate block">
                    {node.label}
                </span>
                <span className="text-xs text-muted-foreground">
                    {direction === 'outgoing' ? '→' : '←'} {formatRelationshipType(relationshipType)}
                </span>
            </div>
        </button>
    );
}

function formatRelationshipType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default TopicInspector;
