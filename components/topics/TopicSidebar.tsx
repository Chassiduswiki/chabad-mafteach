import { Topic, TopicRelationship } from '@/lib/directus';
import { Brain, GitGraph, Link as LinkIcon } from 'lucide-react';
import { safeJsonParse } from '@/lib/utils';
import Link from 'next/link';

interface TopicSidebarProps {
    topic: Topic;
    relationships?: TopicRelationship[];
}

export function TopicSidebar({ topic, relationships = [] }: TopicSidebarProps) {
    // Filter relationships to find related topics
    const relatedTopics = relationships?.map(rel => {
        // If the current topic is 'from', we want 'to'
        if (rel.from_topic && typeof rel.from_topic === 'object' && (rel.from_topic as any).id === topic.id) {
            return rel.to_topic;
        }
        // If the current topic is 'to', we want 'from'
        return rel.from_topic;
    }).filter(Boolean) as any[];

    return (
        <div className="space-y-8">
            {/* Related Topics Pills */}
            {relatedTopics && relatedTopics.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {relatedTopics.map((relatedTopic: any) => (
                            <Link
                                key={relatedTopic.id}
                                href={`/topics/${relatedTopic.slug}`}
                                className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                            >
                                {relatedTopic.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Concepts */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Key Concepts
                </h3>
                {(() => {
                    const keyConcepts = safeJsonParse(topic.key_concepts, []);
                    return keyConcepts && keyConcepts.length > 0 ? (
                        <ul className="space-y-3">
                            {keyConcepts.map((concept: any, idx: number) => (
                                <li key={idx} className="text-sm">
                                    <span className="font-medium text-foreground">{concept.concept}:</span>{' '}
                                    <span className="text-muted-foreground">{concept.explanation || concept.brief_explanation}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No key concepts listed.</p>
                    );
                })()}
            </div>


            {(() => {
                const confusions = safeJsonParse(topic.common_confusions, []);
                return confusions && confusions.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <GitGraph className="h-4 w-4 text-orange-500" />
                            Common Confusions
                        </h3>
                        <div className="space-y-4">
                            {confusions.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">"{item.question || item.confusion}"</p>
                                    <p className="text-sm text-muted-foreground">{item.answer || item.clarification}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
