'use client';

import React, { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Loader2, Plus, Settings, Eye, EyeOff,
    CheckCircle2, AlertCircle, Keyboard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NodeEditModal } from '@/components/chain-builder/NodeEditModal';
import { ChainPreview } from '@/components/chain-builder/ChainPreview';
import { NodeCard, NodeConnector } from '@/components/chain-builder/NodeCard';
import type { IdeaChainFull, IdeaNodeWithSource } from '@/lib/idea-chains/types';

const STATUS_CONFIG = {
    draft: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', label: 'Draft' },
    review: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', label: 'In Review' },
    published: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', label: 'Published' },
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
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Node editing state
    const [editingNode, setEditingNode] = useState<IdeaNodeWithSource | null>(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);

    // Metadata form state with dirty tracking
    const [metadataForm, setMetadataForm] = useState({
        title: '',
        title_hebrew: '',
        description: '',
        status: 'draft' as 'draft' | 'review' | 'published',
        is_featured: false,
    });
    const [isMetadataDirty, setIsMetadataDirty] = useState(false);
    const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchChain();
    }, [slug]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Cmd/Ctrl + N: New node
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                if (!showPreview) setIsCreatingNode(true);
            }
            // Cmd/Ctrl + P: Toggle preview
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setShowPreview(prev => !prev);
            }
            // Cmd/Ctrl + ,: Toggle settings
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setShowMetadata(prev => !prev);
            }
            // Escape: Close modals
            if (e.key === 'Escape') {
                if (editingNode || isCreatingNode) {
                    setEditingNode(null);
                    setIsCreatingNode(false);
                } else if (showKeyboardHelp) {
                    setShowKeyboardHelp(false);
                }
            }
            // ?: Show keyboard help
            if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
                setShowKeyboardHelp(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreview, editingNode, isCreatingNode, showKeyboardHelp]);

    // Autosave metadata when dirty
    useEffect(() => {
        if (!isMetadataDirty || !chain) return;

        // Clear existing timer
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        // Set new timer for 2 seconds
        autosaveTimerRef.current = setTimeout(() => {
            saveMetadata(true);
        }, 2000);

        return () => {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [metadataForm, isMetadataDirty]);

    // Mark metadata as dirty when form changes
    const updateMetadataForm = useCallback((updates: Partial<typeof metadataForm>) => {
        setMetadataForm(prev => ({ ...prev, ...updates }));
        setIsMetadataDirty(true);
    }, []);

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

    const saveMetadata = async (isAutosave = false) => {
        if (!chain) return;

        if (!isAutosave) setIsSaving(true);
        setSaveStatus('saving');
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
            setIsMetadataDirty(false);
            setSaveStatus('saved');

            // Reset save status after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);

            if (!isAutosave) setShowMetadata(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
            setSaveStatus('error');
        } finally {
            if (!isAutosave) setIsSaving(false);
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

    const statusConfig = STATUS_CONFIG[chain.status];

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
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                                        {chain.title}
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                    >
                                        {statusConfig.label}
                                    </Badge>
                                    {/* Save status indicator */}
                                    <AnimatePresence mode="wait">
                                        {saveStatus === 'saving' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </motion.div>
                                        )}
                                        {saveStatus === 'saved' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="text-green-500"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                        {saveStatus === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="text-red-500"
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {chain.title_hebrew && (
                                    <p className="text-sm text-muted-foreground hidden sm:block" dir="rtl">{chain.title_hebrew}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Keyboard help */}
                            <button
                                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                                className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                title="Keyboard shortcuts (?)"
                            >
                                <Keyboard className="h-4 w-4" />
                            </button>
                            {/* Preview toggle */}
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                                    showPreview
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                title="Toggle preview (⌘P)"
                            >
                                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                            </button>
                            {/* Settings */}
                            <button
                                onClick={() => setShowMetadata(!showMetadata)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                                    showMetadata
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                title="Settings (⌘,)"
                            >
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Settings</span>
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

            {/* Keyboard Shortcuts Help */}
            <AnimatePresence>
                {showKeyboardHelp && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-border bg-muted/50 overflow-hidden"
                    >
                        <div className="max-w-5xl mx-auto px-4 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Keyboard className="h-4 w-4" />
                                    Keyboard Shortcuts
                                </h3>
                                <button
                                    onClick={() => setShowKeyboardHelp(false)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Press ? to toggle
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">⌘N</kbd> <span className="text-muted-foreground ml-2">New node</span></div>
                                <div><kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">⌘P</kbd> <span className="text-muted-foreground ml-2">Toggle preview</span></div>
                                <div><kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">⌘,</kbd> <span className="text-muted-foreground ml-2">Settings</span></div>
                                <div><kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Esc</kbd> <span className="text-muted-foreground ml-2">Close modal</span></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metadata Panel */}
            <AnimatePresence>
                {showMetadata && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-border bg-muted/30 overflow-hidden"
                    >
                        <div className="max-w-5xl mx-auto px-4 py-6">
                            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground">Chain Settings</h3>
                                    {isMetadataDirty && (
                                        <span className="text-xs text-muted-foreground">Autosave enabled</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={metadataForm.title}
                                            onChange={(e) => updateMetadataForm({ title: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Title (Hebrew)</label>
                                        <input
                                            type="text"
                                            value={metadataForm.title_hebrew}
                                            onChange={(e) => updateMetadataForm({ title_hebrew: e.target.value })}
                                            dir="rtl"
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                        <textarea
                                            value={metadataForm.description}
                                            onChange={(e) => updateMetadataForm({ description: e.target.value })}
                                            rows={3}
                                            placeholder="Describe what this chain traces and why it matters..."
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                        <select
                                            value={metadataForm.status}
                                            onChange={(e) => updateMetadataForm({ status: e.target.value as typeof metadataForm.status })}
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        >
                                            <option value="draft">Draft - Work in progress</option>
                                            <option value="review">Review - Ready for feedback</option>
                                            <option value="published">Published - Visible to all</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_featured"
                                            checked={metadataForm.is_featured}
                                            onChange={(e) => updateMetadataForm({ is_featured: e.target.checked })}
                                            className="h-4 w-4 mr-2 rounded border-border"
                                        />
                                        <label htmlFor="is_featured" className="text-sm">
                                            Featured chain
                                            <span className="text-xs text-muted-foreground ml-1">(Highlighted on homepage)</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowMetadata(false)}
                                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => saveMetadata(false)}
                                        disabled={isSaving || !isMetadataDirty}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {showPreview ? (
                    <ChainPreview chain={chain} nodes={sortedNodes} />
                ) : (
                    <div className="space-y-6">
                        {/* Nodes Section Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Chain Nodes
                                </h2>
                                <span className="px-2 py-0.5 text-sm bg-muted text-muted-foreground rounded-full">
                                    {sortedNodes.length}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsCreatingNode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Node
                            </button>
                        </div>

                        {sortedNodes.length === 0 ? (
                            /* Empty State - minimal */
                            <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                                <p>No nodes yet</p>
                                <button
                                    onClick={() => setIsCreatingNode(true)}
                                    className="mt-4 text-primary hover:underline"
                                >
                                    Add first node
                                </button>
                            </div>
                        ) : (
                            /* Node List */
                            <div className="space-y-0">
                                <AnimatePresence mode="popLayout">
                                    {sortedNodes.map((node, index) => (
                                        <React.Fragment key={node.id}>
                                            <NodeCard
                                                node={node}
                                                index={index}
                                                totalNodes={sortedNodes.length}
                                                onEdit={() => setEditingNode(node)}
                                                onDelete={() => handleNodeDelete(node.id)}
                                                parentNodes={chain.links
                                                    ?.filter(l => l.child_node_id === node.id)
                                                    .map(l => sortedNodes.find(n => n.id === l.parent_node_id))
                                                    .filter(Boolean) as IdeaNodeWithSource[]
                                                }
                                            />
                                            {index < sortedNodes.length - 1 && <NodeConnector />}
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
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
