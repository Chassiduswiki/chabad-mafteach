import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * GET /api/topics/stats
 * Returns content statistics for multiple topics
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const topicIdsParam = searchParams.get('ids');
        const directus = createClient();

        let filter: any = {};
        if (topicIdsParam) {
            const ids = topicIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (ids.length > 0) {
                filter.topic_id = { _in: ids };
            }
        }

        // Get all statement_topics mappings
        // We might want to aggregate this in the future, but for now we fetch and count
        const mappings = await directus.request(readItems('statement_topics' as any, {
            filter,
            fields: ['topic_id', 'statement_id'],
            limit: -1
        })) as any[];

        // Aggregate counts by topic_id
        const stats: Record<number, { statementCount: number; status: string }> = {};

        mappings.forEach(m => {
            const tid = m.topic_id;
            if (!stats[tid]) {
                stats[tid] = { statementCount: 0, status: 'minimal' };
            }
            stats[tid].statementCount++;
        });

        // Determine status based on counts
        Object.keys(stats).forEach(id => {
            const tid = parseInt(id);
            const count = stats[tid].statementCount;
            if (count >= 10) {
                stats[tid].status = 'comprehensive';
            } else if (count >= 3) {
                stats[tid].status = 'partial';
            } else {
                stats[tid].status = 'minimal';
            }
        });

        return NextResponse.json({ stats });

    } catch (error) {
        console.error('Topic stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic statistics' },
            { status: 500 }
        );
    }
}
