'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Lazy load both layouts to reduce initial bundle
const ExploreDesktop = dynamic(
    () => import('@/components/explore/graph/ExploreDesktop').then(mod => mod.ExploreDesktop),
    {
        ssr: false,
        loading: () => <ExploreLoading />,
    }
);

const ExploreMobile = dynamic(
    () => import('@/components/explore/graph/ExploreMobile').then(mod => mod.ExploreMobile),
    {
        ssr: false,
        loading: () => <ExploreLoading />,
    }
);

function ExploreLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading explorer...</p>
            </div>
        </div>
    );
}

/**
 * ExploreGraphPage - Main entry point for graph exploration
 * Renders desktop or mobile layout based on viewport
 */
export default function ExploreGraphPage() {
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const isMounted = useMediaQuery('(min-width: 0px)'); // Always true after mount

    // Don't render until we know the viewport size to prevent flash
    if (!isMounted) {
        return <ExploreLoading />;
    }

    return isDesktop ? <ExploreDesktop /> : <ExploreMobile />;
}
