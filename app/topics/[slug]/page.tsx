import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTopicBySlug } from '@/lib/api/topics';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { TopicExperience } from '@/components/topics/TopicExperience';
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
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chabad-mafteach.org';
        const topicUrl = `${baseUrl}/topics/${slug}${lang !== 'en' ? `?lang=${lang}` : ''}`;
        
        // Generate structured data for SEO
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "url": topicUrl,
            "datePublished": topic.date_created || new Date().toISOString(),
            "dateModified": topic.date_updated || topic.date_created || new Date().toISOString(),
            "author": {
                "@type": "Organization",
                "name": "Chabad Mafteach Encyclopedia",
                "url": baseUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": "Chabad Mafteach Encyclopedia",
                "url": baseUrl
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": topicUrl
            },
            "inLanguage": lang === 'he' ? 'he-IL' : 'en-US',
            "keywords": topic.topic_type ? `${topic.topic_type}, Chassidus, Chabad, ${title}` : 'Chassidus, Chabad, ' + title,
            "articleSection": topic.topic_type || 'Chassidus Philosophy'
        };

        return {
            title: `${title} | Chabad Mafteach Encyclopedia`,
            description,
            keywords: structuredData.keywords,
            authors: [{ name: 'Chabad Mafteach Encyclopedia' }],
            alternates: {
                canonical: topicUrl,
                languages: {
                    'en': `${baseUrl}/topics/${slug}`,
                    'he': `${baseUrl}/topics/${slug}?lang=he`
                }
            },
            openGraph: {
                title: `${title} | Chabad Mafteach`,
                description,
                type: 'article',
                url: topicUrl,
                siteName: 'Chabad Mafteach Encyclopedia',
                locale: lang === 'he' ? 'he_IL' : 'en_US',
                images: [
                    {
                        url: `${baseUrl}/api/og/topics/${slug}`,
                        width: 1200,
                        height: 630,
                        alt: `${title} - Chabad Mafteach Encyclopedia`,
                        type: 'image/png'
                    }
                ]
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} | Chabad Mafteach`,
                description,
                images: [`${baseUrl}/api/og/topics/${slug}`],
                creator: '@ChabadMafteach',
                site: '@ChabadMafteach'
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1
                }
            },
            other: {
                'article:author': 'Chabad Mafteach Encyclopedia',
                'article:section': topic.topic_type || 'Chassidus Philosophy',
                'og:locale': lang === 'he' ? 'he_IL' : 'en_US'
            }
        };
    } catch (error) {
        console.error('Metadata generation error:', error);
        return {
            title: 'Topic Details | Chabad Mafteach Encyclopedia',
            description: 'Explore Chassidic concepts and teachings in the Chabad Mafteach Encyclopedia.'
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chabad-mafteach.org';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article', // Can clarify as 'DefinedTerm' for Encyclopedia later
        headline: typedTopic.canonical_title,
        description: typedTopic.description?.replace(/<[^>]*>/g, '').substring(0, 160),
        url: `${baseUrl}/topics/${slug}${lang !== 'en' ? `?lang=${lang}` : ''}`,
        datePublished: typedTopic.date_created || new Date().toISOString(),
        dateModified: typedTopic.date_updated || typedTopic.date_created || new Date().toISOString(),
        author: {
            '@type': 'Organization',
            name: 'Chabad Mafteach Encyclopedia',
            url: baseUrl
        },
        publisher: {
            '@type': 'Organization',
            name: 'Chabad Mafteach Encyclopedia',
            url: baseUrl
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/topics/${slug}${lang !== 'en' ? `?lang=${lang}` : ''}`
        },
        about: {
            '@type': 'Thing',
            name: typedTopic.canonical_title,
            additionalType: typedTopic.topic_type ? `${baseUrl}/types/${typedTopic.topic_type}` : undefined
        },
        inLanguage: lang === 'he' ? 'he-IL' : 'en-US',
        keywords: typedTopic.topic_type ? `${typedTopic.topic_type}, Chassidus, Chabad, ${typedTopic.canonical_title}` : 'Chassidus, Chabad, ' + typedTopic.canonical_title,
        articleSection: typedTopic.topic_type || 'Chassidus Philosophy',
        isAccessibleForFree: true,
        audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'student'
        },
        teaches: {
            '@type': 'DefinedTerm',
            name: typedTopic.canonical_title,
            description: typedTopic.description?.replace(/<[^>]*>/g, '').substring(0, 160),
            inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: 'Chassidus Encyclopedia',
                description: 'A comprehensive encyclopedia of Chabad Chassidic philosophy and teachings'
            }
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
