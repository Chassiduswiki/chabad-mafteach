import { Topic } from '@/lib/directus';
import { Sparkles, BookText } from 'lucide-react';
import Link from 'next/link';

interface RelatedTabProps {
    topic: Topic;
    relatedTopics?: any[];
}

export default function RelatedTab({ topic, relatedTopics = [] }: RelatedTabProps) {
    // TODO: Fetch actual related topics based on relationships, categories, or key_concepts
    // For now, showing placeholder

    return (
        <div className="space-y-8">
            {/* Related Topics */}
            {relatedTopics.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {relatedTopics.map((relatedTopic: any) => (
                        <Link
                            key={relatedTopic.id}
                            href={`/topics/${relatedTopic.slug}`}
                            className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {relatedTopic.canonical_title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {relatedTopic.description || 'No description available'}
                                    </p>
                                    {relatedTopic.relationship && (
                                        <div className="mt-3">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {relatedTopic.relationship.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Sparkles className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
                        <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">
                            No related topics found
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/70">
                            Topic relationships will be established as content grows
                        </p>
                    </div>
                </div>
            )}

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
