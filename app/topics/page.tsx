import { Hash } from 'lucide-react';
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

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

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
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-4 pt-8 pb-32 sm:px-6 lg:px-8 lg:pt-12">

                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumbs items={[{ label: 'Topics' }]} />
                </div>

                {/* Header */}
                <div className="mb-8 text-center sm:text-left">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                        <Hash className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Topics & Concepts
                    </h1>
                    <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-2xl">
                        {category ? (
                            <span>
                                Showing <span className="font-semibold text-foreground capitalize">{category}</span> topics
                            </span>
                        ) : (
                            'Explore Chassidic concepts and find all the sources that discuss them'
                        )}
                    </p>
                </div>

                {/* Search */}
                <div className="mb-6">
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
                <TopicsList
                    topics={topics}
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                />
            </div>
        </div>
    );
}
