import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/lib/api/topics';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { TopicExperience } from '@/components/topics/TopicExperience';
import { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TopicDetailPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ lang?: string }>;
}) {
    const { slug } = await params;
    const { lang = 'en' } = await searchParams;

    let topicData = null;
    try {
        topicData = await getTopicBySlug(slug, lang);
    } catch (error) {
        console.error('Error fetching topic data:', error);
    }

    if (!topicData) {
        notFound();
    }

    const { topic, relatedTopics, sources, citations, inlineCitations } = topicData;
    
    // Cast topic to Topic type from lib/types, using unknown first to safely merge types
    const typedTopic = topic as unknown as Topic;

    return (
        <>
            {/* Track last visited topic for analytics/history */}
            <TopicTracker slug={slug} name={(typedTopic as any).title || typedTopic.canonical_title} topicId={typedTopic.id} />

            {/* Main Interactive Experience */}
            <TopicExperience
                topic={typedTopic}
                relatedTopics={relatedTopics}
                sources={sources}
                citations={citations}
                inlineCitations={inlineCitations || []}
            />
        </>
    );
}
