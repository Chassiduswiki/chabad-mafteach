'use client';

import React from 'react';

/**
 * TopicSkeleton - Skeleton shimmer for the article page
 */
export function TopicSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            {/* Hero Skeleton */}
            <div className="min-h-[50vh] flex flex-col justify-center px-6 sm:px-8 max-w-4xl mx-auto pt-20 pb-12">
                <div className="space-y-6">
                    {/* Breadcrumbs */}
                    <div className="w-32 h-4 bg-muted/50 rounded-full" />

                    {/* Title */}
                    <div className="space-y-4">
                        <div className="w-3/4 h-12 bg-muted/50 rounded-xl" />
                        <div className="w-1/3 h-8 bg-muted/50 rounded-lg opacity-60" />
                    </div>

                    {/* Paragraph */}
                    <div className="space-y-3 max-w-xl">
                        <div className="w-full h-4 bg-muted/50 rounded-full" />
                        <div className="w-full h-4 bg-muted/50 rounded-full" />
                        <div className="w-2/3 h-4 bg-muted/50 rounded-full" />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <div className="w-32 h-10 bg-muted/50 rounded-full" />
                        <div className="w-24 h-10 bg-muted/50 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="sticky top-0 h-16 border-b border-border bg-background/50 backdrop-blur-sm" />

            {/* Content Skeleton */}
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-8 rounded-2xl border border-border bg-muted/10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-muted/50" />
                            <div className="w-48 h-6 bg-muted/50 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <div className="w-full h-4 bg-muted/30 rounded-full" />
                            <div className="w-[90%] h-4 bg-muted/30 rounded-full" />
                            <div className="w-[95%] h-4 bg-muted/30 rounded-full" />
                            <div className="w-[80%] h-4 bg-muted/30 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
