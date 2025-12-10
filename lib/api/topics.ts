import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * Get topic by slug with associated content
 *
 * DATA FLOW:
 * 1. Fetch topic by slug
 * 2. PRIMARY: Get documents linked via document.topic field
 * 3. Get paragraphs from those documents
 * 4. Get statements from those paragraphs
 * 5. SECONDARY: Add statement_topics for additional sources
 *
 * @param slug Topic slug
 * @returns Topic with paragraphs containing statements
 */
export async function getTopicBySlug(slug: string) {
    try {
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
        let paragraphs: any[] = [];
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

                // Get paragraphs from these documents
                const docIds = topicDocuments.map(doc => doc.id);
                const documentParagraphs = await directus.request(readItems('paragraphs', {
                    filter: { doc_id: { _in: docIds } } as any,
                    fields: ['id', 'text', 'order_key', 'doc_id'],
                    sort: ['order_key'],
                    limit: -1
                })) as any[];

                console.log(`Found ${documentParagraphs.length} paragraphs across ${docIds.length} documents`);

                // Get statements for these paragraphs
                const paraIds = documentParagraphs.map(p => p.id);
                let documentStatements: any[] = [];

                if (paraIds.length > 0) {
                    documentStatements = await directus.request(readItems('statements', {
                        filter: { paragraph_id: { _in: paraIds } } as any,
                        fields: ['id', 'text', 'order_key', 'paragraph_id'],
                        sort: ['order_key'],
                        limit: -1
                    })) as any[];
                }

                console.log(`Found ${documentStatements.length} statements across ${paraIds.length} paragraphs`);

                // Group statements by paragraph
                const paragraphMap: Record<number, any> = {};
                for (const para of documentParagraphs) {
                    paragraphMap[para.id] = {
                        id: para.id,
                        text: para.text,
                        order_key: para.order_key,
                        document_title: topicDocuments.find(doc => doc.id === para.doc_id)?.title || 'Unknown Document',
                        statements: [] as any[]
                    };
                }

                // Add statements to their paragraphs
                for (const stmt of documentStatements) {
                    if (stmt.paragraph_id && paragraphMap[stmt.paragraph_id]) {
                        paragraphMap[stmt.paragraph_id].statements.push({
                            id: stmt.id,
                            text: stmt.text,
                            order_key: stmt.order_key
                        });
                    }
                }

                paragraphs = Object.values(paragraphMap).sort((a, b) =>
                    (a.order_key || '').localeCompare(b.order_key || '')
                );
            }

            // SECONDARY: Get additional statement_topics for sources/citations
            // Filter out orphaned records where statement doesn't exist
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
                                paragraph_id: [
                                    'id',
                                    'text',
                                    'order_key',
                                    { doc_id: ['title'] }
                                ]
                            }
                        ]
                    }
                ] as any,
                sort: ['-relevance_score'] as any
            })) as any[];

            console.log(`Found ${statementTopics.length} statement_topics records for topic ${topic.id}`);

            // Process statement_topics for additional sources (skip if already in main content)
            const existingStmtIds = new Set(paragraphs.flatMap(p => p.statements.map((s: any) => s.id)));

            for (const stmtTopic of statementTopics) {
                const stmt = stmtTopic.statement_id;
                if (!stmt?.id || existingStmtIds.has(stmt.id)) continue; // Skip if already included

                const para = stmt.paragraph_id;
                if (!para?.id || !para.doc_id?.title) continue; // Skip if paragraph or document missing

                // Additional validation: ensure statement has valid text
                if (!stmt.text || stmt.text.trim() === '') continue;

                // Add as additional source
                validStatementTopics.push(stmtTopic);
            }

            console.log(`After filtering, ${validStatementTopics.length} valid statement_topics remain`);
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
        } catch (error) {
            console.warn('Failed to fetch topic_relationships:', error);
        }

        return {
            topic: {
                ...topic,
                paragraphs
            },
            citations: validStatementTopics,
            relatedTopics
        };
    } catch (error) {
        console.error('Topic fetch error:', error);
        throw error;
    }
}
