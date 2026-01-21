'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';
import dynamic from 'next/dynamic';

// Lazy load ForceGraph to avoid SSR issues with d3
const ForceGraph = dynamic(
    () => import('@/components/graph/ForceGraph').then(mod => mod.ForceGraph),
    { ssr: false, loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-xl" /> }
);

interface GraphNode {
    id: string;
    label: string;
    labelHebrew?: string;
    slug: string;
    category?: string;
    size?: number;
}

interface GraphEdge {
    source: string;
    target: string;
    type: string;
    strength: number;
    description?: string;
}

interface GraphPreviewProps {
    className?: string;
    limit?: number;
}

/**
 * GraphPreview - Homepage preview of the concept connection graph
 * Shows a sample constellation to entice users to explore topics
 */
export function GraphPreview({ className = '', limit = 25 }: GraphPreviewProps) {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGraphData = async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const res = await fetch(`/api/graph?limit=${limit}`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                
                if (data.nodes?.length === 0) {
                    setError('No topic connections found yet');
                }
            } else {
                setError('Failed to load graph data');
            }
        } catch (e) {
            console.error('GraphPreview fetch error:', e);
            setError('Failed to load graph data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGraphData();
    }, [limit]);

    if (isLoading) {
        return (
            <div className={`rounded-2xl border border-border bg-card/50 p-8 ${className}`}>
                <div className="h-80 bg-muted/20 animate-pulse rounded-xl" />
            </div>
        );
    }

    return (
        <motion.div 
            className={`rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5 p-6 sm:p-8 ${className}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
        >
            {/* Header */}
            <motion.div variants={staggerItem} className="flex items-center justify-between mb-4">
                <div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium mb-2">
                        <Sparkles className="w-3 h-3" />
                        Live Knowledge Graph
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">Explore Connected Ideas</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {nodes.length > 0 
                            ? `${nodes.length} concepts • ${edges.length} connections`
                            : 'See how Chassidic concepts relate to each other'
                        }
                    </p>
                </div>
                <button
                    onClick={fetchGraphData}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Refresh graph"
                >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </motion.div>

            {/* Interactive Graph */}
            <motion.div variants={staggerItem} className="mb-4">
                {error ? (
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                ) : (
                    <ForceGraph
                        nodes={nodes}
                        edges={edges}
                        width={600}
                        height={320}
                        interactive={true}
                    />
                )}
            </motion.div>

            {/* CTA */}
            <motion.div variants={staggerItem}>
                <Link
                    href="/topics"
                    className="group flex items-center justify-center gap-2 w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium rounded-xl transition-all hover-lift"
                >
                    <span>Explore All Topics</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </motion.div>
        </motion.div>
    );
}

export default GraphPreview;
