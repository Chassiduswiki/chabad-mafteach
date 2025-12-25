import { NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems, aggregate } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

/**
 * GET /api/categories
 * Returns available categories with counts for topics and documents
 * Only returns categories that have at least one item
 */
export async function GET() {
    try {
        // Fetch all topics to count by type
        const topics = await directus.request(
            readItems('topics', {
                fields: ['topic_type'],
                limit: -1, // Get all
            })
        ) as any[];

        // Count topics by type
        const topicCounts: Record<string, number> = {};
        topics.forEach((topic) => {
            if (topic.topic_type) {
                topicCounts[topic.topic_type] = (topicCounts[topic.topic_type] || 0) + 1;
            }
        });

        // Fetch all documents to count by category
        const documents = await directus.request(
            readItems('documents', {
                fields: ['category', 'doc_type'],
                filter: {
                    status: { _eq: 'published' }
                },
                limit: -1,
            })
        ) as any[];

        // Count documents by category
        const documentCounts: Record<string, number> = {};
        documents.forEach((doc) => {
            if (doc.category) {
                documentCounts[doc.category] = (documentCounts[doc.category] || 0) + 1;
            }
        });

        // Also count by doc_type for fallback
        const docTypeCounts: Record<string, number> = {};
        documents.forEach((doc) => {
            if (doc.doc_type) {
                docTypeCounts[doc.doc_type] = (docTypeCounts[doc.doc_type] || 0) + 1;
            }
        });

        return NextResponse.json({
            topics: topicCounts,
            documents: documentCounts,
            docTypes: docTypeCounts,
            totalTopics: topics.length,
            totalDocuments: documents.length,
        });
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return handleApiError(error);
    }
}
