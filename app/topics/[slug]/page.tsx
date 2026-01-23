import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/lib/api/topics';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { TopicExperience } from '@/components/topics/TopicExperience';

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
    
    // Cast topic to any to access all properties from the merged topic object
    const topicAny = topic as any;

    return (
        <>
            {/* Track last visited topic for analytics/history */}
            <TopicTracker slug={slug} name={topicAny.title || topicAny.canonical_title} topicId={topicAny.id} />

            {/* Main Interactive Experience */}
            <TopicExperience
                topic={topicAny}
                relatedTopics={relatedTopics}
                sources={sources}
                citations={citations}
                inlineCitations={inlineCitations || []}
            />
        </>
    );
}
