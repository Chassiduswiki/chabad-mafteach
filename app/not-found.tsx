'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Home, Compass, Hash, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';

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
            description: 'Start fresh',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            href: '/explore',
            icon: Compass,
            label: 'Explore',
            description: 'Discover content',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            href: '/topics',
            icon: Hash,
            label: 'Topics',
            description: 'Browse topics',
            gradient: 'from-orange-500 to-amber-500'
        },
        {
            href: '/seforim',
            icon: BookOpen,
            label: 'Seforim',
            description: 'Read sources',
            gradient: 'from-emerald-500 to-teal-500'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
                {/* 404 Hero */}
                <div className="text-center mb-8">
                    {/* Animated icon */}
                    <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center ring-1 ring-white/10 backdrop-blur-sm">
                            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                        </div>
                    </div>

                    {/* Error code with gradient */}
                    <h1 className="text-6xl sm:text-8xl font-black mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        404
                    </h1>

                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                        Page Not Found
                    </h2>

                    <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
                        The page you're looking for doesn't exist or may have been moved.
                    </p>
                </div>

                {/* Search bar - mobile-optimized */}
                <form onSubmit={handleSearch} className="w-full max-w-md mb-10 px-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg overflow-hidden focus-within:border-primary/50 transition-colors">
                            <Search className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for anything..."
                                className="flex-1 bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                            />
                            <button
                                type="submit"
                                className="px-5 py-4 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </form>

                {/* Quick links grid - mobile-first */}
                <div className="w-full max-w-lg px-4">
                    <p className="text-center text-sm text-muted-foreground mb-4 font-medium">
                        Or explore these sections
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {quickLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {/* Gradient background on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                                    <div className="relative flex flex-col items-center text-center">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="font-semibold text-foreground text-sm">
                                            {link.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                            {link.description}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Go back button */}
                <button
                    onClick={() => router.back()}
                    className="mt-8 flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Go back
                </button>
            </main>
        </div>
    );
}
