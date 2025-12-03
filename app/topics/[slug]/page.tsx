import { notFound } from 'next/navigation';
import { readItems } from '@directus/sdk';
import directus, { Topic, TopicCitation, TopicRelationship } from '@/lib/directus';
import TopicTabs from '@/components/topics/TopicTabs';
import { TopicHeader } from '@/components/topics/TopicHeader';
import { TopicSidebar } from '@/components/topics/TopicSidebar';
import { linkTerms } from '@/lib/term-linker';
import { getAllTopics } from '@/lib/directus';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ActionButtons } from '@/components/ActionButtons';

export const dynamic = 'force-dynamic';

async function getTopic(slug: string) {
    try {
        console.log('Fetching topic for slug:', slug);
        const topics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: slug } },
            fields: [
                '*',
                // Fetch citations with nested location/sefer data
                // Note: We need to fetch this separately or via deep relation if Directus allows
                // For now, let's try fetching the topic first, then we might need parallel fetches
            ],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            console.log('No topic found for slug:', slug);
            return null;
        }
        console.log('Found topic:', topics[0].name, 'ID:', topics[0].id);
        return topics[0] as Topic;
    } catch (error) {
        console.error('Error fetching topic:', error);
        return null;
    }
}

async function getTopicData(topicId: number) {
    // Parallel fetch for related data
    const [citations, relationships] = await Promise.all([
        // 1. Citations
        directus.request(readItems('topic_citations', {
            filter: { topic: { _eq: topicId } },
            // @ts-ignore
            fields: [
                '*',
                'location.id',
                'location.reference_text',
                'location.reference_hebrew',
                'location.reference_hebrew',
                'location.sefer.id',
                'location.sefer.title',
                'location.sefer.title_hebrew',
                'location.sefer.author',
                'location.sefer.hebrewbooks_id'
            ] as any,
            sort: ['-importance', 'sort_order']
        })),
        // 2. Relationships (both directions)
        directus.request(readItems('topic_relationships', {
            filter: {
                _or: [
                    { from_topic: { _eq: topicId } },
                    { to_topic: { _eq: topicId } }
                ]
            },
            // @ts-ignore
            fields: ['*', 'from_topic.name', 'from_topic.slug', 'to_topic.name', 'to_topic.slug'] as any
        }))
    ]);

    return {
        citations: citations as unknown as TopicCitation[],
        relationships: relationships as unknown as TopicRelationship[]
    };
}

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topic = await getTopic(slug);

    if (!topic) {
        notFound();
    }

    const { citations, relationships } = await getTopicData(topic.id);
    const allTopics = await getAllTopics() as Topic[];

    // Apply term linking to markdown content
    // We filter out the current topic to avoid self-linking
    const linkableTopics = allTopics.filter((t: Topic) => t.id !== topic.id);

    if (topic.overview) {
        topic.overview = linkTerms(topic.overview, linkableTopics as Topic[]);
    }
    if (topic.definition_positive) {
        topic.definition_positive = linkTerms(topic.definition_positive, linkableTopics as Topic[]);
    }
    if (topic.definition_negative) {
        topic.definition_negative = linkTerms(topic.definition_negative, linkableTopics as Topic[]);
    }
    if (topic.historical_context) {
        topic.historical_context = linkTerms(topic.historical_context, linkableTopics as Topic[]);
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <TopicHeader topic={topic} />

            <main className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-12">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Breadcrumbs
                        items={[
                            { label: 'Topics', href: '/topics' },
                            { label: topic.name }
                        ]}
                    />
                    <ActionButtons topicSlug={topic.slug} topicName={topic.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content (Left 2/3) */}
                    <div className="lg:col-span-2">
                        <TopicTabs topic={topic} />
                    </div>

                    {/* Sidebar (Right 1/3) */}
                    <div className="space-y-8">
                        <TopicSidebar topic={topic} relationships={relationships} />
                    </div>
                </div>
            </main>
        </div>
    );
}
