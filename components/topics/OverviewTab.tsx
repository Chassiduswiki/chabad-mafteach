'use client';

import { Topic } from '@/lib/types';
import { BookOpen, Target, Lightbulb, Clock, Info } from 'lucide-react';

interface OverviewTabProps {
    topic: Topic;
}

export default function OverviewTab({ topic }: OverviewTabProps) {
    const hasRichContent = topic.overview || topic.article || topic.practical_takeaways || topic.historical_context;

    if (!hasRichContent && !topic.description) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <Info className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No Overview Available</h3>
                <p className="text-sm max-w-md mx-auto px-6">
                    This topic is currently being researched. Check back soon for a comprehensive overview.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Overview / Article */}
            {(topic.overview || topic.article) && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    {topic.overview && (
                        <div
                            className="text-lg leading-relaxed mb-8"
                            dangerouslySetInnerHTML={{ __html: topic.overview }}
                        />
                    )}
                    {topic.article && (
                        <div
                            className="mt-8 border-t border-border pt-8"
                            dangerouslySetInnerHTML={{ __html: topic.article }}
                        />
                    )}
                </div>
            )}

            {/* Quick Insights Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
                {topic.definition_positive && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Target className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-foreground">Core Definition</h3>
                        </div>
                        <div className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: topic.definition_positive }} />
                    </div>
                )}

                {topic.practical_takeaways && (
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-foreground">Practical Takeaway</h3>
                        </div>
                        <div className="text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: topic.practical_takeaways }} />
                    </div>
                )}
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
                {topic.difficulty_level && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Info className="h-3 w-3" />
                        Level: <span className="text-foreground capitalize">{topic.difficulty_level}</span>
                    </div>
                )}
                {topic.estimated_read_time && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {topic.estimated_read_time} min read
                    </div>
                )}
            </div>
        </div>
    );
}
