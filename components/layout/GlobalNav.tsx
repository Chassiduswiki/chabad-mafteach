'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Search, ArrowLeft, Home } from 'lucide-react';
import { useSearch } from '@/lib/search-context';
import { ThemeToggleCompact } from '@/components/layout/ThemeToggle';
import { LanguageToggleCompact } from '@/components/layout/LanguageToggle';
import { CompactUserMenu } from '@/components/auth/CompactUserMenu';
import { cn } from '@/lib/utils';

interface GlobalNavProps {
    showBack?: boolean;
    backHref?: string;
    backLabel?: string;
    title?: string;
    transparent?: boolean;
}

/**
 * GlobalNav - Unified navigation header for all pages
 * Consistent experience across the entire app
 */
export function GlobalNav({ 
    showBack, 
    backHref = '/', 
    backLabel,
    title,
    transparent = false 
}: GlobalNavProps) {
    const pathname = usePathname();
    const { setOpen } = useSearch();

    const isHome = pathname === '/';
    const isTopics = pathname === '/topics' || pathname.startsWith('/topics/');

    return (
        <header 
            className={cn(
                "sticky top-0 z-50 w-full transition-colors duration-200",
                transparent 
                    ? "bg-transparent" 
                    : "bg-background/80 backdrop-blur-xl border-b border-border/50"
            )}
        >
            <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Left: Logo + optional back */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Back button when on detail pages */}
                    {showBack && !isHome && (
                        <Link 
                            href={backHref}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            aria-label={backLabel || 'Back'}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    )}
                    
                    {/* Logo - always visible */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight hidden sm:inline">
                            Chabad Maftaiach
                        </span>
                    </Link>
                </div>

                {/* Center: Navigation Links (desktop) */}
                <div className="hidden md:flex items-center gap-1">
                    <Link
                        href="/topics"
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                            isTopics 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        Topics
                    </Link>
                    {/* Sources link hidden for now
                    <Link
                        href="/seforim"
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                            pathname === '/seforim' || pathname.startsWith('/seforim/')
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        Sources
                    </Link>
                    */}
                    <Link
                        href="/about"
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                            pathname === '/about'
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        About
                    </Link>
                </div>

                {/* Right: Search + Theme + Compact User Menu */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-full transition-colors"
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                            ⌘K
                        </kbd>
                    </button>
                    <LanguageToggleCompact />
                    <ThemeToggleCompact />
                    <CompactUserMenu />
                </div>
            </nav>
        </header>
    );
}
