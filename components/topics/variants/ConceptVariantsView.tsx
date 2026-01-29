'use client';

import React from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { ConceptualVariant, Source } from '@/lib/types';

interface ConceptVariantsViewProps {
    variants: ConceptualVariant[];
    sources: Source[];
}

/**
 * ConceptVariantsView - Display scholarly perspectives on a concept
 * 
 * Shows different conceptual framings from authoritative sources
 * (e.g., Tanya perspective, Kabbalistic background, etc.)
 */
export function ConceptVariantsView({ variants, sources }: ConceptVariantsViewProps) {
    const [expandedVariants, setExpandedVariants] = React.useState<Set<number>>(new Set([0])); // First variant expanded by default

    if (!variants || variants.length === 0) {
        return null;
    }

    // Sort variants by order if specified
    const sortedVariants = [...variants].sort((a, b) => (a.order || 0) - (b.order || 0));

    const toggleVariant = (index: number) => {
        setExpandedVariants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const getVariantTypeLabel = (type: ConceptualVariant['type']): string => {
        const labels: Record<ConceptualVariant['type'], string> = {
            tanya_framing: 'In Tanya',
            kabbalistic_background: 'Kabbalistic Roots',
            later_development: 'Later Development',
            tension_point: 'Scholarly Tension',
            custom: 'Alternative Perspective'
        };
        return labels[type] || type;
    };

    const getVariantTypeColor = (type: ConceptualVariant['type']): string => {
        const colors: Record<ConceptualVariant['type'], string> = {
            tanya_framing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            kabbalistic_background: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            later_development: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            tension_point: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            custom: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
        };
        return colors[type] || colors.custom;
    };

    const getAuthorityBadge = (sourceId: string): { label: string; color: string } | null => {
        const source = sources.find(s => s.id.toString() === sourceId);
        if (!source?.authority_level) return null;

        const badges: Record<string, { label: string; color: string }> = {
            foundational: { label: 'Foundational', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30' },
            explanatory: { label: 'Explanatory', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' },
            contextual: { label: 'Contextual', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30' },
            supplementary: { label: 'Supplementary', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30' }
        };

        return badges[source.authority_level] || null;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Scholarly Perspectives</h3>
                <span className="text-xs text-muted-foreground">({sortedVariants.length})</span>
            </div>

            <div className="space-y-3">
                {sortedVariants.map((variant, index) => {
                    const isExpanded = expandedVariants.has(index);
                    const variantLabel = variant.title || getVariantTypeLabel(variant.type);

                    return (
                        <div
                            key={index}
                            className="border border-border rounded-lg overflow-hidden bg-card/50 hover:bg-card transition-colors"
                        >
                            {/* Header */}
                            <button
                                onClick={() => toggleVariant(index)}
                                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                                aria-expanded={isExpanded}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getVariantTypeColor(variant.type)}`}>
                                        {getVariantTypeLabel(variant.type)}
                                    </span>
                                    <span className="font-medium text-foreground truncate">
                                        {variantLabel}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                            </button>

                            {/* Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                                    {/* Variant content */}
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none mb-3"
                                        dangerouslySetInnerHTML={{ __html: variant.content }}
                                    />

                                    {/* Source badges */}
                                    {variant.sources && variant.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {variant.sources.map((sourceId, idx) => {
                                                const badge = getAuthorityBadge(sourceId);
                                                const source = sources.find(s => s.id.toString() === sourceId);

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="inline-flex items-center gap-2 text-xs"
                                                    >
                                                        {badge && (
                                                            <span className={`px-2 py-1 rounded-full border font-medium ${badge.color}`}>
                                                                {badge.label}
                                                            </span>
                                                        )}
                                                        {source && (
                                                            <span className="text-muted-foreground">
                                                                {source.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
