import { Hash } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Topic } from '@/lib/directus';
import { TopicsList } from '@/components/topics/TopicsList';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Suspense } from 'react';
import { TopicsListSkeleton } from '@/components/topics/TopicsListSkeleton';
import { ContextualSearch } from '@/components/features/search/ContextualSearch';
import { IndexSidebar } from '@/components/layout/IndexSidebar';

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic';

async function getTopics(limit: number, offset: number, category?: string): Promise<{ topics: Topic[]; totalCount: number }> {
    try {
        // Build filter - add category if provided
        const filter: any = { is_published: { _eq: true } };
        if (category) {
            filter.category = { _eq: category };
        }

        // Get paginated topics
        // @ts-ignore
        const topics = await directus.request(readItems('topics', {
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
            limit,
            offset,
            filter
        }));

        // Get total count with same filter
        const allPublishedTopics = await directus.request(readItems('topics', {
            fields: ['id'],
            filter
        }));

        const totalCount = Array.isArray(allPublishedTopics) ? allPublishedTopics.length : 0;

        return { topics: topics as Topic[], totalCount };
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return { topics: [], totalCount: 0 };
    }
}

export default async function TopicsPage({
    searchParams
}: {
    searchParams: { page?: string; category?: string }
}) {
    // Pagination settings
    const page = Number(searchParams.page) || 1;
    const category = searchParams.category;
    const limit = 50;
    const offset = (page - 1) * limit;

    // Get topics with pagination and optional category filter
    const { topics, totalCount } = await getTopics(limit, offset, category);
    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 sm:px-8 sm:py-16">

                <div className="mb-8">
                    <Breadcrumbs
                        items={[
                            { label: 'Topics' }
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                        <Hash className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Topics & Concepts
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        {category ? (
                            <span>
                                Showing <span className="font-semibold text-foreground capitalize">{category}</span> topics
                            </span>
                        ) : (
                            'Explore Chassidic concepts and find all the sources that discuss them'
                        )}
                    </p>

                    {/* Contextual Search - Task 2.6 */}
                    <div className="mt-8 flex justify-center">
                        <ContextualSearch
                            placeholder="Search topics..."
                            searchType="topics"
                        />
                    </div>
                </div>

                <div className="flex gap-8">
                    <IndexSidebar />

                    <div className="flex-1">
                        <Suspense fallback={<TopicsListSkeleton />}>
                            <TopicsList
                                topics={topics}
                                currentPage={page}
                                totalPages={totalPages}
                                totalCount={totalCount}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
