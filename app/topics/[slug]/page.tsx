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
        console.log('Fetching topic for slug:', slug);

        const rawTopics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: slug } },
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
            limit: 1
        }));

        if (!rawTopics || (Array.isArray(rawTopics) && rawTopics.length === 0)) {
            console.log('No topic found for slug:', slug);
            return null;
        }

        const t = (Array.isArray(rawTopics) ? rawTopics[0] : rawTopics) as any;

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
