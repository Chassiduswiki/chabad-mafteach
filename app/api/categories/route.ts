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
        // 1. Get all statement_topics to see which topics actually have content
        const statementTopics = await directus.request(
            readItems('statement_topics' as any, {
                fields: ['topic_id'],
                limit: -1,
            })
        ) as any[];

        const topicsWithContent = new Set(statementTopics.map(st => st.topic_id));

        // 2. Fetch all topics to count by type
        const topics = await directus.request(
            readItems('topics', {
                fields: ['id', 'topic_type'],
                limit: -1,
            })
        ) as any[];

        // 3. Count topics by type, only if they have content
        const topicCounts: Record<string, number> = {};
        let validTopicCount = 0;

        topics.forEach((topic) => {
            if (topic.topic_type && topicsWithContent.has(topic.id)) {
                topicCounts[topic.topic_type] = (topicCounts[topic.topic_type] || 0) + 1;
                validTopicCount++;
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
            totalTopics: validTopicCount,
            totalDocuments: documents.length,
        });
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return handleApiError(error);
    }
}
