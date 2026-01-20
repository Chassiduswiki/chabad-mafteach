import type { Topic } from '@/lib/types';
import { ArticleWithStructure } from './ArticleWithStructure';

interface TopicArticleProps {
    topic: Topic;
}

export function TopicArticle({ topic }: TopicArticleProps) {
    // Check if this topic has a document (entry article)
    if (topic.id) {
        return <ArticleWithStructure topicId={topic.id} topicTitle={topic.canonical_title} />;
    }

    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>No article content available for this topic.</p>
        </div>
    );
}
