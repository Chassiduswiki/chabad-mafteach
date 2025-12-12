import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export async function GET() {
  try {
    // Use server-side Directus client (direct connection to production)
    const directus = createClient();

    // Fetch all documents
    const result = await directus.request(readItems('documents', {
      fields: ['id', 'title', 'doc_type', 'parent_id', 'author', 'category'],
      sort: ['title'],
      limit: -1
    }));

    const docsArray = Array.isArray(result) ? result : result ? [result] : [];

    // Build hierarchical structure
    const docs: any[] = docsArray.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      parent_id: doc.parent_id,
      author: doc.author,
      category: doc.category,
      children: []
    }));

    // Create parent-child relationships
    const docMap = new Map<number, any>();
    const roots: any[] = [];

    // First pass: create map
    docs.forEach(doc => {
      docMap.set(doc.id, doc);
    });

    // Second pass: build hierarchy
    docs.forEach(doc => {
      if (doc.parent_id && docMap.has(doc.parent_id)) {
        const parent = docMap.get(doc.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(doc);
      } else {
        roots.push(doc);
      }
    });

    // Check which documents have content (content_blocks) - BATCH query instead of N+1
    try {
      const allDocIds = docs.map(d => d.id);
      // Get all content blocks with just document_id to minimize data transfer
      const allContentBlocks = await directus.request(readItems('content_blocks', {
        filter: { document_id: { _in: allDocIds } },
        fields: ['document_id'],
        limit: -1
      })) as any[];

      // Create a Set of document IDs that have content for O(1) lookup
      const docsWithContent = new Set(
        (Array.isArray(allContentBlocks) ? allContentBlocks : [])
          .map((b: any) => b.document_id)
      );

      // Mark each document
      docs.forEach(doc => {
        doc.hasContent = docsWithContent.has(doc.id);
      });
    } catch (error) {
      console.warn('Failed to fetch content blocks for hasContent check:', error);
      // Default all to false on error
      docs.forEach(doc => { doc.hasContent = false; });
    }

    return NextResponse.json(roots);
  } catch (error) {
    console.error('Error fetching seforim:', error);
    return NextResponse.json({ error: 'Failed to fetch seforim' }, { status: 500 });
  }
}
