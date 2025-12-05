import { Topic } from '@/lib/directus';
import { MarkdownContent } from '@/components/shared/MarkdownContent';

interface TopicArticleProps {
    topic: Topic;
}

export function TopicArticle({ topic }: TopicArticleProps) {
    if (!topic.overview) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No article content available for this topic.</p>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <MarkdownContent content={topic.overview} />
        </section>
    );
}
