import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem, deleteItem, createItem } from '@directus/sdk';

/**
 * PATCH /api/topics/bulk
 * 
 * Bulk update multiple topics at once
 * 
 * @body {
 *   topicIds: number[];
 *   updates: Partial<Topic>;
 * }
 * 
 * @example
 * PATCH /api/topics/bulk
 * {
 *   "topicIds": [1, 2, 3],
 *   "updates": { "topic_type": "concept" }
 * }
 */
export async function PATCH(request: NextRequest) {
    try {
        const { topicIds, updates } = await request.json();

        if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
            return NextResponse.json(
                { error: 'topicIds array is required' },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { error: 'updates object is required' },
                { status: 400 }
            );
        }

        const directus = createClient();
        const results = [];
        const errors = [];

        // Update each topic
        for (const topicId of topicIds) {
            try {
                // @ts-ignore - Directus SDK type strictness workaround
                const updated = await directus.request(updateItem('topics' as any, topicId, updates));
                results.push({ id: topicId, status: 'success', data: updated });
            } catch (error: any) {
                errors.push({ id: topicId, status: 'error', message: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            updated: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        console.error('Bulk update error:', error);
        return NextResponse.json(
            { error: 'Failed to bulk update topics', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/topics/bulk
 * 
 * Bulk delete multiple topics at once
 * 
 * @body {
 *   topicIds: number[];
 * }
 * 
 * @example
 * DELETE /api/topics/bulk
 * {
 *   "topicIds": [1, 2, 3]
 * }
 */
export async function DELETE(request: NextRequest) {
    try {
        const { topicIds } = await request.json();

        if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
            return NextResponse.json(
                { error: 'topicIds array is required' },
                { status: 400 }
            );
        }

        const directus = createClient();
        const results = [];
        const errors = [];

        // Delete each topic
        for (const topicId of topicIds) {
            try {
                // @ts-ignore - Directus SDK type strictness workaround
                await directus.request(deleteItem('topics' as any, topicId));
                results.push({ id: topicId, status: 'success' });
            } catch (error: any) {
                errors.push({ id: topicId, status: 'error', message: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            deleted: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        console.error('Bulk delete error:', error);
        return NextResponse.json(
            { error: 'Failed to bulk delete topics', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/topics/bulk
 * 
 * Bulk tag - create relationships between multiple topics
 * 
 * @body {
 *   topicIds: number[];
 *   relatedTopicId: number;
 *   relationType: string;
 *   description?: string;
 * }
 * 
 * @example
 * POST /api/topics/bulk
 * {
 *   "topicIds": [1, 2, 3],
 *   "relatedTopicId": 5,
 *   "relationType": "related",
 *   "description": "All related to Tzadik"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const { topicIds, relatedTopicId, relationType, description } = await request.json();

        if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
            return NextResponse.json(
                { error: 'topicIds array is required' },
                { status: 400 }
            );
        }

        if (!relatedTopicId) {
            return NextResponse.json(
                { error: 'relatedTopicId is required' },
                { status: 400 }
            );
        }

        if (!relationType) {
            return NextResponse.json(
                { error: 'relationType is required' },
                { status: 400 }
            );
        }

        const directus = createClient();
        const results = [];
        const errors = [];

        // Create relationship for each topic
        for (const topicId of topicIds) {
            try {
                // @ts-ignore - Directus SDK type strictness workaround
                const relationship = await directus.request(createItem('topic_relationships' as any, {
                    topic_id: topicId,
                    related_topic_id: relatedTopicId,
                    relationship_type: relationType,
                    description: description || null
                }));
                results.push({ topicId, status: 'success', relationship });
            } catch (error: any) {
                errors.push({ topicId, status: 'error', message: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            created: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        console.error('Bulk tag error:', error);
        return NextResponse.json(
            { error: 'Failed to bulk tag topics', details: error.message },
            { status: 500 }
        );
    }
}
