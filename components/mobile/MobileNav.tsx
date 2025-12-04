'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Bookmark, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/search-context';

export function MobileNav() {
    const pathname = usePathname();
    const { setOpen } = useSearch();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 sm:hidden">
            <div className="bg-background/80 backdrop-blur-xl rounded-full px-4 py-3 flex justify-around border border-border shadow-2xl shadow-black/20 dark:shadow-black/60">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-colors",
                        isActive('/') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Home size={22} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/explore"
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-colors",
                        isActive('/explore') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Compass size={22} />
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>

                <button
                    className="flex flex-col items-center -mt-1"
                    onClick={() => setOpen(true)}
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-xl shadow-primary/30">
                        <Search size={26} className="text-primary-foreground" strokeWidth={2.5} />
                    </div>
                </button>

                <button
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-colors text-muted-foreground"
                    )}
                >
                    <Search size={22} />
                    <span className="text-[10px] font-medium">Search</span>
                </button>

                <Link
                    href="/collections"
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-colors",
                        isActive('/collections') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Bookmark size={22} />
                    <span className="text-[10px] font-medium">Saved</span>
                </Link>
            </div>
        </nav>
    );
}
