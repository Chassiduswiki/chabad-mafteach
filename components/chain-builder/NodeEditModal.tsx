'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import type { IdeaNodeWithSource, ContributionType } from '@/lib/idea-chains/types';
import { CONTRIBUTION_TYPE_CONFIG } from '@/lib/idea-chains/types';

interface NodeEditModalProps {
    node: IdeaNodeWithSource | null;
    existingNodes: IdeaNodeWithSource[];
    onSave: (data: Partial<IdeaNodeWithSource> & { parent_node_ids?: number[] }) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}

interface SourceSearchResult {
    id: number;
    title: string;
    author_name: string | null;
    publication_year: number | null;
}

export function NodeEditModal({ node, existingNodes, onSave, onClose, isSaving }: NodeEditModalProps) {
    const isNew = !node;

    const [formData, setFormData] = useState({
        source_id: node?.source_id || null as number | null,
        citation_reference: node?.citation_reference || '',
        quote_hebrew: node?.quote_hebrew || '',
        quote_translated: node?.quote_translated || '',
        external_url: node?.external_url || '',
        contribution_type: (node?.contribution_type || 'expansion') as ContributionType,
        contribution_summary: node?.contribution_summary || '',
        contribution_summary_hebrew: node?.contribution_summary_hebrew || '',
        base_idea_summary: node?.base_idea_summary || '',
        approximate_year: node?.approximate_year || null as number | null,
        is_origin: node?.is_origin || false,
        parent_node_ids: [] as number[],
    });

    const [selectedSource, setSelectedSource] = useState<SourceSearchResult | null>(
        node?.source ? {
            id: node.source.id,
            title: node.source.title,
            author_name: node.source.author_name,
            publication_year: node.source.publication_year,
        } : null
    );

    // Source search state
    const [sourceSearch, setSourceSearch] = useState('');
    const [sourceResults, setSourceResults] = useState<SourceSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Search for sources
    useEffect(() => {
        if (sourceSearch.length < 2) {
            setSourceResults([]);
            return;
        }

        const searchSources = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/sources?search=${encodeURIComponent(sourceSearch)}&limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    setSourceResults(data.sources || data.data || []);
                }
            } catch (err) {
                console.error('Source search failed:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchSources, 300);
        return () => clearTimeout(debounce);
    }, [sourceSearch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.contribution_summary.trim()) {
            setError('Contribution summary is required');
            return;
        }

        try {
            await onSave({
                ...(node?.id ? { id: node.id } : {}),
                source_id: formData.source_id,
                citation_reference: formData.citation_reference || null,
                quote_hebrew: formData.quote_hebrew || null,
                quote_translated: formData.quote_translated || null,
                external_url: formData.external_url || null,
                contribution_type: formData.contribution_type,
                contribution_summary: formData.contribution_summary,
                contribution_summary_hebrew: formData.contribution_summary_hebrew || null,
                base_idea_summary: formData.base_idea_summary || null,
                approximate_year: formData.approximate_year,
                is_origin: formData.is_origin,
                parent_node_ids: formData.parent_node_ids,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    const selectSource = (source: SourceSearchResult) => {
        setSelectedSource(source);
        setFormData(prev => ({
            ...prev,
            source_id: source.id,
            approximate_year: source.publication_year || prev.approximate_year,
        }));
        setShowSourceDropdown(false);
        setSourceSearch('');
    };

    // Get potential parent nodes (excluding current node if editing)
    const potentialParents = existingNodes.filter(n => n.id !== node?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isNew ? 'Add Node' : 'Edit Node'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Source Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Source</label>
                            <div className="relative">
                                {selectedSource ? (
                                    <div className="flex items-center justify-between px-3 py-2 border border-border rounded-md bg-muted/50">
                                        <div>
                                            <span className="font-medium">{selectedSource.title}</span>
                                            {selectedSource.author_name && (
                                                <span className="text-muted-foreground"> by {selectedSource.author_name}</span>
                                            )}
                                            {selectedSource.publication_year && (
                                                <span className="text-muted-foreground"> ({selectedSource.publication_year})</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSource(null);
                                                setFormData(prev => ({ ...prev, source_id: null }));
                                            }}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={sourceSearch}
                                            onChange={(e) => {
                                                setSourceSearch(e.target.value);
                                                setShowSourceDropdown(true);
                                            }}
                                            onFocus={() => setShowSourceDropdown(true)}
                                            placeholder="Search for a source..."
                                            className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background"
                                        />
                                        {showSourceDropdown && (sourceResults.length > 0 || isSearching) && (
                                            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {isSearching ? (
                                                    <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                                                ) : (
                                                    sourceResults.map((source) => (
                                                        <button
                                                            key={source.id}
                                                            type="button"
                                                            onClick={() => selectSource(source)}
                                                            className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                                                        >
                                                            <span className="font-medium">{source.title}</span>
                                                            {source.author_name && (
                                                                <span className="text-muted-foreground"> - {source.author_name}</span>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Optional - link to an existing source</p>
                        </div>

                        {/* Citation Reference */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Chapter/Section Reference</label>
                            <input
                                type="text"
                                value={formData.citation_reference}
                                onChange={(e) => setFormData(prev => ({ ...prev, citation_reference: e.target.value }))}
                                placeholder="e.g., Chapter 2, Parshas Vayera"
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            />
                        </div>

                        {/* Contribution Type */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Contribution Type *</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(Object.entries(CONTRIBUTION_TYPE_CONFIG) as [ContributionType, typeof CONTRIBUTION_TYPE_CONFIG['origin']][]).map(([type, config]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                contribution_type: type,
                                                is_origin: type === 'origin',
                                            }));
                                        }}
                                        className={`p-3 rounded-md border text-left transition-colors ${
                                            formData.contribution_type === type
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="font-medium text-sm">{config.label}</div>
                                        <div className="text-xs text-muted-foreground">{config.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contribution Summary */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                What this source contributes *
                            </label>
                            <textarea
                                value={formData.contribution_summary}
                                onChange={(e) => setFormData(prev => ({ ...prev, contribution_summary: e.target.value }))}
                                placeholder="Describe how this source develops or applies the idea..."
                                rows={3}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                            />
                        </div>

                        {/* Quote Hebrew */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Quote (Hebrew)</label>
                            <textarea
                                value={formData.quote_hebrew}
                                onChange={(e) => setFormData(prev => ({ ...prev, quote_hebrew: e.target.value }))}
                                placeholder="Key quotation in Hebrew..."
                                rows={2}
                                dir="rtl"
                                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                            />
                        </div>

                        {/* Quote Translated */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Quote (Translation)</label>
                            <textarea
                                value={formData.quote_translated}
                                onChange={(e) => setFormData(prev => ({ ...prev, quote_translated: e.target.value }))}
                                placeholder="English translation..."
                                rows={2}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                            />
                        </div>

                        {/* Year and External URL */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Approximate Year</label>
                                <input
                                    type="number"
                                    value={formData.approximate_year || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        approximate_year: e.target.value ? parseInt(e.target.value) : null
                                    }))}
                                    placeholder="e.g., 1797"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Use negative for BCE</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">External Link</label>
                                <input
                                    type="url"
                                    value={formData.external_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                                    placeholder="https://sefaria.org/..."
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                />
                            </div>
                        </div>

                        {/* Parent Nodes (for new nodes) */}
                        {isNew && potentialParents.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Builds on</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded-md p-2">
                                    {potentialParents.map((parent) => (
                                        <label key={parent.id} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.parent_node_ids.includes(parent.id)}
                                                onChange={(e) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        parent_node_ids: e.target.checked
                                                            ? [...prev.parent_node_ids, parent.id]
                                                            : prev.parent_node_ids.filter(id => id !== parent.id)
                                                    }));
                                                }}
                                                className="h-4 w-4"
                                            />
                                            <span>{parent.source?.title || 'Unknown'}</span>
                                            {parent.approximate_year && (
                                                <span className="text-muted-foreground">({parent.approximate_year})</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Select which nodes this one builds upon</p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-border bg-muted/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>Save Node</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
