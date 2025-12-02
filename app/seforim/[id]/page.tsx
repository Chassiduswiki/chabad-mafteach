import directus from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { BookOpen, MapPin, Quote } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const revalidate = 60;

async function getSefer(id: string) {
    try {
        return await directus.request(readItem('seforim', parseInt(id)));
    } catch (error) {
        return null;
    }
}

async function getLocations(seferId: string) {
    try {
        return await directus.request(readItems('locations', {
            filter: { sefer: { _eq: parseInt(seferId) } },
            fields: ['id', 'reference_text', 'reference_hebrew', 'location_type', 'full_path'],
            sort: ['sort_order']
        }));
    } catch (error) {
        return [];
    }
}

export default async function SeferPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sefer = await getSefer(id);

    if (!sefer) {
        notFound();
    }

    const locations = await getLocations(id);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">

                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        { label: 'Seforim', href: '/seforim' },
                        { label: sefer.title, href: undefined }
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
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{sefer.title}</h1>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {sefer.author && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                                        Author: <span className="font-medium text-foreground">{sefer.author}</span>
                                    </span>
                                )}
                                {sefer.year_published && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                                        Published: <span className="font-medium text-foreground">{sefer.year_published}</span>
                                    </span>
                                )}
                                {sefer.category && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 capitalize">
                                        Category: <span className="font-medium text-foreground">{sefer.category}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content / Locations */}
                <div>
                    <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Indexed Locations
                    </h2>

                    {locations.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {locations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="group relative flex items-center justify-between rounded-xl border border-border bg-background/40 p-4 transition-all hover:border-primary/20 hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Quote className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="font-medium">{loc.reference_text}</span>
                                            {loc.reference_hebrew && (
                                                <span className="mr-2 text-sm text-muted-foreground"> • {loc.reference_hebrew}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Placeholder for future citation count or link */}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                            No locations indexed for this sefer yet.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
