import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItem } from '@directus/sdk';
import { Document, Paragraph } from '@/lib/types';

export interface EditorDocument extends Document {
    paragraphs: Paragraph[];
}

export const useEditorDocument = (documentId: string | number | null) => {
    return useQuery({
        queryKey: ['editor-document', documentId],
        queryFn: async () => {
            if (!documentId) return null;
            try {
                // Fetch document with contentBlocks
                // We cast the result because the SDK types for deep relations can be tricky
                const result = await directus.request(readItem('documents', documentId, {
                    fields: [
                        '*',
                        {
                            contentBlocks: ['id', 'content', 'order_key', 'status']
                        }
                    ]
                })) as unknown as EditorDocument;

                // Sort contentBlocks by order_key if they exist
                if (result && result.contentBlocks && Array.isArray(result.contentBlocks)) {
                    result.contentBlocks.sort((a, b) => {
                        return (a.order_key || '').localeCompare(b.order_key || '', undefined, { numeric: true });
                    });
                }

                return result;
            } catch (err: any) {
                if (err.response?.status === 401) {
                    throw new Error('Authentication failed: Unauthorized access. Please check your Directus token.');
                } else {
                    throw new Error(err.message || 'Error fetching document');
                }
            }
        },
        enabled: !!documentId,
        retry: 1,
    });
};
