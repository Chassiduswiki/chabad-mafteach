'use client';

import { useEffect, useState, memo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Flame, Sparkles, Users, MapPin, Calendar, BookOpen, Compass, MoreHorizontal
} from 'lucide-react';

// Category configuration with icons and colors
const categoryConfig: Record<string, { icon: any; gradient: string }> = {
    concept: { icon: Compass, gradient: 'from-purple-500 to-indigo-600' },
    person: { icon: Users, gradient: 'from-blue-500 to-cyan-600' },
    sefirah: { icon: Sparkles, gradient: 'from-rose-500 to-pink-600' },
    mitzvah: { icon: BookOpen, gradient: 'from-green-500 to-emerald-600' },
    place: { icon: MapPin, gradient: 'from-amber-500 to-orange-600' },
    event: { icon: Calendar, gradient: 'from-indigo-500 to-violet-600' },
    chassidus: { icon: Flame, gradient: 'from-orange-500 to-red-600' },
};

const defaultConfig = { icon: MoreHorizontal, gradient: 'from-gray-500 to-slate-600' };

interface Category {
    id: string;
    name: string;
    count: number;
}

export const TopicCategoryChips = memo(function TopicCategoryChips() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftFade(scrollLeft > 10);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();

                const cats: Category[] = Object.entries(data.topics || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([id, count]) => ({
                        id,
                        name: id.charAt(0).toUpperCase() + id.slice(1) + 's',
                        count: count as number,
                    }))
                    .sort((a, b) => b.count - a.count);

                setCategories(cats);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        
        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [categories]);

    const handleCategoryClick = (categoryId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId) {
            params.set('category', categoryId);
        } else {
            params.delete('category');
        }
        params.delete('page'); // Reset to page 1 when filtering
        router.push(`/topics?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-2 px-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full flex-shrink-0" />
                ))}
            </div>
        );
    }

    if (categories.length === 0) return null;

    return (
        <div className="relative">
            {showLeftFade && (
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            {showRightFade && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}
            <motion.div
                ref={scrollContainerRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-2 px-2"
            >
            {/* "All" chip */}
            <button
                onClick={() => handleCategoryClick(null)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!currentCategory
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
            >
                All Topics
            </button>

            {/* Category chips */}
            {categories.map((cat) => {
                const config = categoryConfig[cat.id] || defaultConfig;
                const Icon = config.icon;
                const isActive = currentCategory === cat.id;

                return (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{cat.name}</span>
                        <span className={`text-xs ${isActive ? 'text-white/70' : 'text-muted-foreground/70'}`}>
                            {cat.count}
                        </span>
                    </button>
                );
            })}
            </motion.div>
        </div>
    );
});
