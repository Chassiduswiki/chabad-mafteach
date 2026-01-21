import { Hash } from 'lucide-react';
import { GlobalNav } from '@/components/layout/GlobalNav';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { Topic } from '@/lib/directus';
import { TopicsList } from '@/components/topics/TopicsList';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Suspense } from 'react';
import { TopicsListSkeleton } from '@/components/topics/TopicsListSkeleton';
import Dynamic from 'next/dynamic';
import { FeaturedTopicCard } from '@/components/topics/FeaturedTopicCard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    searchParams
}: {
    searchParams: Promise<{ page?: string; category?: string }>
}): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const category = resolvedSearchParams.category;
    const page = Number(resolvedSearchParams.page) || 1;

    const baseTitle = 'Topics & Concepts';
    const siteName = 'Chabad Maftaiach';
    
    let title = baseTitle;
    let description = 'Explore Chassidic concepts and find all the sources that discuss them';

    if (category) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        title = `${categoryName} Topics - ${baseTitle}`;
        description = `Browse ${categoryName.toLowerCase()} topics in Chassidic philosophy and discover related sources and teachings.`;
    }

    if (page > 1) {
        title = `${title} - Page ${page}`;
    }

    return {
        title: `${title} | ${siteName}`,
        description,
        openGraph: {
            title: `${title} | ${siteName}`,
            description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | ${siteName}`,
            description,
        },
    };
}

// Lazy load client components
const ContextualSearch = Dynamic(() => import('@/components/features/search/ContextualSearch'), {
    loading: () => <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
});

const TopicCategoryChips = Dynamic(() => import('@/components/topics/TopicCategoryChips').then(mod => ({ default: mod.TopicCategoryChips })), {
    loading: () => (
        <div className="flex gap-2 overflow-x-auto py-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full flex-shrink-0" />
            ))}
        </div>
    )
});

const FeaturedCollections = Dynamic(() => import('@/components/topics/FeaturedCollections').then(mod => ({ default: mod.FeaturedCollections })), {
    loading: () => (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        </div>
    )
});

async function getTopics(limit: number, offset: number, category?: string): Promise<{ topics: Topic[]; totalCount: number }> {
    try {
        const filter: any = {};

        if (category) {
            filter.topic_type = { _eq: category };
        }

        const rawTopics = await directus.request(readItems('topics', {
            sort: ['canonical_title'],
            fields: ['id', 'canonical_title', 'slug', 'topic_type', 'description'],
            limit,
            offset,
            filter,
        }));

        const topics: Topic[] = (rawTopics as any[]).map((t) => ({
            id: t.id,
            slug: t.slug,
            canonical_title: t.canonical_title,
            topic_type: t.topic_type,
            description: t.description,
            name: t.canonical_title,
            category: t.topic_type,
            definition_short: t.description,
        }));

        // To get the total count, we need to make a separate request without limit/offset
        const meta = (await directus.request(
            readItems('topics', {
                filter,
                meta: 'total_count' as any,
            })
        )) as unknown as { total_count: number };

        console.log('Directus meta response:', JSON.stringify(meta, null, 2));

        const totalCount = meta.total_count || 0;

        return { topics, totalCount };
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return { topics: [], totalCount: 0 };
    }
}

export default async function TopicsPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; category?: string }>
}) {
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const category = resolvedSearchParams.category;
    const limit = 50;
    const offset = (page - 1) * limit;

    const { topics, totalCount } = await getTopics(limit, offset, category);
    const totalPages = Math.ceil(totalCount / limit);

    return (
        <>
            <GlobalNav />
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-5xl px-4 pt-6 pb-32 sm:px-6 lg:px-8 lg:pt-8">

                {/* Header */}
                <header className="mb-12 text-center sm:text-left">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                        <Hash className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        Topics & Concepts
                    </h1>
                    <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl">
                        {category ? (
                            <span>
                                Showing <span className="font-semibold text-foreground capitalize">{category}</span> topics
                            </span>
                        ) : (
                            'Explore Chassidic concepts and find all the sources that discuss them'
                        )}
                    </p>
                </header>

                {/* Search */}
                <div className="mb-6" role="search">
                    <ContextualSearch
                        placeholder="Search topics..."
                        searchType="topics"
                    />
                </div>

                {/* Featured Topic (only on first page, no category filter) */}
                {page === 1 && !category && (
                    <div className="mb-8">
                        <FeaturedTopicCard />
                    </div>
                )}

                {/* Featured Collections (only on first page, no category filter) */}
                {page === 1 && !category && (
                    <FeaturedCollections />
                )}

                {/* Category Chips */}
                <div className="mb-8">
                    <TopicCategoryChips />
                </div>

                {/* Topics List */}
                <section aria-label="Topics list">
                    <TopicsList
                        topics={topics}
                        currentPage={page}
                        totalPages={totalPages}
                        totalCount={totalCount}
                    />
                </section>
                </div>
            </main>
        </>
    );
}
