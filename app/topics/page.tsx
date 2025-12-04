import { Hash } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Topic } from '@/lib/directus';
import { TopicsList } from '@/components/topics/TopicsList';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Suspense } from 'react';
import { TopicsListSkeleton } from '@/components/topics/TopicsListSkeleton';

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic';

async function getTopics(limit: number, offset: number): Promise<{ topics: Topic[]; totalCount: number }> {
    try {
        // Get paginated topics
        // @ts-ignore
        const topics = await directus.request(readItems('topics', {
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short'],
            limit,
            offset,
            filter: { is_published: { _eq: true } }
        }));

        // Get total count - using meta from original query
        // Note: This is a workaround - ideally we'd use separate aggregate query
        // but TypeScript doesn't recognize the aggregate response type
        const allPublishedTopics = await directus.request(readItems('topics', {
            fields: ['id'],
            filter: { is_published: { _eq: true } }
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
    searchParams: { page?: string }
}) {
    // Pagination settings
    const page = Number(searchParams.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    // Get topics with pagination
    const { topics, totalCount } = await getTopics(limit, offset);
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
                        Explore Chassidic concepts and find all the sources that discuss them
                    </p>
                </div>

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
    );
}
