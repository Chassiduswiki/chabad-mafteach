'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft, Filter } from 'lucide-react';

const categories = [
    { id: 'all', name: 'All Topics', count: null },
    { id: 'avodah', name: 'Avodah' },
    { id: 'emunah', name: 'Emunah' },
    { id: 'theology', name: 'Theology' },
    { id: 'kabbalah', name: 'Kabbalah' },
    { id: 'halacha', name: 'Halacha' },
    { id: 'people', name: 'People' },
    { id: 'places', name: 'Places' },
    { id: 'events', name: 'Events' }
];

export function IndexSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('category') || 'all';

    // Load collapse state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('index_sidebar_collapsed');
        if (saved !== null) setCollapsed(saved === 'true');
    }, []);

    const toggleCollapsed = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('index_sidebar_collapsed', String(newState));
    };

    return (
        <aside className="hidden lg:block">
            <div className={`sticky top-24 transition-all duration-300 ${collapsed ? 'w-12' : 'w-56'}`}>
                {collapsed ? (
                    <button
                        onClick={toggleCollapsed}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Filter className="h-4 w-4" />
                                <span>Filter by Category</span>
                            </div>
                            <button
                                onClick={toggleCollapsed}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                aria-label="Collapse sidebar"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {categories.map((cat) => {
                                const isActive = cat.id === activeCategory || (cat.id === 'all' && !searchParams.get('category'));
                                const href = cat.id === 'all' ? pathname : `${pathname}?category=${cat.id}`;

                                return (
                                    <Link
                                        key={cat.id}
                                        href={href}
                                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        {cat.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>
        </aside>
    );
}
