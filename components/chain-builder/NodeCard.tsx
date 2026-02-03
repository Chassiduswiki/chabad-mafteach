'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GripVertical, Trash2, ChevronDown, ExternalLink, Pencil,
    BookOpen, Link2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { IdeaNodeWithSource, ContributionType } from '@/lib/idea-chains/types';

// Contribution type configuration - minimal
const CONTRIBUTION_CONFIG: Record<ContributionType, { label: string }> = {
    origin: { label: 'Origin' },
    expansion: { label: 'Expansion' },
    application: { label: 'Application' },
    counterpoint: { label: 'Counterpoint' },
    synthesis: { label: 'Synthesis' },
    reframe: { label: 'Reframe' },
};

interface NodeCardProps {
    node: IdeaNodeWithSource;
    index: number;
    totalNodes: number;
    onEdit: () => void;
    onDelete: () => void;
    parentNodes?: IdeaNodeWithSource[];
}

// Format year display
function formatYear(year: number): string {
    return year > 0 ? `c. ${year}` : `c. ${Math.abs(year)} BCE`;
}

export function NodeCard({ node, index, onEdit, onDelete, parentNodes = [] }: NodeCardProps) {
    const [expanded, setExpanded] = useState(false);
    const config = CONTRIBUTION_CONFIG[node.contribution_type];
    const isOrigin = node.is_origin || node.contribution_type === 'origin';
    const displayName = node.source?.title || node.citation_reference || config.label;

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            <Card className={isOrigin ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20' : ''}>
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Drag handle and position */}
                        <div className="flex flex-col items-center pt-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 mb-1" />
                            <span className="text-xs font-medium">{index + 1}</span>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Source title and metadata */}
                                    <h3 className="font-medium text-foreground">
                                        {displayName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {config.label}
                                        {node.citation_reference && node.source?.title && (
                                            <> • {node.citation_reference}</>
                                        )}
                                        {node.approximate_year && (
                                            <> • {formatYear(node.approximate_year)}</>
                                        )}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={onEdit}
                                        className="p-2 text-muted-foreground hover:text-foreground rounded"
                                        title="Edit node"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="p-2 text-muted-foreground hover:text-red-500 rounded"
                                        title="Delete node"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    {(node.quote_hebrew || node.base_idea_summary || node.external_url) && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className="p-2 text-muted-foreground hover:text-foreground rounded"
                                            title={expanded ? "Collapse" : "Expand"}
                                        >
                                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Contribution summary */}
                            <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                                {node.contribution_summary}
                            </p>

                            {/* Parent relationships */}
                            {parentNodes.length > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    <Link2 className="h-3 w-3 inline mr-1" />
                                    Builds on: {parentNodes.map(p => p.source?.title?.split(' ')[0] || 'Node').join(', ')}
                                </p>
                            )}

                            {/* Expanded content */}
                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                                            {/* Hebrew Quote */}
                                            {node.quote_hebrew && (
                                                <div className="border-l-2 border-border pl-4">
                                                    <p className="font-serif text-lg leading-relaxed" dir="rtl">
                                                        {node.quote_hebrew}
                                                    </p>
                                                    {node.quote_translated && (
                                                        <p className="mt-2 text-sm text-muted-foreground italic">
                                                            "{node.quote_translated}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Key insight */}
                                            {node.base_idea_summary && (
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="font-medium">Key insight:</span> {node.base_idea_summary}
                                                </p>
                                            )}

                                            {/* External link */}
                                            {node.external_url && (
                                                <a
                                                    href={node.external_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    View source
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Simple connection line between cards
export function NodeConnector() {
    return (
        <div className="flex justify-center py-1">
            <div className="w-px h-8 bg-border" />
        </div>
    );
}
