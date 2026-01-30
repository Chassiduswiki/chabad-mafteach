'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical,
    ChevronDown, ChevronUp, ExternalLink, Settings, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NodeEditModal } from '@/components/chain-builder/NodeEditModal';
import { ChainPreview } from '@/components/chain-builder/ChainPreview';
import type { IdeaChainFull, IdeaNodeWithSource, ContributionType } from '@/lib/idea-chains/types';
import { CONTRIBUTION_TYPE_CONFIG } from '@/lib/idea-chains/types';

const STATUS_COLORS = {
    draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    review: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    published: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export default function ChainEditorPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();

    const [chain, setChain] = useState<IdeaChainFull | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);

    // Node editing state
    const [editingNode, setEditingNode] = useState<IdeaNodeWithSource | null>(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);

    // Metadata form state
    const [metadataForm, setMetadataForm] = useState({
        title: '',
        title_hebrew: '',
        description: '',
        status: 'draft' as 'draft' | 'review' | 'published',
        is_featured: false,
    });

    useEffect(() => {
        fetchChain();
    }, [slug]);

    const fetchChain = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/idea-chains/${slug}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Chain not found');
                }
                throw new Error('Failed to fetch chain');
            }

            const data = await response.json();
            setChain(data);
            setMetadataForm({
                title: data.title || '',
                title_hebrew: data.title_hebrew || '',
                description: data.description || '',
                status: data.status || 'draft',
                is_featured: data.is_featured || false,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chain');
        } finally {
            setIsLoading(false);
        }
    };

    const saveMetadata = async () => {
        if (!chain) return;

        setIsSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/idea-chains/${slug}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(metadataForm),
            });

            if (!response.ok) {
                throw new Error('Failed to save changes');
            }

            const updated = await response.json();
            setChain(prev => prev ? { ...prev, ...updated } : null);
            setShowMetadata(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNodeSave = async (nodeData: Partial<IdeaNodeWithSource>) => {
        if (!chain) return;

        setIsSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const isNew = !nodeData.id;
            const url = isNew
                ? `/api/idea-chains/${slug}/nodes`
                : `/api/idea-chains/${slug}/nodes/${nodeData.id}`;

            const response = await fetch(url, {
                method: isNew ? 'POST' : 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(nodeData),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to save node');
            }

            // Refresh the chain to get updated data
            await fetchChain();
            setEditingNode(null);
            setIsCreatingNode(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save node');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNodeDelete = async (nodeId: number) => {
        if (!chain) return;
        if (!confirm('Are you sure you want to delete this node?')) return;

        setIsSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/idea-chains/${slug}/nodes/${nodeId}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error('Failed to delete node');
            }

            await fetchChain();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete node');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error && !chain) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md mb-4">
                        {error}
                    </div>
                    <button
                        onClick={() => router.push('/chain-builder')}
                        className="text-primary hover:underline"
                    >
                        Back to Chain Builder
                    </button>
                </div>
            </div>
        );
    }

    if (!chain) return null;

    // Sort nodes by position or approximate year
    const sortedNodes = [...chain.nodes].sort((a, b) => {
        if (a.position !== null && b.position !== null) {
            return a.position - b.position;
        }
        if (a.approximate_year && b.approximate_year) {
            return a.approximate_year - b.approximate_year;
        }
        return 0;
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/chain-builder')}
                                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-semibold text-foreground">{chain.title}</h1>
                                    <Badge
                                        variant="outline"
                                        className={`capitalize text-xs ${STATUS_COLORS[chain.status]}`}
                                    >
                                        {chain.status}
                                    </Badge>
                                </div>
                                {chain.title_hebrew && (
                                    <p className="text-sm text-muted-foreground" dir="rtl">{chain.title_hebrew}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                                    showPreview
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                            </button>
                            <button
                                onClick={() => setShowMetadata(!showMetadata)}
                                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Error Display */}
            {error && (
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                </div>
            )}

            {/* Metadata Panel */}
            {showMetadata && (
                <div className="border-b border-border bg-muted/30">
                    <div className="max-w-5xl mx-auto px-4 py-6">
                        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                            <h3 className="font-semibold text-foreground">Chain Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={metadataForm.title}
                                        onChange={(e) => setMetadataForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title (Hebrew)</label>
                                    <input
                                        type="text"
                                        value={metadataForm.title_hebrew}
                                        onChange={(e) => setMetadataForm(prev => ({ ...prev, title_hebrew: e.target.value }))}
                                        dir="rtl"
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                    <textarea
                                        value={metadataForm.description}
                                        onChange={(e) => setMetadataForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                    <select
                                        value={metadataForm.status}
                                        onChange={(e) => setMetadataForm(prev => ({ ...prev, status: e.target.value as typeof metadataForm.status }))}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="review">Review</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={metadataForm.is_featured}
                                        onChange={(e) => setMetadataForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                                        className="h-4 w-4 mr-2"
                                    />
                                    <label htmlFor="is_featured" className="text-sm">Featured chain</label>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={saveMetadata}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {showPreview ? (
                    <ChainPreview chain={chain} nodes={sortedNodes} />
                ) : (
                    <div className="space-y-6">
                        {/* Nodes Section */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">
                                Chain Nodes ({sortedNodes.length})
                            </h2>
                            <button
                                onClick={() => setIsCreatingNode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                <Plus className="h-4 w-4" />
                                Add Node
                            </button>
                        </div>

                        {sortedNodes.length === 0 ? (
                            <Card className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No nodes yet. Add your first node to start building the chain.
                                </p>
                                <button
                                    onClick={() => setIsCreatingNode(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add First Node
                                </button>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {sortedNodes.map((node, index) => (
                                    <NodeCard
                                        key={node.id}
                                        node={node}
                                        index={index}
                                        onEdit={() => setEditingNode(node)}
                                        onDelete={() => handleNodeDelete(node.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Node Edit Modal */}
            {(editingNode || isCreatingNode) && (
                <NodeEditModal
                    node={editingNode}
                    existingNodes={chain.nodes}
                    onSave={handleNodeSave}
                    onClose={() => {
                        setEditingNode(null);
                        setIsCreatingNode(false);
                    }}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}

// Node Card Component
function NodeCard({
    node,
    index,
    onEdit,
    onDelete,
}: {
    node: IdeaNodeWithSource;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const config = CONTRIBUTION_TYPE_CONFIG[node.contribution_type];

    return (
        <Card className="overflow-hidden">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    {/* Order indicator */}
                    <div className="flex flex-col items-center text-muted-foreground">
                        <GripVertical className="h-4 w-4 mb-1" />
                        <span className="text-xs font-medium">{index + 1}</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground">
                                        {node.source?.title || 'Unknown Source'}
                                    </span>
                                    {node.approximate_year && (
                                        <span className="text-xs text-muted-foreground">
                                            ({node.approximate_year > 0 ? node.approximate_year : `${Math.abs(node.approximate_year)} BCE`})
                                        </span>
                                    )}
                                    {node.is_origin && (
                                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                                            Origin
                                        </Badge>
                                    )}
                                </div>
                                {node.citation_reference && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {node.citation_reference}
                                    </p>
                                )}
                                <Badge
                                    variant="outline"
                                    className={`text-xs bg-${config.color}-500/10 text-${config.color}-600 border-${config.color}-500/20`}
                                >
                                    {config.label}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onEdit}
                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-sm text-foreground mt-2">
                            {node.contribution_summary}
                        </p>
                    </div>
                </div>

                {/* Expanded content */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                        {node.quote_hebrew && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Hebrew Quote</label>
                                <p className="text-sm text-foreground mt-1" dir="rtl">{node.quote_hebrew}</p>
                            </div>
                        )}
                        {node.quote_translated && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Translation</label>
                                <p className="text-sm text-foreground mt-1">{node.quote_translated}</p>
                            </div>
                        )}
                        {node.base_idea_summary && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Base Idea</label>
                                <p className="text-sm text-foreground mt-1">{node.base_idea_summary}</p>
                            </div>
                        )}
                        {node.external_url && (
                            <a
                                href={node.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View Source
                            </a>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
