import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Fetch the topic by slug
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: slug }
            },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topic = topics[0];

        // Fetch related statements from statement_topics junction table
        let statementTopics: any[] = [];
        try {
            statementTopics = await directus.request(readItems('statement_topics', {
                filter: { topic_id: { _eq: topic.id } } as any,
                fields: ['*', { statement_id: ['id', 'text', 'order_key'] }] as any,
                sort: ['-relevance_score'] as any
            })) as any[];
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

        return NextResponse.json({
            topic,
            citations: statementTopics, // Map to citations for backward compatibility
            relatedTopics
        });
    } catch (error) {
        console.error('Topic fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic' },
            { status: 500 }
        );
    }
}
