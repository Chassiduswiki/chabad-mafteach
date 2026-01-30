'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, Star, Clock, FileText, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IdeaChainListItem } from '@/lib/idea-chains/types';

const STATUS_COLORS = {
    draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    review: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    published: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export default function ChainBuilderListPage() {
    const router = useRouter();
    const [chains, setChains] = useState<IdeaChainListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchChains();
    }, [statusFilter]);

    const fetchChains = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) {
                params.set('status', statusFilter);
            }
            params.set('limit', '100');

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/idea-chains?${params}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error('Failed to fetch chains');
            }

            const data = await response.json();
            setChains(data.chains || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chains');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Idea Chain Builder</h1>
                            <p className="text-sm text-muted-foreground">
                                Trace intellectual genealogy through Chassidic literature
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/chain-builder/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Chain
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="max-w-5xl mx-auto px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter:</span>
                    <button
                        onClick={() => setStatusFilter(null)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            statusFilter === null
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        All
                    </button>
                    {['draft', 'review', 'published'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${
                                statusFilter === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                ) : chains.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No idea chains yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first chain to trace how ideas evolve through sources.
                        </p>
                        <button
                            onClick={() => router.push('/chain-builder/new')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Chain
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chains.map((chain) => (
                            <Card
                                key={chain.id}
                                variant="interactive"
                                className="cursor-pointer"
                                onClick={() => router.push(`/chain-builder/${chain.slug}`)}
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-medium text-foreground truncate">
                                                {chain.title}
                                            </h3>
                                            {chain.is_featured && (
                                                <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={`capitalize text-xs ${STATUS_COLORS[chain.status]}`}
                                            >
                                                {chain.status}
                                            </Badge>
                                        </div>
                                        {chain.title_hebrew && (
                                            <p className="text-sm text-muted-foreground mb-2" dir="rtl">
                                                {chain.title_hebrew}
                                            </p>
                                        )}
                                        {chain.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {chain.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {chain.node_count} nodes
                                            </span>
                                            {chain.date_updated && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(chain.date_updated).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
