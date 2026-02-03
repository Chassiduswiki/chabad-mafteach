/**
 * Types for the Explore Graph feature
 */

export type TopicType = 'concept' | 'person' | 'mitzvah' | 'sefirah' | 'place' | 'event';

export type RelationshipType =
    | 'subcategory'
    | 'instance_of'
    | 'part_of'
    | 'related_to'
    | 'sefirah_hierarchy'
    | 'chronological'
    | 'conceptual_parent';

export type LayoutMode = 'force' | 'hierarchical' | 'radial';

export interface ExploreFilters {
    topicTypes: TopicType[];
    relationshipTypes: RelationshipType[];
    layout: LayoutMode;
    searchQuery: string;
    centerTopicSlug: string | null;
    depth: number;
}

export interface GraphNode {
    id: string;
    label: string;
    labelHebrew?: string;
    slug: string;
    category?: string;
    size?: number;
    x?: number;
    y?: number;
}

export interface GraphEdge {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    strength: number;
    description?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface TopicSummary {
    id: string;
    slug: string;
    label: string;
    labelHebrew?: string;
    category?: TopicType;
    connectionCount: number;
    description?: string;
}

// Display configuration for filters
export const TOPIC_TYPE_CONFIG: Record<TopicType, { label: string; color: string }> = {
    concept: { label: 'Concepts', color: '#8b5cf6' },
    person: { label: 'People', color: '#3b82f6' },
    mitzvah: { label: 'Mitzvos', color: '#10b981' },
    sefirah: { label: 'Sefirot', color: '#f59e0b' },
    place: { label: 'Places', color: '#ec4899' },
    event: { label: 'Events', color: '#ef4444' },
};

export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, { label: string; description: string }> = {
    related_to: { label: 'Related To', description: 'General relationship' },
    conceptual_parent: { label: 'Parent/Child', description: 'Conceptual hierarchy' },
    subcategory: { label: 'Subcategory', description: 'Category membership' },
    instance_of: { label: 'Instance Of', description: 'Type/instance relationship' },
    part_of: { label: 'Part Of', description: 'Component relationship' },
    sefirah_hierarchy: { label: 'Sefirah Order', description: 'Kabbalistic structure' },
    chronological: { label: 'Chronological', description: 'Time-based ordering' },
};

export const LAYOUT_CONFIG: Record<LayoutMode, { label: string; description: string }> = {
    force: { label: 'Force', description: 'Physics-based clustering' },
    hierarchical: { label: 'Tree', description: 'Parent-child hierarchy' },
    radial: { label: 'Radial', description: 'Centered expansion' },
};

// Default filter state
export const DEFAULT_FILTERS: ExploreFilters = {
    topicTypes: ['concept', 'sefirah', 'mitzvah'],
    relationshipTypes: ['related_to', 'conceptual_parent'],
    layout: 'force',
    searchQuery: '',
    centerTopicSlug: null,
    depth: 2,
};
