'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Home, Compass, Hash, BookOpen, ArrowLeft, HelpCircle } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const quickLinks = [
        {
            href: '/',
            icon: Home,
            label: 'Home',
            description: 'Back to the start'
        },
        {
            href: '/explore',
            icon: Compass,
            label: 'Explore',
            description: 'Discover connections'
        },
        {
            href: '/topics',
            icon: Hash,
            label: 'Topics',
            description: 'Browse the mafteach'
        },
        {
            href: '/seforim',
            icon: BookOpen,
            label: 'Seforim',
            description: 'Primary sources'
        },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/10">
            {/* Subtle Texture/Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

            <main className="w-full max-w-2xl relative z-10 flex flex-col items-center">
                {/* Minimal Header */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-6 border border-border/50">
                        <HelpCircle className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    
                    <h1 className="text-4xl font-serif italic mb-3 tracking-tight">
                        A path not yet found.
                    </h1>
                    
                    <p className="text-muted-foreground text-lg font-light max-w-md mx-auto leading-relaxed">
                        The reference you're looking for isn't here. Perhaps it's been moved, or the link has changed.
                    </p>
                </div>

                {/* Search - Refined */}
                <form onSubmit={handleSearch} className="w-full max-w-md mb-16">
                    <div className="relative group">
                        <div className="relative flex items-center bg-muted/30 rounded-full border border-border/60 hover:border-border transition-all px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/40">
                            <Search className="w-4 h-4 text-muted-foreground ml-4 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search the mafteach..."
                                className="flex-1 bg-transparent px-4 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm"
                            />
                            <button
                                type="submit"
                                className="px-5 py-2 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </form>

                {/* Navigation Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-start gap-4 p-5 rounded-2xl border border-transparent hover:border-border/60 hover:bg-muted/30 transition-all duration-200"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-medium text-foreground">
                                        {link.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                        {link.description}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="mt-16 pt-8 border-t border-border/40 w-full flex flex-col items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Return to previous page</span>
                    </button>
                    
                    <div className="mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
                        Error Code: 404
                    </div>
                </div>
            </main>
        </div>
    );
}

