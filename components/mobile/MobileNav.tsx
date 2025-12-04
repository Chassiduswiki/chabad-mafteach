'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Bookmark, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/search-context';

export function MobileNav() {
    const pathname = usePathname();
    const { setOpen } = useSearch();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 sm:hidden">
            <div className="bg-background/80 backdrop-blur-xl rounded-full px-6 py-3 flex justify-between items-center border border-border shadow-2xl shadow-black/20 dark:shadow-black/60">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Home size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/topics"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/topics') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Hash size={20} />
                    <span className="text-[10px] font-medium">Topics</span>
                </Link>

                <Link
                    href="/explore"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/explore') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Compass size={20} />
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>

                <button
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors text-muted-foreground min-w-[44px]"
                    )}
                >
                    <Search size={20} />
                    <span className="text-[10px] font-medium">Search</span>
                </button>

                <Link
                    href="/collections"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/collections') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Bookmark size={20} />
                    <span className="text-[10px] font-medium">Saved</span>
                </Link>
            </div>
        </nav>
    );
}
