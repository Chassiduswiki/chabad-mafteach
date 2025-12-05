import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    centered?: boolean;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
};

export function LoadingSpinner({
    className,
    size = 'md',
    centered = false
}: LoadingSpinnerProps) {
    const spinner = (
        <Loader2
            className={cn(
                'animate-spin text-primary',
                sizeClasses[size],
                className
            )}
        />
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[100px]">
                {spinner}
            </div>
        );
    }

    return spinner;
}
