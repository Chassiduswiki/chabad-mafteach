import { Topic } from '@/lib/directus';
import { Brain, GitGraph } from 'lucide-react';
import { safeJsonParse } from '@/lib/utils';

interface TopicSidebarProps {
    topic: Topic;
}

export function TopicSidebar({ topic }: TopicSidebarProps) {
    return (
        <div className="space-y-8">
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
