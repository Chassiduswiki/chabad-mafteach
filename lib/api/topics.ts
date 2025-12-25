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
            try {
                const statementTopics = await directus.request(readItems('statement_topics', {
                    filter: {
                        topic_id: { _eq: topic.id }
                    } as any,
                    fields: ['statement_id', 'relevance_score', 'is_primary'],
                    sort: ['-relevance_score'] as any,
                    limit: -1
                })) as any[];

                console.log(`Found ${statementTopics.length} statement_topics records for topic ${topic.id}`);

                if (statementTopics.length > 0) {
                    const statementIds = Array.from(new Set(statementTopics.map(st => st.statement_id).filter(id => !!id)));

                    if (statementIds.length > 0) {
                        // Fetch the actual statements
                        const citationStatements = await directus.request(readItems('statements', {
                            filter: { id: { _in: statementIds } } as any,
                            fields: ['id', 'text', 'appended_text', 'block_id', 'order_key'],
                            limit: -1
                        })) as any[];

                        console.log(`Fetched ${citationStatements.length} statements for citations`);

                        // Fetch blocks and documents for these statements
                        const blockIds = Array.from(new Set(citationStatements.map(s => s.block_id).filter(id => !!id)));
                        if (blockIds.length > 0) {
                            const blocks = await directus.request(readItems('content_blocks' as any, {
                                filter: { id: { _in: blockIds } } as any,
                                fields: ['id', 'document_id', 'order_key'],
                                limit: -1
                            })) as any[];

                            const docIds = Array.from(new Set(blocks.map(b => b.document_id).filter(id => !!id)));
                            if (docIds.length > 0) {
                                const docs = await directus.request(readItems('documents', {
                                    filter: { id: { _in: docIds } } as any,
                                    fields: ['id', 'title', 'doc_type'],
                                    limit: -1
                                })) as any[];

                                // Map everything together
                                validStatementTopics = citationStatements.map(stmt => {
                                    const block = blocks.find(b => b.id === stmt.block_id);
                                    const doc = block ? docs.find(d => d.id === block.document_id) : null;
                                    const stRecord = statementTopics.find(st => st.statement_id === stmt.id);

                                    return {
                                        id: stmt.id,
                                        text: stmt.text,
                                        appended_text: stmt.appended_text,
                                        document_title: doc?.title || 'Unknown Source',
                                        document_id: doc?.id,
                                        document_type: doc?.doc_type,
                                        order_key: stmt.order_key,
                                        relevance_score: stRecord?.relevance_score,
                                        is_primary: stRecord?.is_primary
                                    };
                                });
                            }
                        }
                    }
                }
                console.log(`Processed ${validStatementTopics.length} enriched citations`);
            } catch (statementTopicsError) {
                console.warn('Failed to fetch enriched citations:', (statementTopicsError as any)?.message || statementTopicsError);
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
            console.log('Fetching sources for', allStatementIds.length, 'statement IDs');
            if (allStatementIds.length > 0) {
                // Get source_links for these statements
                console.log('Fetching source_links...');
                const sourceLinks = await directus.request(readItems('source_links', {
                    filter: { statement_id: { _in: allStatementIds } } as any,
                    fields: ['id', 'statement_id', 'source_id', 'relationship_type', 'page_number', 'verse_reference']
                })) as any[];

                console.log('Found', sourceLinks.length, 'source links');

                if (sourceLinks.length > 0) {
                    // Get unique source IDs
                    const sourceIds = Array.from(new Set(sourceLinks.map(sl => sl.source_id)));
                    console.log('Fetching', sourceIds.length, 'unique sources:', sourceIds);

                    // Fetch sources
                    console.log('Fetching sources data...');
                    const sourcesData = await directus.request(readItems('sources', {
                        filter: { id: { _in: sourceIds } } as any,
                        fields: ['id', 'title', 'external_url']
                    })) as any[];

                    console.log('Found', sourcesData.length, 'sources');

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
                    console.log('Attached relationships to', sources.length, 'sources');
                }
            }
        } catch (error) {
            console.error('Error fetching sources:', error);
            console.error('Error details:', {
                message: (error as any)?.message,
                code: (error as any)?.code,
                response: (error as any)?.response?.data,
                status: (error as any)?.response?.status,
                stack: (error as any)?.stack
            });
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
