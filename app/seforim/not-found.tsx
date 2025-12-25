'use client';

import Link from 'next/link';
import { Search, BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeferNotFound() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedSeforim, setSuggestedSeforim] = useState<any[]>([]);
    const router = useRouter();

    // Fetch some seforim as suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch('/api/seforim');
                const data = await response.json();
                // Get first 3 root documents
                setSuggestedSeforim((data || []).slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        };
        fetchSuggestions();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const categories = [
        { id: 'chassidus', name: 'Chassidus', icon: '🔥' },
        { id: 'tanach', name: 'Tanach', icon: '📜' },
        { id: 'gemara', name: 'Gemara', icon: '📚' },
        { id: 'rishonim', name: 'Rishonim', icon: '⏳' },
        { id: 'acharonim', name: 'Acharonim', icon: '⚡' },
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary opacity-50" />
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Sefer Not Found
                    </h1>
                    <p className="text-muted-foreground">
                        The sefer you're looking for doesn't exist or may have been moved.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for seforim or sources..."
                            className="w-full h-12 pl-12 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </form>
                </div>

                {/* Browse by Category */}
                <div className="pt-6 border-t border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                        Browse seforim by category:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/seforim?category=${category.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                            >
                                <span>{category.icon}</span>
                                <span className="font-medium text-foreground">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Suggested Seforim */}
                {suggestedSeforim.length > 0 && (
                    <div className="pt-6 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Or explore these seforim:
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestedSeforim.map((sefer) => (
                                <Link
                                    key={sefer.id}
                                    href={`/seforim/${sefer.id}`}
                                    className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                                >
                                    <div className="font-medium text-foreground text-sm">
                                        {sefer.title}
                                    </div>
                                    {sefer.author && (
                                        <div className="text-xs text-muted-foreground">
                                            by {sefer.author}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <div className="flex items-center justify-center gap-6 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go back
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <Link
                        href="/seforim"
                        className="text-sm text-primary hover:underline"
                    >
                        View all seforim
                    </Link>
                </div>
            </div>
        </div>
    );
}
