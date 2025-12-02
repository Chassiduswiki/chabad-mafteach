import { Topic } from '@/lib/directus';
import { MarkdownContent } from '@/components/MarkdownContent';

interface TopicOverviewProps {
    topic: Topic;
}

export function TopicOverview({ topic }: TopicOverviewProps) {
    return (
        <div className="space-y-8">
            {/* Definitions Section */}
            <div className="grid gap-6 md:grid-cols-1">
                {topic.definition_short ? (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-3 text-lg font-semibold text-primary">Definition</h3>
                        <div className="prose prose-sm dark:prose-invert">
                            <MarkdownContent content={topic.definition_short} />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="mb-3 text-lg font-semibold text-primary">Definition</h3>
                        <p className="text-muted-foreground italic">No definition available.</p>
                    </div>
                )}
            </div>



            {/* Historical Context Section */}
            {topic.historical_context && (
                <div className="rounded-xl border bg-muted/30 p-6">
                    <h3 className="mb-3 text-lg font-semibold">Historical Context</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none italic text-muted-foreground">
                        <MarkdownContent content={topic.historical_context} />
                    </div>
                </div>
            )}
        </div>
    );
}
