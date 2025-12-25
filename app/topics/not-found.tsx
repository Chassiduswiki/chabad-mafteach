'use client';

import Link from 'next/link';
import { Search, Hash, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TopicNotFound() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
    const router = useRouter();

    // Fetch some random topics as suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch('/api/topics?limit=3');
                const data = await response.json();
                setSuggestedTopics(data.topics || []);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        };
        fetchSuggestions();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/topics?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const categories = [
        { id: 'concept', name: 'Concepts', icon: '💡' },
        { id: 'person', name: 'People', icon: '👤' },
        { id: 'sefirah', name: 'Sefirot', icon: '✨' },
        { id: 'mitzvah', name: 'Mitzvot', icon: '📖' },
        { id: 'place', name: 'Places', icon: '📍' },
        { id: 'event', name: 'Events', icon: '📅' },
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Hash className="h-12 w-12 text-primary opacity-50" />
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Topic Not Found
                    </h1>
                    <p className="text-muted-foreground">
                        We couldn't find the topic you're looking for. It may have been moved or doesn't exist yet.
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
                            placeholder="Search for a topic..."
                            className="w-full h-12 pl-12 pr-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </form>
                </div>

                {/* Browse by Category */}
                <div className="pt-6 border-t border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                        Browse topics by category:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/topics?category=${category.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                            >
                                <span>{category.icon}</span>
                                <span className="font-medium text-foreground">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Suggested Topics */}
                {suggestedTopics.length > 0 && (
                    <div className="pt-6 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Or explore these topics:
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestedTopics.map((topic) => (
                                <Link
                                    key={topic.id}
                                    href={`/topics/${topic.slug}`}
                                    className="px-4 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                                >
                                    <div className="font-medium text-foreground text-sm">
                                        {topic.canonical_title || topic.name}
                                    </div>
                                    {topic.topic_type && (
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {topic.topic_type}
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
                        href="/topics"
                        className="text-sm text-primary hover:underline"
                    >
                        View all topics
                    </Link>
                </div>
            </div>
        </div>
    );
}
