import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

const directus = createClient();

export async function GET() {
  try {
    // Get all topics with CMS status fields
    const topics = await directus.request(readItems('topics', {
      fields: [
        'id', 
        'canonical_title', 
        'slug', 
        'content_status',
        'status_label',
        'badge_color',
        'sources_count',
        'documents_count'
      ],
      limit: -1,
    })) as any[];

    // Get actual statement counts for cross-reference
    const actualCounts = await Promise.all(
      topics.map(async (topic) => {
        try {
          const statementCount = await directus.request(readItems('statement_topics', {
            fields: ['id'],
            filter: { topic_id: { _eq: topic.id } },
            limit: -1,
          }));

          const statementsWithDocuments = await directus.request(readItems('statement_topics', {
            fields: ['statement_id'],
            filter: { topic_id: { _eq: topic.id } },
            limit: -1,
          })) as any[];

          const statementIds = statementsWithDocuments.map(st => st.statement_id).filter(Boolean);
          
          let documentCount = 0;
          if (statementIds.length > 0) {
            const statements = await directus.request(readItems('statements', {
              fields: ['paragraph_id'],
              filter: { id: { _in: statementIds } },
              limit: -1,
            })) as any[];

            const paragraphIds = statements.map(s => s.paragraph_id).filter(Boolean);
            if (paragraphIds.length > 0) {
              const documents = await directus.request(readItems('paragraphs', {
                fields: ['doc_id'],
                filter: { id: { _in: paragraphIds } },
                limit: -1,
              })) as any[];

              documentCount = new Set(documents.map(d => d.doc_id)).size;
            }
          }

          return {
            actualStatementCount: statementCount.length,
            actualDocumentCount: documentCount,
          };
        } catch (error) {
          console.error(`Error getting counts for topic ${topic.id}:`, error);
          return {
            actualStatementCount: 0,
            actualDocumentCount: 0,
          };
        }
      })
    );

    // Combine CMS data with actual counts
    const topicsWithCounts = topics.map((topic, index) => {
      const actual = actualCounts[index];
      
      // Use CMS values if set, otherwise fall back to actual counts
      const statementCount = topic.sources_count > 0 ? topic.sources_count : actual.actualStatementCount;
      const documentCount = topic.documents_count > 0 ? topic.documents_count : actual.actualDocumentCount;
      
      // Use CMS status if set, otherwise calculate based on counts
      let status: 'comprehensive' | 'partial' | 'minimal' = 'minimal';
      if (topic.content_status) {
        status = topic.content_status;
      } else if (statementCount >= 5 && documentCount >= 2) {
        status = 'comprehensive';
      } else if (statementCount >= 2 && documentCount >= 1) {
        status = 'partial';
      }

      return {
        id: topic.id,
        statementCount,
        documentCount,
        status,
        // Include CMS values for UI
        statusLabel: topic.status_label || null,
        badgeColor: topic.badge_color || null,
      };
    });

    return Response.json({ topics: topicsWithCounts });
  } catch (error) {
    console.error('Error in topic-content-counts API:', error);
    return Response.json({ error: 'Failed to fetch topic content counts' }, { status: 500 });
  }
}
