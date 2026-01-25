'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { ZenCard } from '@/components/explore/ZenCard';
import { motion, AnimatePresence } from 'framer-motion';

interface RandomStatement {
    id: number;
    text: string;
    translated_text?: string | null;
    source: {
        document_title: string;
        document_id: number;
        paragraph_order?: string;
    };
}

export default function ExplorePage() {
    const [statement, setStatement] = useState<RandomStatement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRandomStatement = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/statements/random');
            if (!res.ok) throw new Error('Failed to fetch insight');
            const data = await res.json();
            setStatement(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Could not load insight. Pull to try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRandomStatement();
    }, [fetchRandomStatement]);

    // Pull-to-refresh logic could be added here later with a library like react-use-gesture
    // For now, we use the "Next" button in ZenCard

    return (
        <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
            {/* Background Vibe */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 border-b border-border/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Explore</h1>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 text-primary/40" />
                    Random Insight
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center px-6"
                        >
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <button
                                onClick={fetchRandomStatement}
                                className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    ) : statement ? (
                        <ZenCard
                            key={statement.id}
                            statement={statement}
                            onNext={fetchRandomStatement}
                            isLoading={loading}
                        />
                    ) : (
                        <div key="loading" className="flex flex-col items-center gap-4">
                            <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse">Finding a pearl of Chassidus...</p>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Hint for mobile */}
            <footer className="relative z-10 py-8 text-center sm:hidden">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-30">
                    Pull or Click Next to discover more
                </p>
            </footer>
        </div>
    );
}
