'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Flame, // Chassidus
    Sparkles, // Sefirah
    Users, // Person
    MapPin, // Place
    Calendar, // Event
    BookOpen, // Mitzvah
    Compass, // Concept
    Book, // Tanach
    Bookmark, // Gemara
    History, // Rishonim / Acharonim
    Zap, // Acharonim
    MoreHorizontal, // Other
    Hash,
    ChevronRight
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';

// Icon and color mapping with gradients for premium feel
const categoryConfig: Record<string, {
    icon: any;
    gradient: string;
    bgGradient: string;
    description: string
}> = {
    // Topic types
    concept: {
        icon: Compass,
        gradient: 'from-purple-500 to-indigo-600',
        bgGradient: 'from-purple-500/20 to-indigo-600/10',
        description: 'Philosophical & spiritual ideas'
    },
    person: {
        icon: Users,
        gradient: 'from-blue-500 to-cyan-600',
        bgGradient: 'from-blue-500/20 to-cyan-600/10',
        description: 'Rebbeim, Chassidim & Sages'
    },
    sefirah: {
        icon: Sparkles,
        gradient: 'from-rose-500 to-pink-600',
        bgGradient: 'from-rose-500/20 to-pink-600/10',
        description: 'Divine emanations & attributes'
    },
    mitzvah: {
        icon: BookOpen,
        gradient: 'from-green-500 to-emerald-600',
        bgGradient: 'from-green-500/20 to-emerald-600/10',
        description: 'Divine commandments & deeds'
    },
    place: {
        icon: MapPin,
        gradient: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-500/20 to-orange-600/10',
        description: 'Holy sites & geographic history'
    },
    event: {
        icon: Calendar,
        gradient: 'from-indigo-500 to-violet-600',
        bgGradient: 'from-indigo-500/20 to-violet-600/10',
        description: 'Historical moments & calendar'
    },
    // Document categories
    chassidus: {
        icon: Flame,
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-500/20 to-red-600/10',
        description: 'Inner dimensions of Torah'
    },
    tanach: {
        icon: Book,
        gradient: 'from-slate-500 to-gray-600',
        bgGradient: 'from-slate-500/20 to-gray-600/10',
        description: 'Torah, Prophets & Writings'
    },
    gemara: {
        icon: Bookmark,
        gradient: 'from-blue-600 to-indigo-700',
        bgGradient: 'from-blue-600/20 to-indigo-700/10',
        description: 'Talmudic law & lore'
    },
    rishonim: {
        icon: History,
        gradient: 'from-emerald-500 to-teal-600',
        bgGradient: 'from-emerald-500/20 to-teal-600/10',
        description: 'Early Commentators'
    },
    acharonim: {
        icon: Zap,
        gradient: 'from-cyan-500 to-sky-600',
        bgGradient: 'from-cyan-500/20 to-sky-600/10',
        description: 'Later Authorities'
    },
    entry: {
        icon: Hash,
        gradient: 'from-teal-500 to-green-600',
        bgGradient: 'from-teal-500/20 to-green-600/10',
        description: 'Encyclopedia entries'
    },
    sefer: {
        icon: Book,
        gradient: 'from-violet-500 to-purple-600',
        bgGradient: 'from-violet-500/20 to-purple-600/10',
        description: 'Complete seforim'
    },
};

// Default config for unknown categories
const defaultConfig = {
    icon: MoreHorizontal,
    gradient: 'from-gray-500 to-slate-600',
    bgGradient: 'from-gray-500/20 to-slate-600/10',
    description: 'Other items'
};

interface Category {
    id: string;
    name: string;
    count: number;
    description: string;
    icon: any;
    gradient: string;
    bgGradient: string;
}

const CategoryCard = ({ category, href, index }: { category: Category, href: string, index: number }) => {
    const Icon = category.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <Link
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 active:scale-[0.98]"
            >
                {/* Gradient background that shows on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Card content - mobile optimized */}
                <div className="relative p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        {/* Icon with gradient background */}
                        <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {category.name}
                                </h3>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 mt-0.5">
                                {category.description}
                            </p>

                            {/* Count badge */}
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {category.count} {category.count === 1 ? 'item' : 'items'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtle bottom gradient line */}
                <div className={`h-0.5 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
        </motion.div>
    );
};

// Loading skeleton
const CategorySkeleton = () => (
    <div className="rounded-2xl bg-card/60 border border-border/50 p-4 sm:p-5">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
            </div>
        </div>
    </div>
);

export const ExploreCategories = memo(function ExploreCategories() {
    const [topicCategories, setTopicCategories] = useState<Category[]>([]);
    const [documentCategories, setDocumentCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();

                // Build topic categories from actual data
                const topics: Category[] = Object.entries(data.topics || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([id, count]) => {
                        const config = categoryConfig[id] || defaultConfig;
                        return {
                            id,
                            name: id.charAt(0).toUpperCase() + id.slice(1) + 's',
                            count: count as number,
                            description: config.description,
                            icon: config.icon,
                            gradient: config.gradient,
                            bgGradient: config.bgGradient,
                        };
                    });

                // Build document categories from actual data
                const docCats = { ...data.documents, ...data.docTypes };
                const documents: Category[] = Object.entries(docCats || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([id, count]) => {
                        const config = categoryConfig[id] || defaultConfig;
                        return {
                            id,
                            name: id.charAt(0).toUpperCase() + id.slice(1),
                            count: count as number,
                            description: config.description,
                            icon: config.icon,
                            gradient: config.gradient,
                            bgGradient: config.bgGradient,
                        };
                    });

                setTopicCategories(topics);
                setDocumentCategories(documents);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="space-y-12">
                <section>
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <CategorySkeleton key={i} />
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Topics Section */}
            {topicCategories.length > 0 && (
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-1 mb-6"
                    >
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            Browse Topics
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Explore concepts, people, and events in Chassidus
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {topicCategories.map((category, index) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                href={`/topics?category=${category.id}`}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Seforim Section */}
            {documentCategories.length > 0 && (
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-1 mb-6"
                    >
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            Browse Seforim
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Discover literature by historical era and genre
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {documentCategories.map((category, index) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                href={`/seforim?category=${category.id}`}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {topicCategories.length === 0 && documentCategories.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 px-4"
                >
                    <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-6">
                        <Compass className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No categories yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Categories will appear here once content is added to the system.
                    </p>
                </motion.div>
            )}
        </div>
    );
});
