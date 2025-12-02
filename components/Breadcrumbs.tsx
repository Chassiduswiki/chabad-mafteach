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
        <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-muted-foreground ${className}`}>
            <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                title="Home"
            >
                <Home className="h-4 w-4" />
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-foreground transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-semibold" aria-current="page">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
