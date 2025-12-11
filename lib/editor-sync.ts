import { createClient } from '@/lib/directus';
const directus = createClient();
import { createItem, updateItem, deleteItem, readItems } from '@directus/sdk';
import { ContentBlock, Statement } from '@/lib/types';

// Define the ProseMirror Node structure more accurately
interface EditorContent {
    type: string;
    text?: string;
    attrs?: Record<string, any>;
}

interface EditorNode {
    type: string;
    attrs?: {
        id?: string | number;
        status?: string;
    };
    content?: EditorContent[];
}

interface ProseMirrorDoc {
    type: 'doc';
    content: EditorNode[];
}

interface CitationData {
    source_id: number;
    reference: string;
}

// Helper to serialize ProseMirror content to HTML/Text
// We need to preserve citation markers
const serializeContent = (content: EditorContent[]) => {
    let html = '';
    const citations: CitationData[] = [];

    content.forEach(node => {
        if (node.type === 'text') {
            html += node.text;
        } else if (node.type === 'citation') {
            // Render citation as a span (matching our schema.ts output)
            // But for DB storage, we might want a cleaner format?
            // Let's store it as HTML <span> for now so it reloads correctly
            const { source_id, source_title, reference } = node.attrs || {};
            html += `<span data-type="citation" data-source-id="${source_id}" data-source-title="${source_title}" data-reference="${reference}"></span>`;
            
            if (source_id) {
                citations.push({
                    source_id: Number(source_id),
                    reference: reference || ''
                });
            }
        }
    });

    return { html, citations };
};

export const syncEditorContent = async (
    docId: string | number,
    originalParagraphs: ContentBlock[], // **[CHANGED]** from Paragraph[]
    editorState: ProseMirrorDoc
) => {
    const currentNodes = editorState.content || [];
    
    // 1. Parse Editor State
    const newParagraphs = currentNodes.map((node, index) => {
        const { html, citations } = serializeContent(node.content || []);
        const order_key = ((index + 1) * 10).toString().padStart(5, '0');

        return {
            id: node.attrs?.id ? Number(node.attrs.id) : undefined,
            content: html,
            order_key,
            status: node.attrs?.status || 'draft',
            citations
        };
    });

    // 2. Categorize Changes
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const toDelete: number[] = [];

    const existingMap = new Map(originalParagraphs.map(p => [p.id, p]));
    const processedIds = new Set<number>();

    for (const p of newParagraphs) {
        if (p.id && existingMap.has(p.id)) {
            processedIds.add(p.id);
            const original = existingMap.get(p.id)!;
            
            // For updates, we also need to handle citations
            // For now, let's just update text/order if changed
            // We ALWAYS run the citation sync logic for existing paragraphs to be safe
            toUpdate.push({
                ...p,
                isModified: original.content !== p.content || original.order_key !== p.order_key
            });
        } else {
            toCreate.push({
                document_id: Number(docId),
                content: p.content,
                order_key: p.order_key,
                status: 'draft',
                citations: p.citations
            });
        }
    }

    for (const original of originalParagraphs) {
        if (!processedIds.has(original.id)) {
            toDelete.push(original.id);
        }
    }

    const results = {
        created: 0,
        updated: 0,
        deleted: 0,
        citations_linked: 0,
        errors: [] as string[]
    };

    // --- EXECUTION ---

    // 1. Deletes
    for (const id of toDelete) {
        try {
            await directus.request(deleteItem('content_blocks', id));
            results.deleted++;
        } catch (e) {
            results.errors.push(`Failed to delete content block ${id}`);
        }
    }

    // 2. Updates
    for (const item of toUpdate) {
        try {
            // Update content block only if modified
            if (item.isModified) {
                await directus.request(updateItem('content_blocks', item.id, {
                    content: item.content,
                    order_key: item.order_key
                }));
                results.updated++;
            }
            // Sync Citations (Statement Logic)
            await syncBlockCitations(item.id, item.content, item.citations);
            results.citations_linked += item.citations.length;
        } catch (e) {
            console.error(e);
            results.errors.push(`Failed to update content block ${item.id}`);
        }
    }

    // 3. Creates
    for (const item of toCreate) {
        try {
            const newBlock = await directus.request(createItem('content_blocks', {
                document_id: item.document_id,
                content: item.content,
                order_key: item.order_key,
                status: item.status
            }));
            
            results.created++;
            
            // Sync Citations for the new content block
            if (newBlock && newBlock.id) {
                await syncBlockCitations(newBlock.id, item.content, item.citations);
                results.citations_linked += item.citations.length;
            }
        } catch (e) {
            console.error(e);
            results.errors.push('Failed to create new content block');
        }
    }

    return results;
};

// Helper: Ensure a Statement exists for the content block, then link sources
async function syncBlockCitations(blockId: number, content: string, citations: CitationData[]) {
    // Even if no citations, we might want to update the statement text? 
    // For now, only sync if we have citations to process or if we want to keep statements in sync with content blocks generally.
    // Let's assume for this editor that 1 Content Block = 1 Statement (simplified model)
    
    try {
        // 1. Find existing statement for this content block
        const existingStatements = await directus.request(readItems('statements', {
            filter: { block_id: { _eq: blockId } },
            limit: 1
        })) as Statement[];

        let statementId: number;

        if (existingStatements.length > 0) {
            statementId = existingStatements[0].id;
            // Update text to match content block if it changed
            if (existingStatements[0].text !== content) {
                await directus.request(updateItem('statements', statementId, {
                    text: content
                }));
            }
        } else {
            // Create new statement
            const newStatement = await directus.request(createItem('statements', {
                block_id: blockId,
                text: content,
                order_key: '10', // Default
                status: 'draft'
            }));
            statementId = newStatement.id;
        }

        if (citations.length === 0) return;

        // 2. Create Source Links
        for (const citation of citations) {
            // Check if this specific link already exists
            const existingLinks = await directus.request(readItems('source_links', {
                filter: {
                    statement_id: { _eq: statementId },
                    source_id: { _eq: citation.source_id },
                    section_reference: { _eq: citation.reference }
                },
                limit: 1
            }));

            if (existingLinks.length === 0) {
                await directus.request(createItem('source_links', {
                    statement_id: statementId,
                    source_id: citation.source_id,
                    section_reference: citation.reference,
                    relationship_type: 'references', // Default
                    confidence_level: 'medium'
                }));
            }
        }

    } catch (e) {
        console.error("Failed to sync citations", e);
        // Don't throw here, just log, so we don't block the whole save
        // throw e; 
    }
}
