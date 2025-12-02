import { TopicCitation } from '@/lib/directus';
import { getHebrewBooksUrl } from '@/lib/hebrewbooks';
import { ExternalLink } from 'lucide-react';

interface SourceCardProps {
    citation: any; // Using any because of nested expansion typing issues
}

const roleIcons: Record<string, string> = {
    definition: '📖',
    boundary: '⛔',
    explanation: '💡',
    comparison: '⚖️',
    practical: '🎯',
    historical: '📜',
    commentary: '💬',
    example: '✨'
};

const roleLabels: Record<string, string> = {
    definition: 'Definition',
    boundary: 'Boundary',
    explanation: 'Explanation',
    comparison: 'Comparison',
    practical: 'Practical Application',
    historical: 'Historical Context',
    commentary: 'Commentary',
    example: 'Example'
};

const importanceStars: Record<string, string> = {
    foundational: '★★★',
    key: '★★',
    supporting: '★',
    reference: ''
};

export default function SourceCard({ citation }: SourceCardProps) {
    const location = citation.location || {};
    const sefer = location.sefer || {};
    const hebrewBooksId = sefer.hebrewbooks_id;

    const roleIcon = roleIcons[citation.citation_role] || '📄';
    const roleLabel = roleLabels[citation.citation_role] || citation.citation_role;
    const stars = citation.importance ? (importanceStars[citation.importance] || '') : '';

    return (
        <div className="rounded-2xl border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg">
            {/* Header with Role and Importance */}
            <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{roleIcon}</span>
                    <span className="text-sm font-medium text-muted-foreground">{roleLabel}</span>
                </div>
                {stars && (
                    <span className="text-amber-500" title={citation.importance}>
                        {stars}
                    </span>
                )}
            </div>

            {/* Quoted Text */}
            {(citation.quoted_text || citation.quoted_text_english) && (
                <blockquote className="mb-4 border-l-4 border-primary pl-4">
                    {citation.quoted_text_english && (
                        <p className="text-sm leading-relaxed text-foreground">
                            "{citation.quoted_text_english}"
                        </p>
                    )}
                    {citation.quoted_text && (
                        <p className="mt-2 font-hebrew text-sm leading-relaxed text-muted-foreground dir-rtl">
                            "{citation.quoted_text}"
                        </p>
                    )}
                </blockquote>
            )}

            {/* Context Note */}
            {citation.context_note && (
                <p className="mb-4 text-sm text-muted-foreground italic">
                    {citation.context_note}
                </p>
            )}

            {/* Attribution */}
            <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm">
                    <p className="font-medium text-foreground">
                        {sefer.title || 'Unknown Sefer'}
                        {sefer.title_hebrew && (
                            <span className="ml-2 font-hebrew text-muted-foreground">
                                ({sefer.title_hebrew})
                            </span>
                        )}
                    </p>
                    <p className="text-muted-foreground">
                        {location.reference_text || 'Unknown location'}
                        {citation.page_reference && ` • ${citation.page_reference}`}
                    </p>
                    {sefer.author && (
                        <p className="text-xs text-muted-foreground">by {sefer.author}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    {hebrewBooksId && (
                        <a
                            href={getHebrewBooksUrl(hebrewBooksId, citation.page_reference)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                        >
                            <ExternalLink className="h-3 w-3" />
                            HebrewBooks
                        </a>
                    )}
                    <button className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
                        View in Context →
                    </button>
                </div>
            </div>
        </div>
    );
}
