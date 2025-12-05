import { Skeleton } from "@/components/ui/skeleton"

export function TopicCardSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-muted/20 p-8 h-64 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-4" />

            <div className="space-y-2 mb-auto">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>

            <Skeleton className="h-4 w-24 mt-4" />
        </div>
    )
}
