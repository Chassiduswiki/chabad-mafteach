import { notFound } from 'next/navigation';
import { readItems } from '@directus/sdk';
import directus, { Topic } from '@/lib/directus';
import TopicTabs from '@/components/topics/TopicTabs';
import { TopicHeader } from '@/components/topics/TopicHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ActionButtons } from '@/components/shared/ActionButtons';
import { TopicTracker } from '@/components/shared/TopicTracker';

export const dynamic = 'force-dynamic';

async function getTopic(slug: string): Promise<Topic | null> {
    try {
        console.log('[getTopic] Starting fetch for slug:', slug);

        // 1) Fetch the core topic record
        const rawTopics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: slug } },
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description', 'metadata'],
            limit: 1
        }));

        console.log('[getTopic] Raw topics result:', JSON.stringify(rawTopics, null, 2));

        if (!rawTopics || (Array.isArray(rawTopics) && rawTopics.length === 0)) {
            console.log('[getTopic] No topic found for slug:', slug);
            return null;
        }

        const t = (Array.isArray(rawTopics) ? rawTopics[0] : rawTopics) as any;
        console.log('[getTopic] Found topic:', { id: t.id, title: t.canonical_title });

        // 2) Fetch documents of type `entry` that are explicitly linked to this topic
        // CHECK: Is the field name 'topic' or 'topic_id'?
        const rawDocuments = await directus.request(readItems('documents', {
            filter: {
                topic: { _eq: t.id },
                doc_type: { _eq: 'entry' }
            },
            fields: ['id', 'title', 'doc_type'],
            limit: -1
        }));

        console.log('[getTopic] Raw documents result:', JSON.stringify(rawDocuments, null, 2));

        const documents = Array.isArray(rawDocuments) ? rawDocuments : (rawDocuments ? [rawDocuments] : []);
        console.log('[getTopic] Processed documents count:', documents.length);

        // 3) Fetch paragraphs for those documents directly (no reliance on O2M relation)
        let paragraphsByDocId: Record<number, { id: number; text: string; order_key: string; doc_id: number }[]> = {};
        if (documents.length > 0) {
            const docIds = documents.map((d: any) => d.id);
            console.log('[getTopic] Fetching paragraphs for docIds:', docIds);

            const rawParagraphs = await directus.request(readItems('paragraphs', {
                filter: { doc_id: { _in: docIds } },
                fields: ['id', 'text', 'order_key', 'doc_id'],
                limit: -1,
            }));

            console.log('[getTopic] Raw paragraphs count:', Array.isArray(rawParagraphs) ? rawParagraphs.length : (rawParagraphs ? 1 : 0));

            const paragraphsArray = Array.isArray(rawParagraphs)
                ? rawParagraphs
                : rawParagraphs
                    ? [rawParagraphs]
                    : [];

            paragraphsByDocId = paragraphsArray.reduce((acc: typeof paragraphsByDocId, para: any) => {
                const id = typeof para.doc_id === 'object' ? para.doc_id.id : para.doc_id;
                if (!id) return acc;
                if (!acc[id]) acc[id] = [];
                acc[id].push({
                    id: para.id,
                    text: para.text,
                    order_key: para.order_key,
                    doc_id: id,
                });
                return acc;
            }, {} as typeof paragraphsByDocId);
        } else {
            console.log('[getTopic] Skipping paragraph fetch because no documents found.');
        }

        console.log('Topic documents for Article tab:', {
            topicId: t.id,
            slug: t.slug,
            docCount: documents.length,
            docIds: documents.map((d: any) => d.id),
            totalParagraphs: Object.values(paragraphsByDocId).reduce((sum, arr) => sum + arr.length, 0),
        });

        // 4) Map into our Topic shape, including a flattened paragraphs array
        const mapped: Topic = {
            id: t.id as number,
            slug: t.slug as string,
            canonical_title: t.canonical_title as string,
            topic_type: t.topic_type,
            description: t.description,
            // Legacy aliases for UI compatibility
            name: (t.canonical_title as string) || (t.slug as string),
            category: t.topic_type,
            definition_short: t.description,
            definition_positive: t.metadata?.definition_positive,
            definition_negative: t.metadata?.definition_negative,
            paragraphs: documents.flatMap((doc: any) => {
                const docParas = paragraphsByDocId[doc.id] || [];
                return docParas.map((para) => ({
                    id: para.id,
                    text: para.text,
                    order_key: para.order_key,
                    document_title: doc.title,
                    statement_text: para.text,
                    statement_order_key: para.order_key,
                    relevance_score: 1.0,
                }));
            }),
        };

        return mapped;
    } catch (error) {
        console.error('Error fetching topic:', error);
        return null;
    }
}

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topic = await getTopic(slug);

    if (!topic) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Track last visited topic for Continue Learning */}
            <TopicTracker slug={topic.slug} name={topic.name || topic.canonical_title} />

            <TopicHeader topic={topic} />

            <main className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-12">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Breadcrumbs
                        items={[
                            { label: 'Topics', href: '/topics' },
                            { label: topic.name || topic.canonical_title }
                        ]}
                    />
                    <ActionButtons topicSlug={topic.slug} topicName={topic.name || topic.canonical_title} />
                </div>

                <div className="w-full">
                    <TopicTabs topic={topic} />
                </div>
            </main>
        </div>
    );
}
