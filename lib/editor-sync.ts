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
            text: html,
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
                isModified: original.text !== p.text || original.order_key !== p.order_key
            });
        } else {
            toCreate.push({
                doc_id: Number(docId),
                text: p.text,
                order_key: p.order_key,
                status: 'draft',
                original_lang: 'en',
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
            await directus.request(deleteItem('paragraphs', id));
            results.deleted++;
        } catch (e) {
            results.errors.push(`Failed to delete paragraph ${id}`);
        }
    }

    // 2. Updates
    for (const item of toUpdate) {
        try {
            // Update paragraph text only if modified
            if (item.isModified) {
                await directus.request(updateItem('paragraphs', item.id, {
                    text: item.text,
                    order_key: item.order_key
                }));
                results.updated++;
            }
            // Sync Citations (Statement Logic)
            await syncParagraphCitations(item.id, item.text, item.citations);
            results.citations_linked += item.citations.length;
        } catch (e) {
            console.error(e);
            results.errors.push(`Failed to update paragraph ${item.id}`);
        }
    }

    // 3. Creates
    for (const item of toCreate) {
        try {
            const newPara = await directus.request(createItem('paragraphs', {
                doc_id: item.doc_id,
                text: item.text,
                order_key: item.order_key,
                status: item.status,
                original_lang: item.original_lang
            }));
            
            results.created++;
            
            // Sync Citations for the new paragraph
            if (newPara && newPara.id) {
                await syncParagraphCitations(newPara.id, item.text, item.citations);
                results.citations_linked += item.citations.length;
            }
        } catch (e) {
            console.error(e);
            results.errors.push('Failed to create new paragraph');
        }
    }

    return results;
};

// Helper: Ensure a Statement exists for the paragraph, then link sources
async function syncParagraphCitations(paragraphId: number, text: string, citations: CitationData[]) {
    // Even if no citations, we might want to update the statement text? 
    // For now, only sync if we have citations to process or if we want to keep statements in sync with paragraphs generally.
    // Let's assume for this editor that 1 Paragraph = 1 Statement (simplified model)
    
    try {
        // 1. Find existing statement for this paragraph
        const existingStatements = await directus.request(readItems('statements', {
            filter: { paragraph_id: { _eq: paragraphId } },
            limit: 1
        })) as Statement[];

        let statementId: number;

        if (existingStatements.length > 0) {
            statementId = existingStatements[0].id;
            // Update text to match paragraph if it changed
            if (existingStatements[0].text !== text) {
                await directus.request(updateItem('statements', statementId, {
                    text: text
                }));
            }
        } else {
            // Create new statement
            const newStatement = await directus.request(createItem('statements', {
                paragraph_id: paragraphId,
                text: text,
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
