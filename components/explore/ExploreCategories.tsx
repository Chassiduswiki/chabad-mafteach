'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Flame, // Avodah
    Heart, // Emunah
    BookOpen, // Theology
    Sparkles, // Kabbalah
    Scale, // Halacha
    Users, // People
    MapPin, // Places
    Calendar // Events
} from 'lucide-react';

const categories = [
    {
        id: 'avodah',
        name: 'Avodah',
        description: 'Service of the Heart',
        icon: Flame,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    },
    {
        id: 'emunah',
        name: 'Emunah',
        description: 'Faith & Trust',
        icon: Heart,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20'
    },
    {
        id: 'theology',
        name: 'Theology',
        description: 'Understanding G-dliness',
        icon: BookOpen,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    },
    {
        id: 'kabbalah',
        name: 'Kabbalah',
        description: 'Hidden Wisdom',
        icon: Sparkles,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    },
    {
        id: 'halacha',
        name: 'Halacha',
        description: 'Jewish Law',
        icon: Scale,
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20'
    },
    {
        id: 'people',
        name: 'People',
        description: 'Rebbeim & Chassidim',
        icon: Users,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20'
    },
    {
        id: 'places',
        name: 'Places',
        description: 'Holy Sites',
        icon: MapPin,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
    },
    {
        id: 'events',
        name: 'Events',
        description: 'Chassidic Calendar',
        icon: Calendar,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20'
    }
];

export function ExploreCategories() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => (
                <Link
                    key={category.id}
                    href={`/topics?category=${category.id}`}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${category.bg} ${category.color}`}>
                        <category.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {category.description}
                    </p>
                    <div className={`absolute inset-0 border-2 opacity-0 transition-opacity group-hover:opacity-100 ${category.border} rounded-xl pointer-events-none`} />
                </Link>
            ))}
        </div>
    );
}
