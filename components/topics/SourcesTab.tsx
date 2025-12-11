'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopicCitation, Location, Sefer } from '@/lib/directus';
import { ExternalLink } from 'lucide-react';

interface SourceWithRelationships {
    id: number;
    title: string;
    external_url?: string | null;
    relationships: {
        statement_id: number;
        relationship_type?: string;
        page_number?: string;
        verse_reference?: string;
    }[];
}

interface SourcesTabProps {
    sources: SourceWithRelationships[];
}

export default function SourcesTab({ sources }: SourcesTabProps) {
    if (!sources || sources.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No sources found for this topic yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                {sources.map((source) => (
                    <div key={source.id} className="rounded-lg border bg-card p-4">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-foreground">{source.title}</h3>
                            {source.external_url && (
                                <a
                                    href={source.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    View
                                </a>
                            )}
                        </div>
                        <div className="space-y-2">
                            {source.relationships.map((rel, index) => (
                                <div key={index} className="text-sm text-muted-foreground bg-muted/30 rounded px-2 py-1">
                                    {rel.relationship_type && <span className="font-medium">{rel.relationship_type}</span>}
                                    {rel.page_number && <span> • Page {rel.page_number}</span>}
                                    {rel.verse_reference && <span> • {rel.verse_reference}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
