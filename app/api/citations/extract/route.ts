import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems, updateItem } from '@directus/sdk';
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

    console.log('Citation extraction called with:', { 
      contentLength: content?.length, 
      topicId,
      contentPreview: content?.substring(0, 200) 
    });

    // Extract citation references from content
    const citations = extractCitationReferences(content);
    
    console.log('Extracted citations:', citations.length, citations);
    
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
        console.log('Processing citation:', citation);
        
        // Check if the source exists
        if (!citation.sourceId) {
          console.warn(`Citation ${citation.id} has no source ID, skipping`);
          continue;
        }

        // Convert sourceId to number if needed
        const sourceIdNum = typeof citation.sourceId === 'string' 
          ? parseInt(citation.sourceId, 10) 
          : citation.sourceId;
          
        if (isNaN(sourceIdNum)) {
          console.warn(`Citation ${citation.id} has invalid source ID: ${citation.sourceId}, skipping`);
          continue;
        }

        // Check if a link with this citation_id already exists
        const existingLinks = await directus.request(
          readItems('source_links', {
            filter: { citation_id: { _eq: citation.id } },
            fields: ['id'],
            limit: 1
          })
        ) as { id: number }[];

        const sourceLinkData = {
          source_id: sourceIdNum,
          topic_id: topicId || null,
          statement_id: null,
          relationship_type: 'references', 
          page_number: citation.pageNumber || '',
          section_reference: citation.reference || '',
          verse_reference: citation.verseNumber || '',
          citation_id: citation.id,
          notes: `Updated from citation reference ${citation.id}`
        };

        console.log('Creating source link:', sourceLinkData);

        let result: any;
        if (existingLinks && existingLinks.length > 0) {
          console.log('Updating existing source link:', existingLinks[0].id);
          result = await directus.request(
            updateItem('source_links', existingLinks[0].id, sourceLinkData)
          );
        } else {
          console.log('Creating new source link');
          result = await directus.request(
            createItem('source_links', sourceLinkData)
          );
        }

        savedCitations.push({
          citationId: citation.id,
          sourceLinkId: result.id,
          wasUpdated: !!(existingLinks && existingLinks.length > 0)
        });
        
        console.log('Saved citation link:', result.id);
      } catch (citationError) {
        console.error(`Error saving citation ${citation.id}:`, citationError);
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
