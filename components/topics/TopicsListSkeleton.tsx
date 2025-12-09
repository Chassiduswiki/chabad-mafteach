
import { Skeleton } from '@/components/ui/skeleton';

export function TopicsListSkeleton() {
    return (
        <div className="space-y-8">
            {/* Controls skeleton */}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Category sections skeleton */}
            <div className="space-y-16">
                {[1, 2].map((category) => (
                    <div key={category}>
                        {/* Category header */}
                        <div className="mb-6 flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-8 w-32" />
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {/* Topic cards skeleton */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border bg-card p-6"
                                >
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-4" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
