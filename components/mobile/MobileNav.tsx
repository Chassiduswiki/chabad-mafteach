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
 * ALWAYS shows same 4 items regardless of current page
 */
export function MobileNav() {
    const pathname = usePathname();
    const { setOpen } = useSearch();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/topics', icon: Hash, label: 'Topics' },
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
                                <span className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full" />
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
                </div>
            </div>
        </nav>
    );
}
