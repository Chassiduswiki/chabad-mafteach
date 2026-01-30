/**
 * Idea Chain API - Business Logic Layer
 *
 * Handles CRUD operations for idea chains, nodes, and links.
 */

import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';
import type {
    IdeaChain,
    IdeaNode,
    IdeaNodeLink,
    IdeaChainTopic,
    IdeaChainFull,
    IdeaChainListItem,
    IdeaNodeWithSource,
    CreateIdeaChainInput,
    UpdateIdeaChainInput,
    CreateIdeaNodeInput,
    UpdateIdeaNodeInput,
    CreateIdeaNodeLinkInput,
} from '@/lib/idea-chains/types';

// Field selections for queries
const CHAIN_FIELDS = [
    'id', 'title', 'title_hebrew', 'slug', 'description',
    'status', 'is_featured', 'cover_image',
    'user_created', 'date_created', 'date_updated'
];

const NODE_FIELDS = [
    'id', 'chain_id', 'source_id', 'citation_reference',
    'quote_hebrew', 'quote_translated', 'external_url',
    'contribution_type', 'contribution_summary', 'contribution_summary_hebrew',
    'base_idea_summary', 'approximate_year', 'position', 'is_origin',
    'metadata', 'user_created', 'date_created'
];

const LINK_FIELDS = [
    'id', 'parent_node_id', 'child_node_id',
    'relationship_type', 'relationship_note'
];

/**
 * Get all chains with optional filtering
 */
