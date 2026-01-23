import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem } from '@directus/sdk';
import { extractCitationReferences, CitationReference } from '@/lib/citation-utils';

/**
 * API route to extract citation references from content and save them to the source_links table
 * POST /api/citations/extract
 */
export async function POST(req: NextRequest) {
  try {
    const { content, topicId } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content parameter' },
        { status: 400 }
      );
    }

    // Extract citation references from content
    const citations = extractCitationReferences(content);
    
    if (citations.length === 0) {
      return NextResponse.json(
        { message: 'No citations found in content', citations: [] },
        { status: 200 }
      );
    }

    // Process each citation and save to the source_links table
    const directus = createClient();
    const savedCitations: any[] = [];

    // Process citations in sequence to avoid race conditions
    for (const citation of citations) {
      try {
        // Check if the source exists
        if (!citation.sourceId) {
          console.warn(`Citation ${citation.id} has no source ID, skipping`);
          continue;
        }

        // Create or update the source_link
        const sourceLinkData = {
          source_id: citation.sourceId,
          topic_id: topicId || null, // Optional: link to topic if provided
          statement_id: null, // For now, we're handling topic-level citations
          relationship_type: 'references', 
          page_number: citation.pageNumber || '',
          section_reference: citation.reference || '',
          verse_reference: citation.verseNumber || '',
          citation_id: citation.id, // Store the citation ID for future reference
          notes: `Generated from citation reference ${citation.id}`
        };

        // Create the source_link
        const savedSourceLink = await directus.request(
          createItem('source_links', sourceLinkData)
        );

        savedCitations.push({
          citationId: citation.id,
          sourceLinkId: savedSourceLink.id
        });
      } catch (citationError) {
        console.error(`Error saving citation ${citation.id}:`, citationError);
        // Continue with other citations if one fails
      }
    }

    return NextResponse.json({
      message: `Processed ${citations.length} citations, saved ${savedCitations.length}`,
      citations: savedCitations
    });
  } catch (error) {
    console.error('Error processing citations:', error);
    return NextResponse.json(
      { error: 'Failed to process citations' },
      { status: 500 }
    );
  }
}
