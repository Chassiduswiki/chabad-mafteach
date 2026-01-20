'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/search-context';
import { useScrollDirection } from '@/hooks/useScrollDirection';

// Lazy load icons to prevent HMR issues
const Home = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Home })));
const Compass = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Compass })));
const Search = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Search })));
const Bookmark = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Bookmark })));
const Hash = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Hash })));

// Icon wrapper component
function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="w-5 h-5" />}>
      {children}
    </Suspense>
  );
}

export function MobileNav() {
    const pathname = usePathname();
    const { setOpen } = useSearch();
    const scrollDirection = useScrollDirection();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide on scroll down, show on scroll up
        if (scrollDirection === 'down') {
            setIsVisible(false);
        } else if (scrollDirection === 'up') {
            setIsVisible(true);
        }
    }, [scrollDirection]);

    const isActive = (path: string) => pathname === path;

    // Do not render the nav on the topic page for now to avoid overlap with topic-specific footer
    if (pathname.startsWith('/topics/')) {
        return null;
    }

    return (
        <nav className={cn(
            "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 sm:hidden transition-transform duration-300 ease-in-out",
            !isVisible && "translate-y-[150%]"
        )}>
            <div className="bg-background/80 backdrop-blur-xl rounded-full px-6 py-3 flex justify-between items-center border border-border shadow-2xl shadow-black/20 dark:shadow-black/60">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <IconWrapper>
                        <Home size={20} />
                    </IconWrapper>
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/topics"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/topics') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <IconWrapper>
                        <Hash size={20} />
                    </IconWrapper>
                    <span className="text-[10px] font-medium">Topics</span>
                </Link>

                {/* <Link
                    href="/explore"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/explore') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <IconWrapper>
                        <Compass size={20} />
                    </IconWrapper>
                    <span className="text-[10px] font-medium">Explore</span>
                </Link> */}

                <button
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors text-muted-foreground min-w-[44px]"
                    )}
                >
                    <IconWrapper>
                        <Search size={20} />
                    </IconWrapper>
                    <span className="text-[10px] font-medium">Search</span>
                </button>

                {/* <Link
                    href="/collections"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors min-w-[44px]",
                        isActive('/collections') ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Bookmark size={20} />
                    <span className="text-[10px] font-medium">Saved</span>
                </Link> */}
            </div>
        </nav>
    );
}
