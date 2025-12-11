import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';

/**
 * Get topic by slug with associated content
 *
 * DATA FLOW:
 * 1. Fetch topic by slug
 * 2. PRIMARY: Get documents linked via document.topic field
 * 3. Get content_blocks from those documents **[UPDATED]**
 * 4. Get statements from those content_blocks **[UPDATED]**
 * 5. SECONDARY: Add statement_topics for additional sources
 *
 * @param slug Topic slug
 * @returns Topic with content_blocks containing statements **[UPDATED]**
 */
export async function getTopicBySlug(slug: string) {
    try {
        const directus = createClient();

        // Fetch the topic by slug
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: slug }
            },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        const topic = topics[0];

        // use document.topic field for entry content (primary approach for articles)
        let contentBlocks: any[] = []; // **[RENAMED]** from paragraphs
        let validStatementTopics: any[] = []; // For sources/citations tab
        try {
            // PRIMARY: Get documents directly linked to this topic
            const topicDocuments = await directus.request(readItems('documents', {
                filter: { topic: { _eq: topic.id } } as any,
                fields: ['id', 'title', 'doc_type'],
                limit: -1
            })) as any[];

            console.log(`Topic ${topic.id} (${topic.canonical_title}): Found ${topicDocuments.length} linked documents`);

            if (topicDocuments.length > 0) {

                // Get content_blocks from these documents **[UPDATED]**
                const docIds = topicDocuments.map(doc => doc.id);
                const documentContentBlocks = await directus.request(readItems('content_blocks' as any, { // **[CHANGED]** from 'paragraphs'
                    filter: { document_id: { _in: docIds } } as any, // **[CHANGED]** from doc_id
                    fields: ['id', 'content', 'order_key', 'document_id', 'block_type'], // **[CHANGED]** from text, doc_id
                    sort: ['order_key'],
                    limit: -1
                })) as any[];

                console.log(`Found ${documentContentBlocks.length} content_blocks across ${docIds.length} documents`); // **[UPDATED]**

                // Get statements for these content_blocks **[UPDATED]**
                const blockIds = documentContentBlocks.map(cb => cb.id);
                let documentStatements: any[] = [];

                if (blockIds.length > 0) {
                    documentStatements = await directus.request(readItems('statements', {
                        filter: { block_id: { _in: blockIds } } as any, // **[CHANGED]** from paragraph_id
                        fields: ['id', 'text', 'order_key', 'block_id'], // **[CHANGED]** from paragraph_id
                        sort: ['order_key'],
                        limit: -1
                    })) as any[];
                }

                console.log(`Found ${documentStatements.length} statements across ${blockIds.length} content_blocks`); // **[UPDATED]**

                // Group statements by content_block **[UPDATED]**
                const contentBlockMap: Record<number, any> = {}; // **[RENAMED]** from paragraphMap
                for (const block of documentContentBlocks) { // **[RENAMED]** from para
                    contentBlockMap[block.id] = {
                        id: block.id,
                        content: block.content, // **[CHANGED]** from text
                        order_key: block.order_key,
                        block_type: block.block_type, // **[NEW]**
                        document_title: topicDocuments.find(doc => doc.id === block.document_id)?.title || 'Unknown Document', // **[CHANGED]** from doc_id
                        statements: [] as any[]
                    };
                }

                // Add statements to their content_blocks **[UPDATED]**
                for (const stmt of documentStatements) {
                    if (stmt.block_id && contentBlockMap[stmt.block_id]) { // **[CHANGED]** from paragraph_id
                        contentBlockMap[stmt.block_id].statements.push({
                            id: stmt.id,
                            text: stmt.text,
                            order_key: stmt.order_key
                        });
                    }
                }

                contentBlocks = Object.values(contentBlockMap).sort((a, b) => // **[RENAMED]** from paragraphs
                    (a.order_key || '').localeCompare(b.order_key || '')
                );
            }

            // SECONDARY: Get additional statement_topics for sources/citations
            // Filter out orphaned records where statement doesn't exist
            try {
                const statementTopics = await directus.request(readItems('statement_topics', {
                    filter: {
                        topic_id: { _eq: topic.id },
                        statement_id: { _nnull: true } // Only include records where statement_id exists
                    } as any,
                    fields: [
                        '*',
                        {
                            statement_id: [
                                'id',
                                'text',
                                'order_key',
                                {
                                    block_id: [ // **[CHANGED]** from paragraph_id
                                        'id',
                                        'content', // **[CHANGED]** from text
                                        'order_key',
                                        { document_id: ['title'] } // **[CHANGED]** from doc_id
                                    ]
                                }
                            ]
                        }
                    ] as any,
                    sort: ['-relevance_score'] as any
                })) as any[];

                console.log(`Found ${statementTopics.length} statement_topics records for topic ${topic.id}`);

                // Process statement_topics for additional sources (skip if already in main content)
                const existingStmtIds = new Set(contentBlocks.flatMap(cb => cb.statements.map((s: any) => s.id))); // **[CHANGED]** from paragraphs

                for (const stmtTopic of statementTopics) {
                    const stmt = stmtTopic.statement_id;
                    if (!stmt?.id || existingStmtIds.has(stmt.id)) continue; // Skip if already included

                    const block = stmt.block_id; // **[CHANGED]** from para (paragraph_id)
                    if (!block?.id || !block.document_id?.title) continue; // **[CHANGED]** from para?.id || !para.doc_id?.title - Skip if content_block or document missing

                    // Additional validation: ensure statement has valid text
                    if (!stmt.text || stmt.text.trim() === '') continue;

                    // Add as additional source
                    validStatementTopics.push(stmtTopic);
                }

                console.log(`After filtering, ${validStatementTopics.length} valid statement_topics remain`);
            } catch (statementTopicsError) {
                console.warn('Failed to fetch statement_topics (likely permissions issue):', (statementTopicsError as any)?.message || statementTopicsError);
                // Continue without statement_topics data - this is not critical
            }
        } catch (error) {
            console.warn('Failed to fetch topic content:', error);
        }

        // Fetch related topics from topic_relationships table
        let relatedTopics: any[] = [];
        try {
            // Get relationships where this topic is the parent
            const parentRelationships = await directus.request(readItems('topic_relationships', {
                filter: { parent_topic_id: { _eq: topic.id } } as any,
                fields: ['*', { child_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Get relationships where this topic is the child
            const childRelationships = await directus.request(readItems('topic_relationships', {
                filter: { child_topic_id: { _eq: topic.id } } as any,
                fields: ['*', { parent_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Combine and map to consistent format
            const parentTopics = parentRelationships.map(rel => ({
                ...rel.child_topic_id,
                relationship: {
                    type: rel.relation_type,
                    strength: rel.strength,
                    description: rel.description,
                    direction: 'child' // This topic is parent, related is child
                }
            }));

            const childTopics = childRelationships.map(rel => ({
                ...rel.parent_topic_id,
                relationship: {
                    type: rel.relation_type,
                    strength: rel.strength,
                    description: rel.description,
                    direction: 'parent' // This topic is child, related is parent
                }
            }));

            relatedTopics = [...parentTopics, ...childTopics];
        } catch (relationshipsError) {
            console.warn('Failed to fetch topic_relationships (likely permissions issue):', (relationshipsError as any)?.message || relationshipsError);
            // Continue without related topics - this is not critical
        }

        // Get sources for the statements
        let sources: any[] = [];
        try {
            // Get all statement IDs
            const allStatementIds = contentBlocks.flatMap(cb => cb.statements.map((s: any) => s.id)); // **[CHANGED]** from paragraphs
            const validStatementIds = new Set(allStatementIds);
            if (allStatementIds.length > 0) {
                // Get source_links for these statements
                const sourceLinks = await directus.request(readItems('source_links', {
                    filter: { statement_id: { _in: allStatementIds } } as any,
                    fields: ['id', 'statement_id', 'source_id', 'relationship_type', 'page_number', 'verse_reference']
                })) as any[];

                if (sourceLinks.length > 0) {
                    // Get unique source IDs
                    const sourceIds = Array.from(new Set(sourceLinks.map(sl => sl.source_id)));
                    
                    // Fetch sources
                    const sourcesData = await directus.request(readItems('sources', {
                        filter: { id: { _in: sourceIds } } as any,
                        fields: ['id', 'title', 'external_url']
                    })) as any[];

                    // Attach relationship info to sources
                    sources = sourcesData.map((source: any) => {
                        const links = sourceLinks.filter(sl => sl.source_id === source.id);
                        return {
                            ...source,
                            relationships: links.map(link => ({
                                statement_id: link.statement_id,
                                relationship_type: link.relationship_type,
                                page_number: link.page_number,
                                verse_reference: link.verse_reference
                            }))
                        };
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching sources:', error);
            // Continue without sources
        }

        return {
            topic: {
                ...topic,
                contentBlocks // **[CHANGED]** from paragraphs
            },
            citations: validStatementTopics,
            relatedTopics,
            sources
        };
    } catch (error) {
        console.error('Topic fetch error:', error);
        throw error;
    }
}

/**
 * Update topic by slug
 *
 * @param slug Topic slug
 * @param updates Partial topic data to update
 * @returns Updated topic or null if not found
 */
export async function updateTopic(slug: string, updates: any) {
    try {
        const directus = createClient();

        // First get the topic by slug to get its ID
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: slug }
            },
            fields: ['id'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        const topicId = topics[0].id;

        // Update the topic
        const updatedTopic = await directus.request(updateItem('topics', topicId, updates));

        return updatedTopic;
    } catch (error) {
        console.error('Topic update error:', error);
        throw error;
    }
}

export async function getTopicMetadata(slug: string) {
    try {
        const directus = createClient();

        // Fetch just the topic by slug
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: slug }
            },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        return topics[0];
    } catch (error) {
        console.error('Topic metadata fetch error:', error);
        throw error;
    }
}
