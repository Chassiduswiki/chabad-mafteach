'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, RefreshCw, Lightbulb } from 'lucide-react';
import { 
    SerendipitousConnection, 
    discoverConnections, 
    getTopicSerendipity,
    connectionTypeLabels 
} from '@/lib/services/serendipity-engine';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations';

interface SerendipityCardProps {
    /** Current topic slug (optional - for topic-specific discoveries) */
    topicSlug?: string;
    /** Variant style */
    variant?: 'default' | 'compact' | 'inline';
    /** Additional className */
    className?: string;
    /** Show refresh button */
    showRefresh?: boolean;
}

/**
 * SerendipityCard - Display unexpected connections
 * 
 * "The best learning happens when you discover something you weren't looking for."
 */
export function SerendipityCard({
    topicSlug,
    variant = 'default',
    className,
    showRefresh = true,
}: SerendipityCardProps) {
    const [connection, setConnection] = useState<SerendipitousConnection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchConnection = async () => {
        setIsRefreshing(true);
        try {
            const connections = topicSlug
                ? await getTopicSerendipity(topicSlug, 1)
                : await discoverConnections({ limit: 1 });
            setConnection(connections[0] || null);
        } catch (e) {
            console.error('SerendipityCard: Failed to fetch', e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConnection();
    }, [topicSlug]);

    if (isLoading) {
        return (
            <div className={cn('rounded-2xl border border-border bg-card/50 p-6', className)}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-6 w-3/4 bg-muted rounded" />
                    <div className="h-16 w-full bg-muted rounded" />
                </div>
            </div>
        );
    }

    if (!connection) {
        return null;
    }

    const typeConfig = connectionTypeLabels[connection.connectionType];

    if (variant === 'compact') {
        return (
            <motion.div
                {...fadeInUp}
                className={cn(
                    'rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-4',
                    className
                )}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500/10">
                        <Lightbulb className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {connection.insight}
                        </p>
                        <Link
                            href={`/topics/${connection.toTopic.slug}`}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            Explore {connection.toTopic.title}
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (variant === 'inline') {
        return (
            <motion.div
                {...fadeInUp}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10',
                    className
                )}
            >
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                    Related: <Link href={`/topics/${connection.toTopic.slug}`} className="font-medium text-foreground hover:text-purple-600">{connection.toTopic.title}</Link>
                </span>
            </motion.div>
        );
    }

    // Default variant
    return (
        <motion.div
            {...fadeInUp}
            className={cn(
                'rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5 p-6',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Unexpected Discovery</h3>
                        <span className={cn('text-xs font-medium', typeConfig.color)}>
                            {typeConfig.label}
                        </span>
                    </div>
                </div>
                {showRefresh && (
                    <button
                        onClick={fetchConnection}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                        aria-label="Find another connection"
                    >
                        <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isRefreshing && 'animate-spin')} />
                    </button>
                )}
            </div>

            {/* Connection Visual */}
            <div className="flex items-center gap-3 mb-4">
                <Link
                    href={`/topics/${connection.fromTopic.slug}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-center hover:bg-muted transition-colors"
                >
                    <span className="text-sm font-medium text-foreground">{connection.fromTopic.title}</span>
                    {connection.fromTopic.category && (
                        <span className="block text-xs text-muted-foreground">{connection.fromTopic.category}</span>
                    )}
                </Link>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                </div>
                <Link
                    href={`/topics/${connection.toTopic.slug}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-center hover:bg-muted transition-colors"
                >
                    <span className="text-sm font-medium text-foreground">{connection.toTopic.title}</span>
                    {connection.toTopic.category && (
                        <span className="block text-xs text-muted-foreground">{connection.toTopic.category}</span>
                    )}
                </Link>
            </div>

            {/* Insight */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {connection.insight}
                    </p>
                </div>
            </div>

            {/* Shared Element */}
            {connection.sharedElement && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded-full bg-muted">
                        {connection.sharedElement}
                    </span>
                    <span>•</span>
                    <span>{Math.round(connection.confidence * 100)}% confidence</span>
                </div>
            )}
        </motion.div>
    );
}

/**
 * SerendipityList - Display multiple unexpected connections
 */
interface SerendipityListProps {
    topicSlug?: string;
    limit?: number;
    className?: string;
}

export function SerendipityList({ topicSlug, limit = 3, className }: SerendipityListProps) {
    const [connections, setConnections] = useState<SerendipitousConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const data = topicSlug
                    ? await getTopicSerendipity(topicSlug, limit)
                    : await discoverConnections({ limit });
                setConnections(data);
            } catch (e) {
                console.error('SerendipityList: Failed to fetch', e);
            } finally {
                setIsLoading(false);
            }
        }
        fetch();
    }, [topicSlug, limit]);

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {Array.from({ length: limit }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (connections.length === 0) {
        return null;
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-foreground">Unexpected Discoveries</h3>
            </div>
            {connections.map((connection, i) => (
                <SerendipityCard
                    key={`${connection.fromTopic.slug}-${connection.toTopic.slug}-${i}`}
                    variant="compact"
                />
            ))}
        </div>
    );
}

export default SerendipityCard;
