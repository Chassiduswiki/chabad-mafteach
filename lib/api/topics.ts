import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

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

        // Fetch related statements from statement_topics junction table
        let statementTopics: any[] = [];
        let paragraphs: any[] = [];
        let validStatementTopics: any[] = []; // Filtered to only include valid references
        try {
            statementTopics = await directus.request(readItems('statement_topics', {
                filter: { topic_id: { _eq: topic.id } } as any,
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

            // If Directus didn't expand the relations (IDs only), fetch the statements with paragraphs/docs
            const missingExpanded = statementTopics.some(st => typeof st.statement_id === 'number');
            let statementMap: Record<number, any> = {};

            if (missingExpanded) {
                const statementIds = statementTopics
                    .map(st => (typeof st.statement_id === 'number' ? st.statement_id : st.statement_id?.id))
                    .filter((id): id is number => !!id);

                if (statementIds.length) {
                    const statementRecords = await directus.request(readItems('statements', {
                        filter: { id: { _in: statementIds } } as any,
                        fields: [
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
                        ] as any,
                        limit: -1
                    })) as any[];

                    statementMap = statementRecords.reduce((acc, stmt) => {
                        acc[stmt.id] = stmt;
                        return acc;
                    }, {} as Record<number, any>);
                }
            }

            // Map statements to their paragraphs (document > paragraphs > statements)
            const paragraphMap: Record<number, any> = {};
            for (const stmtTopic of statementTopics) {
                const stmt = typeof stmtTopic.statement_id === 'number'
                    ? statementMap[stmtTopic.statement_id]
                    : stmtTopic.statement_id;

                // Skip orphaned records (statements that don't exist)
                if (!stmt?.id) {
                    console.warn(`Skipping orphaned statement_topics record ${stmtTopic.id} - statement ${stmtTopic.statement_id} not found`);
                    continue;
                }

                const para = stmt?.paragraph_id;
                if (!para?.id) continue;

                // Add to valid statement topics list
                validStatementTopics.push(stmtTopic);

                if (!paragraphMap[para.id]) {
                    paragraphMap[para.id] = {
                        id: para.id,
                        text: para.text,
                        order_key: para.order_key,
                        document_title: para.doc_id?.title || 'Unknown Document',
                        statements: [] as any[]
                    };
                }

                paragraphMap[para.id].statements.push({
                    id: stmt.id,
                    text: stmt.text,
                    order_key: stmt.order_key
                });
            }

            paragraphs = Object.values(paragraphMap).sort((a, b) =>
                (a.order_key || '').localeCompare(b.order_key || '')
            );
        } catch (error) {
            console.warn('Failed to fetch statement_topics:', error);
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