export async function getChains(options: {
    status?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
} = {}): Promise<IdeaChainListItem[]> {
    const directus = createClient();
    const { status, featured, limit = 50, offset = 0 } = options;

    const filters: Record<string, unknown>[] = [];
    if (status) {
        filters.push({ status: { _eq: status } });
    }
    if (featured !== undefined) {
        filters.push({ is_featured: { _eq: featured } });
    }

    const query: Record<string, unknown> = {
        fields: CHAIN_FIELDS,
        sort: ['-date_updated'],
        limit,
        offset,
    };

    if (filters.length > 0) {
        query.filter = { _and: filters };
    }

    const chains = await directus.request(
        readItems('idea_chains' as any, query as any)
    ) as unknown as IdeaChain[];

    // Get node counts for each chain
    const chainIds = chains.map(c => c.id);
    if (chainIds.length === 0) {
        return [];
    }

    const nodes = await directus.request(
        readItems('idea_nodes' as any, {
            filter: { chain_id: { _in: chainIds } },
            fields: ['id', 'chain_id'],
        } as any)
    ) as { id: number; chain_id: number }[];

    const nodeCounts = nodes.reduce((acc, node) => {
        acc[node.chain_id] = (acc[node.chain_id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    return chains.map(chain => ({
        id: chain.id,
        title: chain.title,
        title_hebrew: chain.title_hebrew,
        slug: chain.slug,
        description: chain.description,
        status: chain.status,
        is_featured: chain.is_featured,
        node_count: nodeCounts[chain.id] || 0,
        date_updated: chain.date_updated,
    }));
}

/**
 * Get a single chain by slug with all nodes and links
 */
export async function getChainBySlug(slug: string): Promise<IdeaChainFull | null> {
    const directus = createClient();
    const normalizedSlug = slug.toLowerCase();

    // Fetch the chain
    const chains = await directus.request(
        readItems('idea_chains' as any, {
            filter: { slug: { _eq: normalizedSlug } },
            fields: CHAIN_FIELDS,
            limit: 1,
        } as any)
    ) as unknown as IdeaChain[];

    if (!chains || chains.length === 0) {
        return null;
    }

    const chain = chains[0];

    // Fetch nodes for this chain
    const nodes = await directus.request(
        readItems('idea_nodes' as any, {
            filter: { chain_id: { _eq: chain.id } },
            fields: NODE_FIELDS,
            sort: ['position', 'approximate_year'],
        } as any)
    ) as unknown as IdeaNode[];

    // Fetch source info for nodes that have source_id
    const sourceIds = nodes
        .map(n => n.source_id)
        .filter((id): id is number => id !== null);

    let sourcesMap: Record<number, { id: number; title: string; author_name: string | null; publication_year: number | null }> = {};

    if (sourceIds.length > 0) {
        const sources = await directus.request(
            readItems('sources' as any, {
                filter: { id: { _in: sourceIds } },
                fields: ['id', 'title', 'author_name', 'publication_year'],
            } as any)
        ) as { id: number; title: string; author_name: string | null; publication_year: number | null }[];

        sourcesMap = sources.reduce((acc, source) => {
            acc[source.id] = source;
            return acc;
        }, {} as typeof sourcesMap);
    }

    // Enrich nodes with source info
    const nodesWithSources: IdeaNodeWithSource[] = nodes.map(node => ({
        ...node,
        source: node.source_id ? sourcesMap[node.source_id] || null : null,
    }));

    // Fetch links between nodes
    const nodeIds = nodes.map(n => n.id);
    let links: IdeaNodeLink[] = [];

    if (nodeIds.length > 0) {
        links = await directus.request(
            readItems('idea_node_links' as any, {
                filter: {
                    _or: [
                        { parent_node_id: { _in: nodeIds } },
                        { child_node_id: { _in: nodeIds } },
                    ]
                },
                fields: LINK_FIELDS,
            } as any)
        ) as unknown as IdeaNodeLink[];
    }

    // Fetch linked topics
    const topicLinks = await directus.request(
        readItems('idea_chain_topics' as any, {
            filter: { chain_id: { _eq: chain.id } },
            fields: ['id', 'topic_id', 'display_context', 'order_index'],
            sort: ['order_index'],
        } as any)
    ) as { id: number; topic_id: number; display_context: string | null; order_index: number }[];

    let topics: { id: number; slug: string; canonical_title: string }[] = [];

    if (topicLinks.length > 0) {
        const topicIds = topicLinks.map(tl => tl.topic_id);
        topics = await directus.request(
            readItems('topics' as any, {
                filter: { id: { _in: topicIds } },
                fields: ['id', 'slug', 'canonical_title'],
            } as any)
        ) as typeof topics;
    }

    return {
        ...chain,
        nodes: nodesWithSources,
        links,
        topics,
    };
}

/**
 * Get a chain by ID
 */
export async function getChainById(id: number): Promise<IdeaChain | null> {
    const directus = createClient();

    const chains = await directus.request(
        readItems('idea_chains' as any, {
            filter: { id: { _eq: id } },
            fields: CHAIN_FIELDS,
            limit: 1,
        } as any)
    ) as unknown as IdeaChain[];

    return chains?.[0] || null;
}

/**
 * Create a new chain
 */
export async function createChain(input: CreateIdeaChainInput): Promise<IdeaChain> {
    const directus = createClient();

    const chain = await directus.request(
        createItem('idea_chains' as any, {
            title: input.title,
            title_hebrew: input.title_hebrew || null,
            slug: input.slug.toLowerCase(),
            description: input.description || null,
            status: input.status || 'draft',
            is_featured: input.is_featured || false,
        } as any)
    );

    return chain as unknown as IdeaChain;
}

/**
 * Update a chain by slug
 */
export async function updateChain(slug: string, updates: UpdateIdeaChainInput): Promise<IdeaChain | null> {
    const directus = createClient();
    const normalizedSlug = slug.toLowerCase();

    // Get chain ID first
    const chains = await directus.request(
        readItems('idea_chains' as any, {
            filter: { slug: { _eq: normalizedSlug } },
            fields: ['id'],
            limit: 1,
        } as any)
    ) as { id: number }[];

    if (!chains || chains.length === 0) {
        return null;
    }

    const updated = await directus.request(
        updateItem('idea_chains' as any, chains[0].id, updates as any)
    );

    return updated as unknown as IdeaChain;
}

/**
 * Delete a chain by slug
 */
export async function deleteChain(slug: string): Promise<boolean> {
    const directus = createClient();
    const normalizedSlug = slug.toLowerCase();

    const chains = await directus.request(
        readItems('idea_chains' as any, {
            filter: { slug: { _eq: normalizedSlug } },
            fields: ['id'],
            limit: 1,
        } as any)
    ) as { id: number }[];

    if (!chains || chains.length === 0) {
        return false;
    }

    await directus.request(deleteItem('idea_chains' as any, chains[0].id));
    return true;
}

// ============ Node Operations ============

/**
 * Get nodes for a chain
 */
export async function getChainNodes(chainId: number): Promise<IdeaNodeWithSource[]> {
    const directus = createClient();

    const nodes = await directus.request(
        readItems('idea_nodes' as any, {
            filter: { chain_id: { _eq: chainId } },
            fields: NODE_FIELDS,
            sort: ['position', 'approximate_year'],
        } as any)
    ) as unknown as IdeaNode[];

    // Fetch source info
    const sourceIds = nodes.map(n => n.source_id).filter((id): id is number => id !== null);
    let sourcesMap: Record<number, { id: number; title: string; author_name: string | null; publication_year: number | null }> = {};

    if (sourceIds.length > 0) {
        const sources = await directus.request(
            readItems('sources' as any, {
                filter: { id: { _in: sourceIds } },
                fields: ['id', 'title', 'author_name', 'publication_year'],
            } as any)
        ) as typeof sourcesMap[number][];

        sourcesMap = sources.reduce((acc, s) => {
            acc[s.id] = s;
            return acc;
        }, {} as typeof sourcesMap);
    }

    return nodes.map(node => ({
        ...node,
        source: node.source_id ? sourcesMap[node.source_id] || null : null,
    }));
}

/**
 * Create a node in a chain
 */
export async function createNode(chainId: number, input: CreateIdeaNodeInput): Promise<IdeaNode> {
    const directus = createClient();

    // Get max position for this chain
    const existingNodes = await directus.request(
        readItems('idea_nodes' as any, {
            filter: { chain_id: { _eq: chainId } },
            fields: ['position'],
            sort: ['-position'],
            limit: 1,
        } as any)
    ) as { position: number | null }[];

    const maxPosition = existingNodes[0]?.position || 0;

    const node = await directus.request(
        createItem('idea_nodes' as any, {
            chain_id: chainId,
            source_id: input.source_id || null,
            citation_reference: input.citation_reference || null,
            quote_hebrew: input.quote_hebrew || null,
            quote_translated: input.quote_translated || null,
            external_url: input.external_url || null,
            contribution_type: input.contribution_type,
            contribution_summary: input.contribution_summary,
            contribution_summary_hebrew: input.contribution_summary_hebrew || null,
            base_idea_summary: input.base_idea_summary || null,
            approximate_year: input.approximate_year || null,
            position: input.position ?? maxPosition + 1,
            is_origin: input.is_origin || false,
        } as any)
    );

    const createdNode = node as unknown as IdeaNode;

    // Create links to parent nodes if specified
    if (input.parent_node_ids && input.parent_node_ids.length > 0) {
        for (const parentId of input.parent_node_ids) {
            await directus.request(
                createItem('idea_node_links' as any, {
                    parent_node_id: parentId,
                    child_node_id: createdNode.id,
                    relationship_type: 'builds_upon',
                } as any)
            );
        }
    }

    return createdNode;
}

/**
 * Update a node
 */
export async function updateNode(nodeId: number, updates: UpdateIdeaNodeInput): Promise<IdeaNode | null> {
    const directus = createClient();

    const updated = await directus.request(
        updateItem('idea_nodes' as any, nodeId, updates as any)
    );

    return updated as unknown as IdeaNode;
}

/**
 * Delete a node
 */
export async function deleteNode(nodeId: number): Promise<boolean> {
    const directus = createClient();

    await directus.request(deleteItem('idea_nodes' as any, nodeId));
    return true;
}

// ============ Link Operations ============

/**
 * Create a link between nodes
 */
export async function createLink(input: CreateIdeaNodeLinkInput): Promise<IdeaNodeLink> {
    const directus = createClient();

    const link = await directus.request(
        createItem('idea_node_links' as any, {
            parent_node_id: input.parent_node_id,
            child_node_id: input.child_node_id,
            relationship_type: input.relationship_type || 'builds_upon',
            relationship_note: input.relationship_note || null,
        } as any)
    );

    return link as unknown as IdeaNodeLink;
}

/**
 * Delete a link
 */
export async function deleteLink(linkId: number): Promise<boolean> {
    const directus = createClient();

    await directus.request(deleteItem('idea_node_links' as any, linkId));
    return true;
}

// ============ Topic Integration ============

/**
 * Get chains linked to a topic
 */
export async function getChainsForTopic(topicId: number): Promise<IdeaChainListItem[]> {
    const directus = createClient();

    const links = await directus.request(
        readItems('idea_chain_topics' as any, {
            filter: { topic_id: { _eq: topicId } },
            fields: ['chain_id', 'display_context', 'order_index'],
            sort: ['order_index'],
        } as any)
    ) as { chain_id: number; display_context: string | null; order_index: number }[];

    if (links.length === 0) {
        return [];
    }

    const chainIds = links.map(l => l.chain_id);

    const chains = await directus.request(
        readItems('idea_chains' as any, {
            filter: { id: { _in: chainIds } },
            fields: CHAIN_FIELDS,
        } as any)
    ) as unknown as IdeaChain[];

    // Get node counts
    const nodes = await directus.request(
        readItems('idea_nodes' as any, {
            filter: { chain_id: { _in: chainIds } },
            fields: ['id', 'chain_id'],
        } as any)
    ) as { id: number; chain_id: number }[];

    const nodeCounts = nodes.reduce((acc, n) => {
        acc[n.chain_id] = (acc[n.chain_id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    return chains.map(chain => ({
        id: chain.id,
        title: chain.title,
        title_hebrew: chain.title_hebrew,
        slug: chain.slug,
        description: chain.description,
        status: chain.status,
        is_featured: chain.is_featured,
        node_count: nodeCounts[chain.id] || 0,
        date_updated: chain.date_updated,
    }));
}

/**
 * Link a chain to a topic
 */
export async function linkChainToTopic(
    chainId: number,
    topicId: number,
    displayContext?: string,
    orderIndex?: number
): Promise<IdeaChainTopic> {
    const directus = createClient();

    // Get max order index for this topic
    const existingLinks = await directus.request(
        readItems('idea_chain_topics' as any, {
            filter: { topic_id: { _eq: topicId } },
            fields: ['order_index'],
            sort: ['-order_index'],
            limit: 1,
        } as any)
    ) as { order_index: number }[];

    const maxOrder = existingLinks[0]?.order_index ?? -1;

    const link = await directus.request(
        createItem('idea_chain_topics' as any, {
            chain_id: chainId,
            topic_id: topicId,
            display_context: displayContext || null,
            order_index: orderIndex ?? maxOrder + 1,
        } as any)
    );

    return link as unknown as IdeaChainTopic;
}

/**
 * Unlink a chain from a topic
 */
export async function unlinkChainFromTopic(chainId: number, topicId: number): Promise<boolean> {
    const directus = createClient();

    const links = await directus.request(
        readItems('idea_chain_topics' as any, {
            filter: {
                _and: [
                    { chain_id: { _eq: chainId } },
                    { topic_id: { _eq: topicId } },
                ]
            },
            fields: ['id'],
            limit: 1,
        } as any)
    ) as { id: number }[];

    if (links.length === 0) {
        return false;
    }

    await directus.request(deleteItem('idea_chain_topics' as any, links[0].id));
    return true;
}

/**
 * Generate a unique slug from a title
 */
export async function generateSlug(title: string): Promise<string> {
    const directus = createClient();

    // Convert to lowercase, replace spaces with hyphens, remove special chars
    let baseSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Check if slug exists
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await directus.request(
            readItems('idea_chains' as any, {
                filter: { slug: { _eq: slug } },
                fields: ['id'],
                limit: 1,
            } as any)
        ) as { id: number }[];

        if (existing.length === 0) {
            break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}
