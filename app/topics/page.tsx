import { Hash } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Topic } from '@/lib/directus';
import { TopicsList } from '@/components/topics/TopicsList';
import { Breadcrumbs } from '@/components/Breadcrumbs';

async function getTopics(): Promise<Topic[]> {
    try {
        const topics = await directus.request(readItems('topics', {
            sort: ['name'],
            fields: ['id', 'name', 'name_hebrew', 'slug', 'category', 'definition_short']
        }));
        return topics as Topic[];
    } catch (error) {
        console.error('Failed to fetch topics:', error);
        return [];
    }
}

export default async function TopicsPage() {
    const topics = await getTopics();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 sm:py-16">

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

                <TopicsList topics={topics} />
            </div>
        </div>
    );
}
