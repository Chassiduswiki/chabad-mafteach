import { Topic } from '@/lib/directus';
import { MarkdownContent } from '@/components/MarkdownContent';

interface TopicBoundariesProps {
    topic: Topic;
}

export function TopicBoundaries({ topic }: TopicBoundariesProps) {
    // Combine both definitions to ensure footnotes render at the bottom
    const combinedContent = [
        topic.definition_positive ? `## What It Is\n\n${topic.definition_positive}` : '',
        topic.definition_negative ? `## What It Is Not\n\n${topic.definition_negative}` : ''
    ].filter(Boolean).join('\n\n');

    if (!combinedContent) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No boundaries defined for this topic yet.
            </div>
        );
    }

    return (
        <section className="space-y-8">
            <MarkdownContent
                content={combinedContent}
                className="boundaries-content"
            />
        </section>
    );
}
