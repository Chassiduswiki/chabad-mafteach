import { TopicCitation } from '@/lib/directus';
import SourceCard from './SourceCard';

interface TopicSourcesProps {
    citations: TopicCitation[];
}

export function TopicSources({ citations }: TopicSourcesProps) {
    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Primary Sources</h2>
            <div className="space-y-4">
                {citations.map(citation => (
                    <SourceCard key={citation.id} citation={citation} />
                ))}
                {citations.length === 0 && (
                    <p className="text-muted-foreground italic">No sources listed yet.</p>
                )}
            </div>
        </section>
    );
}
