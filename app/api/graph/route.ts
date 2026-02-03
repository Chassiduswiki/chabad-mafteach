import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const directus = createClient();

export interface GraphNode {
    id: string;
    label: string;
    labelHebrew?: string;
    slug: string;
    category?: string;
    size?: number; // Based on connection count
}

export interface GraphEdge {
    source: string;
    target: string;
    type: string;
    strength: number;
    description?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

/**
 * GET /api/graph
 *
 * Returns topic nodes and their relationships for graph visualization.
 *
 * Query params:
 * - limit: Max number of topics to include (default: 30)
 * - center: Topic slug to center the graph on (optional)
 * - depth: How many relationship levels to traverse (default: 2)
 * - types: Comma-separated topic types to include (e.g., "concept,sefirah")
 * - relationships: Comma-separated relationship types to include (e.g., "related_to,conceptual_parent")
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const centerSlug = searchParams.get('center');
    const depth = Math.min(parseInt(searchParams.get('depth') || '2'), 5);

    // Parse filter arrays
    const typesParam = searchParams.get('types');
    const topicTypes = typesParam ? typesParam.split(',').filter(Boolean) : null;

    const relationshipsParam = searchParams.get('relationships');
    const relationshipTypes = relationshipsParam ? relationshipsParam.split(',').filter(Boolean) : null;

    try {
        // Build filter for relationship types
        const filter: Record<string, any> = {};
        if (relationshipTypes && relationshipTypes.length > 0) {
            filter.relation_type = { _in: relationshipTypes };
        }

        // Fetch topic relationships with optional filtering
        const relationships = await directus.request(readItems('topic_relationships' as any, {
            fields: [
                'id',
                'relation_type',
                'strength',
                'description',
                { parent_topic_id: ['id', 'canonical_title', 'canonical_title_en', 'slug', 'topic_type'] },
                { child_topic_id: ['id', 'canonical_title', 'canonical_title_en', 'slug', 'topic_type'] }
            ] as any,
            filter: Object.keys(filter).length > 0 ? filter : undefined,
            limit: -1
        }));

        console.log(`Graph API: Found ${relationships.length} relationships`);

        // Build node and edge maps
        const nodeMap = new Map<string, GraphNode>();
        const edges: GraphEdge[] = [];
        const connectionCounts = new Map<string, number>();

        for (const rel of relationships as any[]) {
            const parent = rel.parent_topic_id;
            const child = rel.child_topic_id;

            if (!parent || !child) continue;

            // Add parent node
            if (!nodeMap.has(parent.id)) {
                nodeMap.set(parent.id, {
                    id: parent.id,
                    label: parent.canonical_title_en || parent.canonical_title,
                    labelHebrew: parent.canonical_title,
                    slug: parent.slug,
                    category: parent.topic_type,
                    size: 1
                });
            }

            // Add child node
            if (!nodeMap.has(child.id)) {
                nodeMap.set(child.id, {
                    id: child.id,
                    label: child.canonical_title_en || child.canonical_title,
                    labelHebrew: child.canonical_title,
                    slug: child.slug,
                    category: child.topic_type,
                    size: 1
                });
            }

            // Track connection counts for sizing
            connectionCounts.set(parent.id, (connectionCounts.get(parent.id) || 0) + 1);
            connectionCounts.set(child.id, (connectionCounts.get(child.id) || 0) + 1);

            // Add edge
            edges.push({
                source: parent.id,
                target: child.id,
                type: rel.relation_type || 'related',
                strength: rel.strength || 50,
                description: rel.description
            });
        }

        // Update node sizes based on connections
        for (const [id, count] of connectionCounts.entries()) {
            const node = nodeMap.get(id);
            if (node) {
                node.size = Math.min(count, 10); // Cap at 10 for visualization
            }
        }

        let nodes = Array.from(nodeMap.values());

        // Filter nodes by topic type if specified
        if (topicTypes && topicTypes.length > 0) {
            nodes = nodes.filter(n => n.category && topicTypes.includes(n.category));
        }

        // If centering on a specific topic, filter to that subgraph
        if (centerSlug) {
            const centerNode = nodes.find(n => n.slug === centerSlug);
            if (centerNode) {
                const includedIds = new Set<string>([centerNode.id]);
                
                // BFS to find connected nodes up to depth
                let frontier = [centerNode.id];
                for (let d = 0; d < depth; d++) {
                    const nextFrontier: string[] = [];
                    for (const nodeId of frontier) {
                        // Find connected nodes
                        for (const edge of edges) {
                            if (edge.source === nodeId && !includedIds.has(edge.target)) {
                                includedIds.add(edge.target);
                                nextFrontier.push(edge.target);
                            }
                            if (edge.target === nodeId && !includedIds.has(edge.source)) {
                                includedIds.add(edge.source);
                                nextFrontier.push(edge.source);
                            }
                        }
                    }
                    frontier = nextFrontier;
                }

                nodes = nodes.filter(n => includedIds.has(n.id));
            }
        }

        // Limit nodes if needed
        if (nodes.length > limit) {
            // Sort by connection count (most connected first)
            nodes.sort((a, b) => (b.size || 0) - (a.size || 0));
            nodes = nodes.slice(0, limit);
        }

        // Filter edges to only include those between included nodes
        const includedNodeIds = new Set(nodes.map(n => n.id));
        const filteredEdges = edges.filter(
            e => includedNodeIds.has(e.source) && includedNodeIds.has(e.target)
        );

        // If we have no relationships, fetch some topics anyway for the graph
        if (nodes.length === 0) {
            console.log('Graph API: No relationships found, fetching topics directly');

            // Build topic filter
            const topicFilter: Record<string, any> = {};
            if (topicTypes && topicTypes.length > 0) {
                topicFilter.topic_type = { _in: topicTypes };
            }

            const topics = await directus.request(readItems('topics' as any, {
                fields: ['id', 'canonical_title', 'canonical_title_en', 'slug', 'topic_type'] as any,
                filter: Object.keys(topicFilter).length > 0 ? topicFilter : undefined,
                limit: limit
            }));

            nodes = (topics as any[]).map(t => ({
                id: t.id,
                label: t.canonical_title_en || t.canonical_title,
                labelHebrew: t.canonical_title,
                slug: t.slug,
                category: t.topic_type,
                size: 1
            }));
        }

        const graphData: GraphData = {
            nodes,
            edges: filteredEdges
        };

        console.log(`Graph API: Returning ${nodes.length} nodes and ${filteredEdges.length} edges`);

        return NextResponse.json(graphData);
    } catch (error) {
        console.error('Graph API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch graph data', nodes: [], edges: [] },
            { status: 500 }
        );
    }
}
