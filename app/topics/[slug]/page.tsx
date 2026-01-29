import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTopicBySlug } from '@/lib/api/topics';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { TopicExperienceV2 as TopicExperience } from '@/components/topics/TopicExperienceV2';
import { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const { lang = 'en' } = await searchParams;

    try {
        const topicData = await getTopicBySlug(slug, lang);
        if (!topicData || !topicData.topic) return {};

        const topic = topicData.topic as unknown as Topic;
        const title = topic.canonical_title || topic.name || 'Topic Details';
        const description = topic.description
            ? topic.description.replace(/<[^>]*>/g, '').substring(0, 160)
            : `Explore ${title} in the Chabad Chassidus Encyclopedia.`;

        return {
            title: `${title} | Chabad Mafteach Encyclopedia`,
            description,
            openGraph: {
                title: `${title} | Chabad Mafteach`,
                description,
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} | Chabad Mafteach`,
                description,
            }
        };
    } catch (error) {
        return {
            title: 'Topic Details | Chabad Mafteach'
        };
    }
}

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

    // JSON-LD Structured Data for Rich Results
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article', // Can clarify as 'DefinedTerm' for Encyclopedia later
        headline: typedTopic.canonical_title,
        description: typedTopic.description?.replace(/<[^>]*>/g, '').substring(0, 160),
        url: `https://beta.chassiduswiki.com/topics/${slug}`,
        dateModified: typedTopic.date_updated || new Date().toISOString(),
        author: {
            '@type': 'Organization',
            name: 'Chabad Mafteach'
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://beta.chassiduswiki.com/topics/${slug}`
        },
        about: {
            '@type': 'Thing',
            name: typedTopic.canonical_title,
            additionalType: typedTopic.topic_type ? `https://beta.chassiduswiki.com/types/${typedTopic.topic_type}` : undefined
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

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
