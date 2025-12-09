import { BookOpen } from 'lucide-react';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Document } from '@/lib/directus';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Suspense } from 'react';

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic';

async function getSeforim(): Promise<Document[]> {
    try {
        const result = await directus.request(readItems('documents', {
            filter: { doc_type: { _eq: 'sefer' } },
            fields: ['id', 'title', 'doc_type', 'author', 'category'],
            sort: ['title'],
            limit: -1
        }));

        const docsArray = Array.isArray(result) ? result : result ? [result] : [];
        return docsArray.map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            doc_type: doc.doc_type,
            author: doc.author,
            category: doc.category,
        }));
    } catch (error) {
        console.error('Failed to fetch seforim:', error);
        return [];
    }
}

export default async function SeforimPage() {
    const seforim = await getSeforim();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 sm:px-8 sm:py-16">

                <div className="mb-8">
                    <Breadcrumbs
                        items={[
                            { label: 'Sources' }
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                        <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Sources & Seforim
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Browse the Chabad literature collection and explore source texts
                    </p>
                </div>

                {/* Seforim List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {seforim.map((sefer) => (
                        <div
                            key={sefer.id}
                            className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                        {sefer.title}
                                    </h3>
                                    {sefer.author && (
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            by {sefer.author}
                                        </p>
                                    )}
                                    {sefer.category && (
                                        <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {sefer.category}
                                        </span>
                                    )}
                                </div>
                                <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                            </div>
                        </div>
                    ))}
                </div>

                {seforim.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No sources found</h3>
                        <p className="text-muted-foreground">Sources will appear here once they are added to the system.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
