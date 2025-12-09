import { notFound } from 'next/navigation';
import { readItems } from '@directus/sdk';
import directus, { Topic } from '@/lib/directus';
import TopicTabs from '@/components/topics/TopicTabs';
import { TopicHeader } from '@/components/topics/TopicHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ActionButtons } from '@/components/shared/ActionButtons';
import { TopicTracker } from '@/components/shared/TopicTracker';

export const dynamic = 'force-dynamic';

async function getTopicData(slug: string): Promise<{ topic: Topic; relatedTopics?: any[] } | null> {
    try {
        console.log('Fetching topic data for slug:', slug);

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/topics/${slug}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            console.log('API response not ok:', response.status);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching topic data:', error);
        return null;
    }
}

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topicData = await getTopicData(slug);

    if (!topicData) {
        notFound();
    }

    const { topic, relatedTopics } = topicData;

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
                    <TopicTabs topic={topic} relatedTopics={relatedTopics} />
                </div>
            </main>
        </div>
    );
}
