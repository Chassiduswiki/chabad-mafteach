import { Skeleton } from "@/components/ui/skeleton"

export function TopicCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 mb-4">
                <div className="h-12 w-12 rounded-xl bg-muted/50 animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
            </div>
            <div className="h-6 w-3/4 rounded bg-muted/50 mb-2 animate-pulse" />
            <div className="h-5 w-1/2 rounded bg-muted/50 mb-3 animate-pulse" />
            <div className="h-4 w-full rounded bg-muted/50 mb-2 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted/50 animate-pulse" />
        </div>
    );
}
