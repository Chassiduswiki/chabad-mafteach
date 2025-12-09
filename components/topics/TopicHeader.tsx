import { Topic } from '@/lib/directus';

interface TopicHeaderProps {
    topic: Topic;
}

export function TopicHeader({ topic }: TopicHeaderProps) {
    return (
        <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-12">
            <div className="mb-6 mt-6">
                <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                        {topic.topic_type || topic.category || 'Concept'}
                    </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {topic.canonical_title || topic.name}
                </h1>

                {topic.description && (
                    <div className="mt-6">
                        <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl">
                            {topic.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

