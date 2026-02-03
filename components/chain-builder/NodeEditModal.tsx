'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Loader2, Search, Eye, EyeOff, AlertCircle,
    Sparkles, ArrowRight, Target, Scale, Merge, RefreshCw,
    BookOpen, Quote, Lightbulb
} from 'lucide-react';
import type { IdeaNodeWithSource, ContributionType } from '@/lib/idea-chains/types';
import { CONTRIBUTION_TYPE_CONFIG } from '@/lib/idea-chains/types';

// Enhanced contribution config with icons
const CONTRIBUTION_ICONS: Record<ContributionType, React.ReactNode> = {
    origin: <Sparkles className="h-4 w-4" />,
    expansion: <ArrowRight className="h-4 w-4" />,
    application: <Target className="h-4 w-4" />,
    counterpoint: <Scale className="h-4 w-4" />,
    synthesis: <Merge className="h-4 w-4" />,
    reframe: <RefreshCw className="h-4 w-4" />,
};

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
    const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState<'source' | 'content' | 'context'>('source');

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
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.contribution_summary.trim()) {
            errors.contribution_summary = 'Describe what this source contributes to the idea';
        }

        if (formData.contribution_type === 'origin' && !formData.quote_hebrew.trim()) {
            errors.quote_hebrew = 'Origin nodes should include the source text in Hebrew';
        }

        if (formData.external_url && !formData.external_url.startsWith('http')) {
            errors.external_url = 'Please enter a valid URL starting with http:// or https://';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
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

    // Get display name for preview
    const displayName = selectedSource?.title || formData.citation_reference || CONTRIBUTION_TYPE_CONFIG[formData.contribution_type].label;

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

    const config = CONTRIBUTION_TYPE_CONFIG[formData.contribution_type];
    const isOrigin = formData.is_origin || formData.contribution_type === 'origin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-background border border-border rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
                    showPreview ? 'max-w-5xl' : 'max-w-2xl'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOrigin ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                            {CONTRIBUTION_ICONS[formData.contribution_type]}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                {isNew ? 'Add Node' : 'Edit Node'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {config.description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                showPreview
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                        >
                            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            Preview
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Form + Preview Layout */}
                <div className={`flex-1 overflow-hidden flex ${showPreview ? 'flex-row' : 'flex-col'}`}>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto ${showPreview ? 'border-r border-border' : ''}`}>
                        <div className="p-6 space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3"
                                >
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
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
                            <label className="block text-sm font-medium text-foreground mb-2">
                                How does this source contribute? *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(Object.entries(CONTRIBUTION_TYPE_CONFIG) as [ContributionType, typeof CONTRIBUTION_TYPE_CONFIG['origin']][]).map(([type, typeConfig]) => {
                                    const isSelected = formData.contribution_type === type;
                                    const isOriginType = type === 'origin';
                                    return (
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
                                            className={`group p-3 rounded-lg border text-left transition-all ${
                                                isSelected
                                                    ? isOriginType
                                                        ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10'
                                                        : 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`${isSelected ? (isOriginType ? 'text-amber-500' : 'text-primary') : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                                                    {CONTRIBUTION_ICONS[type]}
                                                </span>
                                                <span className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                    {typeConfig.label}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                {typeConfig.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Contribution Summary */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                What this source contributes *
                            </label>
                            <textarea
                                value={formData.contribution_summary}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, contribution_summary: e.target.value }));
                                    if (validationErrors.contribution_summary) {
                                        setValidationErrors(prev => ({ ...prev, contribution_summary: '' }));
                                    }
                                }}
                                placeholder="Describe how this source develops or applies the idea..."
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-lg bg-background resize-none transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                                    validationErrors.contribution_summary ? 'border-red-500' : 'border-border'
                                }`}
                            />
                            {validationErrors.contribution_summary && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {validationErrors.contribution_summary}
                                </p>
                            )}
                        </div>

                        {/* Quote Hebrew */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Quote className="h-4 w-4 text-muted-foreground" />
                                    Quote (Hebrew)
                                    {isOrigin && <span className="text-xs text-amber-500">Recommended for origin</span>}
                                </label>
                            </div>
                            <textarea
                                value={formData.quote_hebrew}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, quote_hebrew: e.target.value }));
                                    if (validationErrors.quote_hebrew) {
                                        setValidationErrors(prev => ({ ...prev, quote_hebrew: '' }));
                                    }
                                }}
                                placeholder="הכנס את הציטוט בעברית..."
                                rows={3}
                                dir="rtl"
                                className={`w-full px-3 py-2 border rounded-lg bg-background resize-none transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary font-serif text-lg ${
                                    validationErrors.quote_hebrew ? 'border-red-500' : 'border-border'
                                }`}
                            />
                            {validationErrors.quote_hebrew && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {validationErrors.quote_hebrew}
                                </p>
                            )}
                        </div>

                        {/* Quote Translated */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Quote (Translation)</label>
                            <textarea
                                value={formData.quote_translated}
                                onChange={(e) => setFormData(prev => ({ ...prev, quote_translated: e.target.value }))}
                                placeholder="English translation of the Hebrew quote..."
                                rows={2}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Builds upon
                                </label>
                                <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded-lg p-3 bg-muted/30">
                                    {potentialParents.map((parent) => (
                                        <label key={parent.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-background/50 p-1.5 rounded transition-colors">
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
                                                className="h-4 w-4 rounded border-border"
                                            />
                                            <span className="font-medium">{parent.source?.title || 'Unknown'}</span>
                                            {parent.approximate_year && (
                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {parent.approximate_year > 0 ? parent.approximate_year : `${Math.abs(parent.approximate_year)} BCE`}
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Select which earlier nodes this one references or builds upon
                                </p>
                            </div>
                        )}
                    </div>
                </form>

                {/* Inline Preview Panel */}
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '50%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="hidden md:block overflow-y-auto bg-muted/20"
                        >
                            <div className="p-6">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                    Preview
                                </div>

                                {/* Preview Card */}
                                <div className={`
                                    rounded-xl border overflow-hidden
                                    ${isOrigin
                                        ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-background'
                                        : 'border-border bg-background'
                                    }
                                `}>
                                    {isOrigin && (
                                        <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
                                    )}

                                    <div className="p-5">
                                        {/* Type badge */}
                                        <div className={`
                                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3
                                            ${isOrigin
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                                : 'bg-primary/10 text-primary border border-primary/30'
                                            }
                                        `}>
                                            {CONTRIBUTION_ICONS[formData.contribution_type]}
                                            {config.label}
                                        </div>

                                        {/* Title */}
                                        <h3 className={`font-semibold text-foreground mb-2 ${isOrigin ? 'text-xl' : 'text-lg'}`}>
                                            {displayName || <span className="text-muted-foreground italic">No source selected</span>}
                                        </h3>

                                        {/* Citation */}
                                        {selectedSource?.title && formData.citation_reference && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                                                <BookOpen className="h-3 w-3" />
                                                {formData.citation_reference}
                                            </p>
                                        )}

                                        {/* Year */}
                                        {formData.approximate_year && (
                                            <span className={`
                                                inline-block mb-3 px-2 py-0.5 text-xs rounded-full
                                                ${isOrigin
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'bg-muted text-muted-foreground'
                                                }
                                            `}>
                                                {formData.approximate_year > 0
                                                    ? `c. ${formData.approximate_year}`
                                                    : `c. ${Math.abs(formData.approximate_year)} BCE`
                                                }
                                            </span>
                                        )}

                                        {/* Summary */}
                                        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                                            {formData.contribution_summary || <span className="text-muted-foreground italic">Add a contribution summary...</span>}
                                        </p>

                                        {/* Hebrew Quote */}
                                        {formData.quote_hebrew && (
                                            <div className={`
                                                p-4 rounded-lg mb-3
                                                ${isOrigin
                                                    ? 'bg-amber-500/5 border border-amber-500/20'
                                                    : 'bg-muted/50 border-l-2 border-primary/40'
                                                }
                                            `}>
                                                <p className="font-serif text-lg leading-relaxed" dir="rtl">
                                                    {formData.quote_hebrew}
                                                </p>
                                                {formData.quote_translated && (
                                                    <p className="mt-2 text-sm text-muted-foreground italic">
                                                        "{formData.quote_translated}"
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Key Insight */}
                                        {formData.base_idea_summary && (
                                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                <div className="flex items-start gap-2">
                                                    <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                                                    <p className="text-sm text-foreground/80">
                                                        {formData.base_idea_summary}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Tips */}
                                <div className="mt-6 text-xs text-muted-foreground space-y-2">
                                    <p className="flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                                        Origin nodes appear larger with special styling
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-primary" />
                                        Hebrew quotes are displayed prominently
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        Press <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd> to cancel
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {isNew ? 'Add Node' : 'Save Changes'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
