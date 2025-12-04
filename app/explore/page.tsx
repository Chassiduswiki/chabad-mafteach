'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExplorePage() {
    const [activeFilter, setActiveFilter] = useState('Wisdom');

    const exploreFilters = ['Wisdom', 'Chabad', 'Mussar', 'Philosophy'];

    const scrollAccounts = [
        { id: 1, name: 'Rebbe', initial: 'R' },
        { id: 2, name: 'Tanya', initial: 'T' },
        { id: 3, name: 'Sichos', initial: 'S' },
        { id: 4, name: 'Maamar', initial: 'M' },
    ];

    const rebbeimQuotes = [
        {
            id: 1,
            text: "The world is full of wonders, but the person must rise above to see.",
            author: "Rebbe Nachman",
            initial: "N"
        },
        {
            id: 2,
            text: "A little bit of light dispels a lot of darkness.",
            author: "Alter Rebbe",
            initial: "A"
        },
        {
            id: 3,
            text: "Joy breaks through all barriers and opens the gates of Heaven.",
            author: "Tzemach Tzedek",
            initial: "T"
        },
        {
            id: 4,
            text: "Think good and it will be good.",
            author: "Tzemach Tzedek",
            initial: "T"
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 pt-8 px-5">
            <div className="max-w-2xl mx-auto space-y-7">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-wide">QUOTES FROM REBBEIM</h1>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-primary/30 shadow-lg shadow-primary/20"></div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {exploreFilters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                activeFilter === filter
                                    ? "bg-primary text-primary-foreground shadow-lg"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Scroll Accounts */}
                <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
                    {scrollAccounts.map(account => (
                        <div key={account.id} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-2 border-primary/30 shadow-lg shadow-primary/20">
                                <span className="text-primary-foreground font-bold text-lg">{account.initial}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{account.name}</span>
                        </div>
                    ))}
                </div>

                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scroll Accounts</h2>

                {/* Quote Cards */}
                <div className="space-y-4">
                    {rebbeimQuotes.map(quote => (
                        <div key={quote.id} className="bg-card border border-border rounded-xl p-6 hover:bg-accent/50 transition-colors shadow-sm">
                            <div className="flex gap-5">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-2 border-primary/30 flex-shrink-0 shadow-lg shadow-primary/20">
                                    <span className="text-primary-foreground font-bold text-xl">{quote.initial}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-card-foreground text-base leading-relaxed mb-3 font-serif italic">
                                        "{quote.text}"
                                    </p>
                                    <p className="text-muted-foreground text-sm">— {quote.author}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
