'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={`flex flex-wrap items-center text-sm text-muted-foreground gap-1 ${className}`}
        >
            {/* Home link with 44px touch target */}
            <Link
                href="/"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md hover:bg-muted/50 hover:text-foreground transition-colors -ml-2"
                title="Home"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="min-h-[44px] flex items-center px-2 rounded-md hover:bg-muted/50 hover:text-foreground transition-colors font-medium truncate max-w-[150px] sm:max-w-none"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className="min-h-[44px] flex items-center px-2 text-foreground font-semibold truncate max-w-[150px] sm:max-w-none"
                            aria-current="page"
                        >
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}

