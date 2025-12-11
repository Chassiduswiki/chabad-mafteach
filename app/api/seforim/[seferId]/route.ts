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
    statements: Statement[];
    commentaries: BlockCommentary[];
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
            const childrenWithContent = await Promise.all(
                childrenArray.map(async (child: any) => {
                    try {
                        console.log('Checking content for child:', child.id);
                        const contentBlocks = await directus.request(readItems('content_blocks', {
                            filter: { document_id: { _eq: child.id } },
                            limit: 1
                        })) as any;
                        const blockArray = Array.isArray(contentBlocks) ? contentBlocks : contentBlocks ? [contentBlocks] : [];
                        console.log('Child', child.id, 'has', blockArray.length, 'content blocks');
                        return { ...child, hasContent: blockArray.length > 0 };
                    } catch (childError) {
                        console.warn('Error checking content for child', child.id, ':', childError);
                        return { ...child, hasContent: false };
                    }
                })
            );

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
        } else {
            // This document has no children - show content
            console.log('No children found, fetching document content...');
            // Fetch the document first
            const docResult = await directus.request(readItems('documents', {
                filter: { id: { _eq: seferIdNum } },
                fields: ['id', 'title', 'doc_type'],
                limit: 1
            })) as any;

            const docsArray = Array.isArray(docResult) ? docResult : docResult ? [docResult] : [];
            const doc = docsArray[0] || null;
            console.log('Main document:', doc);

            if (!doc) {
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            // Fetch content blocks separately
            console.log('Fetching content blocks...');
            const blockResult = await directus.request(readItems('content_blocks', {
                filter: { document_id: { _eq: seferIdNum } },
                fields: ['id', 'order_key', 'content', 'block_type', 'page_number', 'chapter_number', 'halacha_number', 'daf_number', 'section_number', 'citation_refs', 'metadata'],
                sort: ['order_key']
            })) as any;

            const contentBlocksArray = Array.isArray(blockResult) ? blockResult : [blockResult];
            console.log('Found', contentBlocksArray.length, 'content blocks');
            doc.contentBlocks = contentBlocksArray;

            // Fetch statements for all content blocks
            const contentBlockIds = contentBlocksArray.map((b: any) => b.id);
            console.log('Content block IDs:', contentBlockIds);
            if (contentBlockIds.length > 0) {
                console.log('Fetching statements...');
                const statementsResult = await (directus.request(readItems('statements', {
                    filter: { block_id: { _in: contentBlockIds } },
                    fields: ['id', 'text', 'appended_text', 'order_key', 'metadata', 'block_id'] as any,
                    sort: ['order_key']
                })) as Promise<any>);

                const statementsArray = Array.isArray(statementsResult) ? statementsResult : [statementsResult];
                console.log('Found', statementsArray.length, 'statements');

                // Group statements by block_id
                const statementsByBlock = statementsArray.reduce((acc: any, stmt: any) => {
                    if (!acc[stmt.block_id]) acc[stmt.block_id] = [];
                    acc[stmt.block_id].push(stmt);
                    return acc;
                }, {});

                // Fetch block_commentaries for layered display
                console.log('Fetching block commentaries...');
                const commentariesResult = await directus.request(readItems('block_commentaries', {
                    filter: { block_id: { _in: contentBlockIds } },
                    fields: ['id', 'block_id', 'commentary_text', 'author', 'source', 'commentary_type', 'language', 'order_position', 'is_official', 'quality_score', 'citation_source', 'citation_page', 'citation_reference'],
                    sort: ['order_position', '-quality_score']
                })) as any;

                const commentariesArray = Array.isArray(commentariesResult) ? commentariesResult : [commentariesResult];
                console.log('Found', commentariesArray.length, 'commentaries');

                // Group commentaries by block_id
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
                console.log('Attached statements and commentaries to content blocks');
            }

            return NextResponse.json({
                document: doc,
                childDocuments: []
            });
        }
    } catch (error) {
        console.error('Error fetching sefer data:', error);
        return NextResponse.json({
            error: 'Failed to fetch sefer data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
