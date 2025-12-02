import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const revalidate = 60; // Revalidate every minute

async function getSeforim() {
    try {
        return await directus.request(readItems('seforim', {
            sort: ['title'],
            fields: ['id', 'title', 'category', 'author', 'year_published']
        }));
    } catch (error) {
        console.error('Failed to fetch seforim:', error);
        return [];
    }
}

export default async function SeforimPage() {
    const seforim = await getSeforim();

    // Group by category
    const grouped = seforim.reduce((acc, sefer) => {
        const cat = sefer.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(sefer);
        return acc;
    }, {} as Record<string, typeof seforim>);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
                <Breadcrumbs
                    items={[
                        { label: 'Seforim', href: undefined }
                    ]}
                    className="mb-8"
                />
                <div className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Seforim Library</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Explore the collection of Chassidic and Torah texts indexed in our system.
                    </p>
                </div>

                <div className="space-y-16">
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <h2 className="mb-6 text-2xl font-semibold capitalize flex items-center gap-3">
                                <span className="h-px flex-1 bg-border"></span>
                                {category}
                                <span className="h-px flex-1 bg-border"></span>
                            </h2>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((sefer) => (
                                    <Link
                                        key={sefer.id}
                                        href={`/seforim/${sefer.id}`}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background/50 p-6 transition-all hover:border-primary/20 hover:bg-accent/50 hover:shadow-lg hover:shadow-primary/5"
                                    >
                                        <div>
                                            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {sefer.title}
                                            </h3>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {sefer.author && <p>{sefer.author}</p>}
                                                {sefer.year_published && <p>{sefer.year_published}</p>}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
