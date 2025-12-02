import { Topic, TopicRelationship } from '@/lib/directus';
import { Brain } from 'lucide-react';
import Link from 'next/link';

interface TopicRelatedProps {
    topic: Topic;
    relationships: TopicRelationship[];
}

export function TopicRelated({ topic, relationships }: TopicRelatedProps) {
    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Related Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relationships.map(rel => {
                    // Determine which topic is the "other" one
                    const fromTopic = rel.from_topic as Topic;
                    const toTopic = rel.to_topic as Topic;
                    const otherTopic = fromTopic.id === topic.id ? toTopic : fromTopic;

                    return (
                        <Link
                            key={rel.id}
                            href={`/topics/${otherTopic.slug}`}
                            className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                <Brain className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold group-hover:text-primary transition-colors">{otherTopic.name}</h4>
                                <p className="text-xs text-muted-foreground capitalize">{rel.relationship_type.replace('_', ' ')}</p>
                            </div>
                        </Link>
                    );
                })}
                {relationships.length === 0 && (
                    <p className="text-muted-foreground italic col-span-2">No related topics linked yet.</p>
                )}
            </div>
        </section>
    );
}
