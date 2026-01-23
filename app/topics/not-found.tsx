'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Hash, 
  ArrowLeft, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Layers,
  HelpCircle,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopicNotFound() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
    const router = useRouter();

    // Fetch some random topics as suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch('/api/topics?limit=4');
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
            router.push(`/topics?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const categories = [
        { id: 'concept', name: 'Concepts', icon: Sparkles, color: 'text-amber-500/60' },
        { id: 'person', name: 'People', icon: Compass, color: 'text-blue-500/60' },
        { id: 'sefirah', name: 'Sefirot', icon: Layers, color: 'text-purple-500/60' },
        { id: 'mitzvah', name: 'Mitzvot', icon: BookOpen, color: 'text-emerald-500/60' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/10 relative overflow-hidden">
            {/* Subtle Texture/Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="w-full max-w-3xl relative z-10 flex flex-col items-center">
                {/* Header Section */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-8 border border-border/50 shadow-sm rotate-3 group-hover:rotate-0 transition-transform">
                        <Hash className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-serif italic mb-4 tracking-tight text-foreground">
                        Topic not yet charted.
                    </h1>
                    
                    <p className="text-muted-foreground text-lg font-light max-w-lg mx-auto leading-relaxed">
                        The specific subject you seek isn't currently defined in our repository. 
                        It may be categorized under a different name or is awaiting scholarly documentation.
                    </p>
                </div>

                {/* Refined Search */}
                <form onSubmit={handleSearch} className="w-full max-w-md mb-16">
                    <div className="relative group">
                        <div className="relative flex items-center bg-muted/30 rounded-full border border-border/60 hover:border-border transition-all px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/40">
                            <Search className="w-4 h-4 text-muted-foreground ml-4 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for another topic..."
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

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Browse Categories */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <Compass className="w-4 h-4 text-primary/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50">
                                Browse Categories
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/topics?category=${category.id}`}
                                    className="group flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-card/30 hover:bg-muted/30 hover:border-border transition-all duration-300"
                                >
                                    <category.icon className={cn("w-5 h-5 transition-colors", category.color)} />
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                        {category.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Topics */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <Sparkles className="w-4 h-4 text-primary/60" />
                            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50">
                                Suggested Explorations
                            </h2>
                        </div>
                        
                        <div className="space-y-3">
                            {suggestedTopics.length > 0 ? (
                                suggestedTopics.map((topic) => (
                                    <Link
                                        key={topic.id}
                                        href={`/topics/${topic.slug}`}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-card/30 hover:bg-muted/30 hover:border-border transition-all group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {topic.canonical_title || topic.name}
                                            </span>
                                            {topic.topic_type && (
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                                    {topic.topic_type}
                                                </span>
                                            )}
                                        </div>
                                        <ArrowLeft className="w-4 h-4 text-muted-foreground/40 rotate-180 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))
                            ) : (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-2xl bg-muted/20 animate-pulse border border-border/40" />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-20 pt-10 border-t border-border/40 w-full flex flex-col items-center">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Previous page</span>
                        </button>
                        
                        <div className="w-px h-4 bg-border/40" />
                        
                        <Link
                            href="/topics"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>View all topics</span>
                        </Link>

                        <div className="w-px h-4 bg-border/40" />

                        <Link
                            href="/"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Support</span>
                        </Link>
                    </div>
                    
                    <div className="mt-12 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-bold">
                        Repository Status: Topic Indexing
                    </div>
                </div>
            </main>
        </div>
    );
}
