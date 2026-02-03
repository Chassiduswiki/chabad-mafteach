'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/search-context';

// Lazy load icons to prevent HMR issues
const Home = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Home })));
const Search = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Search })));
const Hash = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Hash })));
const BookOpen = React.lazy(() => import('lucide-react').then(mod => ({ default: mod.BookOpen })));

// Lazy load CompactUserMenu to prevent HMR issues
const CompactUserMenu = React.lazy(() => import('@/components/auth/CompactUserMenu').then(mod => ({ default: mod.CompactUserMenu })));

// Icon wrapper component
function IconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="w-5 h-5" />}>
      {children}
    </Suspense>
  );
}

/**
 * MobileNav - Consistent bottom navigation for mobile
 * Shows on all pages EXCEPT homepage (where we want a cleaner app-like experience)
 */
export function MobileNav() {
    const pathname = usePathname();
    const { setOpen } = useSearch();

    // Hide on homepage - the homepage has its own mobile navigation experience
    const isHomepage = pathname === '/';
    if (isHomepage) return null;

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/topics', icon: Hash, label: 'Topics' },
        // { href: '/seforim', icon: BookOpen, label: 'Sources' }, // Hidden for now
    ];

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-[99] sm:hidden pb-safe"
            role="navigation"
            aria-label="Mobile navigation"
        >
            {/* Gradient fade for content scrolling under */}
            <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            
            <div className="bg-background/95 backdrop-blur-xl border-t border-border px-2 pt-2 pb-2">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    {navItems.map(({ href, icon: Icon, label }) => (
                        <Link 
                            key={href}
                            href={href} 
                            className={cn(
                                "flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all min-w-[60px]",
                                isActive(href) 
                                    ? "text-primary" 
                                    : "text-muted-foreground active:scale-95"
                            )}
                        >
                            {isActive(href) && (
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                            )}
                            <IconWrapper><Icon size={22} strokeWidth={isActive(href) ? 2.5 : 2} /></IconWrapper>
                            <span className={cn(
                                "text-[10px]",
                                isActive(href) ? "font-semibold" : "font-medium"
                            )}>
                                {label}
                            </span>
                        </Link>
                    ))}
                    
                    {/* Search button */}
                    <button 
                        onClick={() => setOpen(true)} 
                        className="flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-muted-foreground active:scale-95 transition-all min-w-[60px]"
                        aria-label="Open search"
                    >
                        <IconWrapper><Search size={22} strokeWidth={2} /></IconWrapper>
                        <span className="text-[10px] font-medium">Search</span>
                    </button>
                    
                    {/* Compact User Menu */}
                    <div className="flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-muted-foreground min-w-[60px]">
                        <Suspense fallback={<div className="w-6 h-6 rounded-full bg-muted animate-pulse" />}>
                            <CompactUserMenu />
                        </Suspense>
                        <span className="text-[10px] font-medium">Account</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
