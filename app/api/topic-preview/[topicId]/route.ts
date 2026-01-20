import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * GET /api/topic-preview/[topicId]
 * Returns preview data for a topic including top statement excerpts
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ topicId: string }> }
) {
    try {
        const { topicId } = await params;
        const directus = createClient();

        // Get statement_topics for this topic, ordered by relevance
        const statementTopics = await directus.request(readItems('statement_topics', {
            filter: { topic_id: { _eq: parseInt(topicId) } } as any,
            fields: ['statement_id', 'relevance_score', 'is_primary'],
            sort: ['-relevance_score'] as any,
            limit: 3 // Get top 3 most relevant statements
        })) as any[];

        if (statementTopics.length === 0) {
            return NextResponse.json({
                topicId: parseInt(topicId),
                excerpts: [],
                totalStatements: 0
            });
        }

        const statementIds = statementTopics.map(st => st.statement_id);

        // Get the actual statements
        const statements = await directus.request(readItems('statements', {
            filter: { id: { _in: statementIds } } as any,
            fields: ['id', 'text', 'order_key'],
            limit: -1
        })) as any[];

        // Create excerpts from statements
        const excerpts = statements.slice(0, 3).map(stmt => ({
            id: stmt.id,
            text: stmt.text.length > 150 ? stmt.text.substring(0, 150) + '...' : stmt.text,
            relevance_score: statementTopics.find(st => st.statement_id === stmt.id)?.relevance_score || 0
        }));

        return NextResponse.json({
            topicId: parseInt(topicId),
            excerpts,
            totalStatements: statementTopics.length
        });

    } catch (error) {
        console.error('Topic preview error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic preview' },
            { status: 500 }
        );
    }
}
