import { Topic } from '@/lib/directus';
import { Sparkles, BookText } from 'lucide-react';
import Link from 'next/link';

interface RelatedTabProps {
    topic: Topic;
}

export default function RelatedTab({ topic }: RelatedTabProps) {
    // TODO: Fetch actual related topics based on relationships, categories, or key_concepts
    // For now, showing placeholder

    return (
        <div className="space-y-8">
            {/* Introduction */}
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6">
                <h2 className="text-xl font-semibold mb-2">Related Concepts</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Explore concepts that are closely connected to {topic.name} in Chassidic thought.
                </p>
            </div>

            {/* Placeholder for related topics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Related topics coming soon
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                        We're working on building topic relationships
                    </p>
                </div>
            </div>

            {/* Same Category Topics */}
            {topic.category && (
                <section>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <BookText className="h-5 w-5 text-primary" />
                        Same Category
                    </h3>
                    <div className="rounded-2xl border bg-card p-6">
                        <p className="text-sm text-muted-foreground">
                            Browse other topics in the "{topic.category}" category
                        </p>
                        <Link
                            href="/topics"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            View all {topic.category} topics →
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
