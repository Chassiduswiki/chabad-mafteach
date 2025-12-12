import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/lib/api/topics';
import TopicTabs from '@/components/topics/TopicTabs';
import { TopicHeader } from '@/components/topics/TopicHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ActionButtons } from '@/components/shared/ActionButtons';
import { TopicTracker } from '@/components/shared/TopicTracker';

export const dynamic = 'force-dynamic';

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let topicData = null;
    try {
        topicData = await getTopicBySlug(slug);
    } catch (error) {
        console.error('Error fetching topic data:', error);
    }

    if (!topicData) {
        notFound();
    }

    const { topic, relatedTopics, sources } = topicData;

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
                    <ActionButtons topic={topic} />
                </div>

                <div className="w-full">
                    <TopicTabs topic={topic} relatedTopics={relatedTopics} />
                </div>
            </main>
        </div>
    );
}
