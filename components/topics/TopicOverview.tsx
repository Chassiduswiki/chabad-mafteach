import { Topic } from '@/lib/directus';
import { MarkdownContent } from '@/components/MarkdownContent';

interface TopicOverviewProps {
    topic: Topic;
}

export function TopicOverview({ topic }: TopicOverviewProps) {
    return (
        <div className="space-y-8">
            {/* At a Glance Section */}
            {topic.definition_short && (
                <div className="rounded-xl border bg-card/50 p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">At a Glance</h3>
                    <div className="prose prose-sm dark:prose-invert">
                        <MarkdownContent content={topic.definition_short} />
                    </div>
                </div>
            )}

            {/* Overview Content */}
            {topic.overview && (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <MarkdownContent content={topic.overview} />
                </div>
            )}

            {/* Historical Context */}
            {topic.historical_context && (
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-primary">Historical Context</h3>
                    <div className="prose prose-sm dark:prose-invert">
                        <MarkdownContent content={topic.historical_context} />
                    </div>
                </div>
            )}
        </div>
    );
}
