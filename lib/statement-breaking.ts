import directus from '@/lib/directus';
import { createItem, readItems, deleteItem } from '@directus/sdk';

export interface StatementSegment {
  text: string;
  confidence: number;
  originalParagraphId: number;
}

/**
 * Breaks a paragraph into individual statements based on sentence boundaries
 */
export function breakParagraphIntoStatements(paragraphText: string): StatementSegment[] {
  if (!paragraphText.trim()) return [];

  // Hebrew/English sentence boundary patterns
  const sentencePatterns = [
    // Hebrew patterns
    /(?<=[.!?])\s+(?=\p{L}[\p{L}\s]*[\u0590-\u05FF])/u,  // After punctuation followed by Hebrew letters
    /(?<=\S[.!?])\s+(?=\p{L})/u,  // After punctuation followed by any letter
    // English patterns
    /(?<=\w[.!?])\s+(?=\w)/,  // Standard sentence boundaries
    // Common Hebrew abbreviations that shouldn't break
    // Add more patterns as needed
  ];

  let segments = [paragraphText.trim()];
  let confidence = 1.0;

  // Apply sentence splitting with decreasing confidence for each pattern
  sentencePatterns.forEach((pattern, index) => {
    const newSegments: string[] = [];
    const confidenceDecrease = (index + 1) * 0.1; // Each pattern is less reliable

    segments.forEach(segment => {
      if (segment.length > 200) { // Only split longer segments
        const parts = segment.split(pattern);
        if (parts.length > 1) {
          newSegments.push(...parts.filter(p => p.trim().length > 0));
          confidence = Math.max(0.3, confidence - confidenceDecrease);
        } else {
          newSegments.push(segment);
        }
      } else {
        newSegments.push(segment);
      }
    });

    segments = newSegments;
  });

  // Clean up segments
  const cleanSegments = segments
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => ({
      text: s,
      confidence,
      originalParagraphId: 0 // Will be set when called
    }));

  return cleanSegments;
}

/**
 * Processes all paragraphs in a document and creates statement entries
 */
export async function breakDocumentIntoStatements(documentId: number): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const result = {
    created: 0,
    updated: 0,
    errors: [] as string[]
  };

  try {
    // Get all paragraphs for this document
    const paragraphs = await directus.request(readItems('paragraphs', {
      filter: {
        doc_id: {
          _eq: documentId
        }
      },
      fields: ['id', 'text', 'order_key']
    }));

    console.log(`Processing ${paragraphs.length} paragraphs for document ${documentId}`);

    for (const paragraph of paragraphs) {
      try {
        const statements = breakParagraphIntoStatements(paragraph.text);

        // Delete existing statements for this paragraph
        const existingStatements = await directus.request(readItems('statements', {
          filter: {
            paragraph_id: {
              _eq: paragraph.id
            }
          },
          fields: ['id']
        }));

        for (const stmt of existingStatements) {
          await directus.request(deleteItem('statements', stmt.id));
        }

        result.updated += existingStatements.length;

        // Create new statements
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          await directus.request(createItem('statements', {
            paragraph_id: paragraph.id,
            text: statement.text,
            order_key: i.toString(),
            metadata: {
              auto_generated: true,
              confidence: statement.confidence,
              source: 'statement_breaking'
            }
          }));
          result.created++;
        }

      } catch (error) {
        console.error(`Error processing paragraph ${paragraph.id}:`, error);
        result.errors.push(`Failed to process paragraph ${paragraph.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Statement breaking complete: ${result.created} created, ${result.updated} updated`);

  } catch (error) {
    console.error('Error in breakDocumentIntoStatements:', error);
    result.errors.push(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
