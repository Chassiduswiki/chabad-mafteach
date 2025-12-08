import directus from '@/lib/directus';
import { readItem } from '@directus/sdk';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const revalidate = 60;

async function getDocument(id: string) {
    try {
        // New schema: documents collection represents seforim
        return await directus.request(readItem('documents' as any, parseInt(id)));
    } catch (error) {
        return null;
    }
}

export default async function SeferPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocument(id);

    if (!doc) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">

                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        { label: 'Seforim', href: '/seforim' },
                        { label: doc.title, href: undefined }
                    ]}
                    className="mb-8"
                />

                {/* Header */}
                <div className="mb-12 rounded-3xl border border-border bg-background/50 p-8 shadow-sm backdrop-blur-sm sm:p-12">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{doc.title}</h1>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {doc.doc_type && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 capitalize">
                                        Type: <span className="font-medium text-foreground">{doc.doc_type}</span>
                                    </span>
                                )}
                                {doc.published_at && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                                        Published: <span className="font-medium text-foreground">{new Date(doc.published_at).getFullYear()}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chapter Grid / Navigation for this sefer (Tanya-style hub) */}
                <div>
                    <h2 className="mb-6 text-xl font-semibold">
                        Navigate Chapters
                    </h2>

                    {/* For now, show a simple grid of chapters 1-10. Only Perek 1 is fully wired with data. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((perek) => {
                            const content = (
                                <div
                                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-background/40 p-4 text-center text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                                >
                                    <span className="text-xs text-muted-foreground mb-1">Perek</span>
                                    <span className="text-lg font-semibold">{perek}</span>
                                    {perek === 1 && (
                                        <span className="mt-1 text-[11px] uppercase tracking-wide text-primary">Demo Available</span>
                                    )}
                                </div>
                            );

                            return perek === 1 ? (
                                <Link key={perek} href="/seforim/tanya-likkutei-amarim/1">
                                    {content}
                                </Link>
                            ) : (
                                <div key={perek}>{content}</div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
