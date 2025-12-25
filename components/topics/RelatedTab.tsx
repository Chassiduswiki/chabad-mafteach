import { Topic } from '@/lib/types';
import { Sparkles, BookText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RelatedTabProps {
    topic: Topic;
    relatedTopics?: any[];
}

export default function RelatedTab({ topic, relatedTopics = [] }: RelatedTabProps) {
    if (relatedTopics.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Network Still Growing</h3>
                <p className="text-sm max-w-md mx-auto px-6">
                    Connections between this concept and others in Chassidic literature are currently being mapped.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 sm:grid-cols-2">
                {relatedTopics.map((related: any) => (
                    <Link
                        key={related.id}
                        href={`/topics/${related.slug}`}
                        className="group relative flex flex-col p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            {related.relationship && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-widest">
                                    {related.relationship.type?.replace('_', ' ') || 'Related'}
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {related.canonical_title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {related.description || 'No description available'}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            Explore Concept <ArrowRight className="ml-2 h-3 w-3" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Same Category Context */}
            {topic.topic_type && (
                <div className="p-8 rounded-2xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3 mb-4">
                        <BookText className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-foreground">Categorical Context</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                        This topic is categorized as a <span className="text-foreground font-medium">{topic.topic_type}</span>.
                        Browsing related categories can help you understand the broader conceptual framework.
                    </p>
                    <Link
                        href="/topics"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all"
                    >
                        View all {topic.topic_type} concepts <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
