import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';

interface ContentBlock {
    id: number;
    title?: string;
    order_key: string;
    content?: string;
    block_type?: string;
    page_number?: string;
    chapter_number?: number;
    halacha_number?: number;
    daf_number?: string;
    section_number?: number;
    citation_refs?: any[];
    metadata?: any;
    statements?: Statement[];
    commentaries?: BlockCommentary[];
}

interface Statement {
    id: number;
    text: string;
    appended_text: string;
    order_key: string;
    metadata?: {
        citation_references?: any[];
    };
}

interface BlockCommentary {
    id: number;
    block_id: number;
    commentary_text: string;
    author?: string;
    source?: string;
    commentary_type: string;
    language: string;
    order_position: number;
    is_official: boolean;
    quality_score: number;
    citation_source?: number;
    citation_page?: string;
    citation_reference?: string;
}

interface Document {
    id: number;
    title: string;
    doc_type?: string;
    author?: string;
    hasContent?: boolean;
    contentBlocks: ContentBlock[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ seferId: string }> }
) {
    try {
        const { seferId } = await params;
        const seferIdNum = parseInt(seferId);
        console.log('parsed seferId:', seferIdNum, 'isNaN:', isNaN(seferIdNum));
        if (isNaN(seferIdNum)) {
            return NextResponse.json({ error: 'Invalid sefer ID' }, { status: 400 });
        }

        // First check if this document has children (hierarchical navigation)
        console.log('Fetching children documents for seferId:', seferId);
        const childrenResult = await directus.request(readItems('documents', {
            filter: { parent_id: { _eq: seferIdNum } },
            fields: ['id', 'title', 'doc_type', 'author', 'category'],
            sort: ['title']
        })) as any;

        const childrenArray = Array.isArray(childrenResult) ? childrenResult : [childrenResult];
        console.log('Found', childrenArray.length, 'children documents');

        if (childrenArray.length > 0) {
            // This document has children - show hierarchical navigation
            console.log('Processing children documents...');

            try {
                // Get all content blocks for all children in one query
                const childIds = childrenArray.map((child: any) => child.id);
                console.log('Child IDs:', childIds);

                // TEMPORARILY DISABLE CONTENT BLOCKS QUERY
                /*
                const allContentBlocks = await directus.request(readItems('content_blocks', {
                    filter: { document_id: { _in: childIds } },
                    fields: ['id', 'document_id'],
                    limit: 10000
                })) as any[];
                
                const contentBlocksArray = Array.isArray(allContentBlocks) ? allContentBlocks : [allContentBlocks];
                console.log('Found', contentBlocksArray.length, 'total content blocks across all children');
                
                // Group content blocks by document_id
                const contentBlocksByDoc = contentBlocksArray.reduce((acc: any, block: any) => {
                    if (!acc[block.document_id]) acc[block.document_id] = [];
                    acc[block.document_id].push(block);
                    return acc;
                }, {});
                
                // Add hasContent flag to each child
                const childrenWithContent = childrenArray.map((child: any) => ({
                    ...child,
                    hasContent: (contentBlocksByDoc[child.id]?.length || 0) > 0
                }));
                */

                // TEMP: Just return children without content check
                const childrenWithContent = childrenArray.map((child: any) => ({
                    ...child,
                    hasContent: true // Assume all have content for now
                }));

                // Get parent document info
                console.log('Fetching parent document info...');
                const parentDoc = await directus.request(readItems('documents', {
                    filter: { id: { _eq: seferIdNum } },
                    fields: ['id', 'title', 'doc_type'],
                    limit: 1
                })) as any;

                const parentArray = Array.isArray(parentDoc) ? parentDoc : [parentDoc];
                console.log('Parent document:', parentArray[0]);

                return NextResponse.json({
                    document: parentArray[0] || null,
                    childDocuments: childrenWithContent
                });
            } catch (hierarchicalError) {
                console.error('Error in hierarchical navigation:', hierarchicalError);
                throw hierarchicalError;
            }
        } else {
            // This document has no children - show content
            console.log('No children found, fetching document content in parallel...');

            // OPTIMIZATION: Fetch document and content blocks in parallel
            const [docResult, blockResult] = await Promise.all([
                directus.request(readItems('documents', {
                    filter: { id: { _eq: seferIdNum } },
                    fields: ['id', 'title', 'doc_type'],
                    limit: 1
                })),
                directus.request(readItems('content_blocks', {
                    filter: { document_id: { _eq: seferIdNum } },
                    fields: ['id', 'order_key', 'content', 'block_type', 'page_number', 'chapter_number', 'halacha_number', 'daf_number', 'section_number', 'citation_refs', 'metadata'],
                    sort: ['order_key']
                }))
            ]);

            const docsArray = Array.isArray(docResult) ? docResult : docResult ? [docResult] : [];
            const doc = docsArray[0] as Document || null;

            if (!doc) {
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            const contentBlocksArray = Array.isArray(blockResult) ? blockResult :
                (blockResult ? [blockResult] : []);
            console.log('Found', contentBlocksArray.length, 'content blocks');
            doc.contentBlocks = contentBlocksArray;

            // Fetch statements and commentaries for all content blocks
            const contentBlockIds = contentBlocksArray.map((b: any) => b.id);
            if (contentBlockIds.length > 0) {
                // OPTIMIZATION: Fetch statements and commentaries in parallel
                const [statementsResult, commentariesResult] = await Promise.all([
                    directus.request(readItems('statements', {
                        filter: { block_id: { _in: contentBlockIds } },
                        fields: ['id', 'text', 'appended_text', 'order_key', 'metadata', 'block_id'] as any,
                        sort: ['order_key']
                    })),
                    // Commentaries query with error handling
                    directus.request(readItems('block_commentaries', {
                        filter: { block_id: { _in: contentBlockIds } },
                        fields: ['id', 'block_id', 'commentary_text', 'author', 'source', 'commentary_type', 'language']
                    })).catch((err: any) => {
                        console.warn('Failed to fetch block commentaries:', err);
                        return []; // Return empty array on error
                    })
                ]);

                const statementsArray = Array.isArray(statementsResult) ? statementsResult :
                    (statementsResult ? [statementsResult] : []);
                const commentariesArray = Array.isArray(commentariesResult) ? commentariesResult :
                    (commentariesResult ? [commentariesResult] : []);

                console.log('Found', statementsArray.length, 'statements and', commentariesArray.length, 'commentaries');

                // Group by block_id
                const statementsByBlock = statementsArray.reduce((acc: any, stmt: any) => {
                    if (!acc[stmt.block_id]) acc[stmt.block_id] = [];
                    acc[stmt.block_id].push(stmt);
                    return acc;
                }, {});

                const commentariesByBlock = commentariesArray.reduce((acc: any, commentary: any) => {
                    if (!acc[commentary.block_id]) acc[commentary.block_id] = [];
                    acc[commentary.block_id].push(commentary);
                    return acc;
                }, {});

                // Attach statements and commentaries to content blocks
                doc.contentBlocks = doc.contentBlocks.map((b: any) => ({
                    ...b,
                    statements: statementsByBlock[b.id] || [],
                    commentaries: commentariesByBlock[b.id] || []
                }));
            }

            return NextResponse.json({
                document: doc,
                childDocuments: []
            });
        }
    } catch (error) {
        console.error('Error fetching sefer data:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json({
            error: 'Failed to fetch sefer data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
