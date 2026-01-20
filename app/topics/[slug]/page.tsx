import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/lib/api/topics';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { TopicExperience } from '@/components/topics/TopicExperience';

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

    const { topic, relatedTopics, sources, citations } = topicData;

    return (
        <>
            {/* Track last visited topic for analytics/history */}
            <TopicTracker slug={topic.slug} name={topic.name || topic.canonical_title} topicId={topic.id} />

            {/* Main Interactive Experience */}
            <TopicExperience
                topic={topic}
                relatedTopics={relatedTopics}
                sources={sources}
                citations={citations}
            />
        </>
    );
}
