/**
 * Idea Chain System - Type Definitions
 *
 * These types define the data structures for tracing intellectual genealogy
 * through Chassidic literature.
 */

// ============ Enums ============

export type ContributionType =
    | 'origin'
    | 'expansion'
    | 'application'
    | 'counterpoint'
    | 'synthesis'
    | 'reframe';

export type RelationshipType =
    | 'cites'
    | 'builds_upon'
    | 'synthesizes_with'
    | 'reframes_via';

export type ChainStatus = 'draft' | 'review' | 'published';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

// ============ Core Entities ============

/**
 * Container entity for a traced concept.
 */
export interface IdeaChain {
    id: number;
    title: string;
    title_hebrew: string | null;
    slug: string;
    description: string | null;
    status: ChainStatus;
    is_featured: boolean;
    cover_image: string | null;
    user_created: string | null;
    date_created: string | null;
    date_updated: string | null;
}

/**
 * Multi-scholar collaboration support.
 */
export interface IdeaChainCollaborator {
    id: number;
    chain_id: number;
    user_id: string;
    role: CollaboratorRole;
    invited_by: string | null;
    date_added: string | null;
}

/**
 * Version history for tracking chain evolution.
 */
export interface IdeaChainVersion {
    id: number;
    chain_id: number;
    version_number: number;
    snapshot: IdeaChainSnapshot;
    change_summary: string | null;
    user_created: string | null;
    date_created: string | null;
}

/**
 * Snapshot of chain state for version history.
 */
export interface IdeaChainSnapshot {
    chain: Omit<IdeaChain, 'id'>;
    nodes: Omit<IdeaNode, 'id' | 'chain_id'>[];
    links: Omit<IdeaNodeLink, 'id'>[];
}

/**
 * A single point in the chain representing one source's contribution.
 */
export interface IdeaNode {
    id: number;
    chain_id: number;
    source_id: number | null;
    citation_reference: string | null;
    quote_hebrew: string | null;
    quote_translated: string | null;
    external_url: string | null;
    contribution_type: ContributionType;
    contribution_summary: string;
    contribution_summary_hebrew: string | null;
    base_idea_summary: string | null;
    approximate_year: number | null;
    position: number | null;
    is_origin: boolean;
    metadata: Record<string, unknown> | null;
    user_created: string | null;
    date_created: string | null;
}

/**
 * Junction table enabling DAG structure (multiple parents/children).
 */
export interface IdeaNodeLink {
    id: number;
    parent_node_id: number;
    child_node_id: number;
    relationship_type: RelationshipType;
    relationship_note: string | null;
}

/**
 * Links chains to topics for embedding.
 */
export interface IdeaChainTopic {
    id: number;
    chain_id: number;
    topic_id: number;
    display_context: string | null;
    order_index: number;
}

// ============ API Response Types ============

/**
 * Node with denormalized source info for display.
 */
export interface IdeaNodeWithSource extends IdeaNode {
    source: {
        id: number;
        title: string;
        author_name: string | null;
        publication_year: number | null;
    } | null;
}

/**
 * Full chain response with all nested data.
 */
export interface IdeaChainFull extends IdeaChain {
    nodes: IdeaNodeWithSource[];
    links: IdeaNodeLink[];
    collaborators?: IdeaChainCollaborator[];
    topics?: {
        id: number;
        slug: string;
        canonical_title: string;
    }[];
}

/**
 * Chain list item for index pages.
 */
export interface IdeaChainListItem {
    id: number;
    title: string;
    title_hebrew: string | null;
    slug: string;
    description: string | null;
    status: ChainStatus;
    is_featured: boolean;
    node_count: number;
    date_updated: string | null;
}

// ============ API Request Types ============

/**
 * Create a new chain.
 */
export interface CreateIdeaChainInput {
    title: string;
    title_hebrew?: string | null;
    slug: string;
    description?: string | null;
    status?: ChainStatus;
    is_featured?: boolean;
}

/**
 * Update an existing chain.
 */
export interface UpdateIdeaChainInput {
    title?: string;
    title_hebrew?: string | null;
    description?: string | null;
    status?: ChainStatus;
    is_featured?: boolean;
}

/**
 * Create a new node.
 */
export interface CreateIdeaNodeInput {
    source_id?: number | null;
    citation_reference?: string | null;
    quote_hebrew?: string | null;
    quote_translated?: string | null;
    external_url?: string | null;
    contribution_type: ContributionType;
    contribution_summary: string;
    contribution_summary_hebrew?: string | null;
    base_idea_summary?: string | null;
    approximate_year?: number | null;
    position?: number | null;
    is_origin?: boolean;
    parent_node_ids?: number[];
}

/**
 * Update an existing node.
 */
export interface UpdateIdeaNodeInput {
    source_id?: number | null;
    citation_reference?: string | null;
    quote_hebrew?: string | null;
    quote_translated?: string | null;
    external_url?: string | null;
    contribution_type?: ContributionType;
    contribution_summary?: string;
    contribution_summary_hebrew?: string | null;
    base_idea_summary?: string | null;
    approximate_year?: number | null;
    position?: number | null;
    is_origin?: boolean;
}

/**
 * Create a link between nodes.
 */
export interface CreateIdeaNodeLinkInput {
    parent_node_id: number;
    child_node_id: number;
    relationship_type?: RelationshipType;
    relationship_note?: string | null;
}

/**
 * Link a chain to a topic.
 */
export interface CreateIdeaChainTopicInput {
    chain_id: number;
    topic_id: number;
    display_context?: string | null;
    order_index?: number;
}

// ============ UI State Types ============

/**
 * State for the chain builder form.
 */
export interface ChainBuilderState {
    chain: Partial<IdeaChain>;
    nodes: (Partial<IdeaNode> & { tempId?: string })[];
    links: (Partial<IdeaNodeLink> & { tempParentId?: string; tempChildId?: string })[];
    isDirty: boolean;
    isSaving: boolean;
    errors: Record<string, string>;
}

/**
 * Props for contribution type display.
 */
export const CONTRIBUTION_TYPE_CONFIG: Record<ContributionType, {
    label: string;
    description: string;
    icon: string;
    color: string;
}> = {
    origin: {
        label: 'Origin',
        description: 'First appearance of the idea',
        icon: 'star',
        color: 'amber',
    },
    expansion: {
        label: 'Expansion',
        description: 'Develops existing concept',
        icon: 'expand',
        color: 'blue',
    },
    application: {
        label: 'Application',
        description: 'Applies to new domain',
        icon: 'target',
        color: 'green',
    },
    counterpoint: {
        label: 'Counterpoint',
        description: 'Challenges or qualifies',
        icon: 'scale',
        color: 'red',
    },
    synthesis: {
        label: 'Synthesis',
        description: 'Combines multiple sources',
        icon: 'merge',
        color: 'purple',
    },
    reframe: {
        label: 'Reframe',
        description: 'New perspective via tangential source',
        icon: 'refresh',
        color: 'orange',
    },
};

/**
 * Props for relationship type display.
 */
export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, {
    label: string;
    description: string;
}> = {
    cites: {
        label: 'Cites',
        description: 'Directly quotes or references',
    },
    builds_upon: {
        label: 'Builds Upon',
        description: 'Extends or develops the idea',
    },
    synthesizes_with: {
        label: 'Synthesizes With',
        description: 'Combines with another source',
    },
    reframes_via: {
        label: 'Reframes Via',
        description: 'Provides new perspective through tangential concept',
    },
};
