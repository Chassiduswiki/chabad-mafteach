'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { readItems } from '@directus/sdk';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Statement {
    id: number;
    order_key: string;
    text: string;
}

export default function TanyaPerekPage() {
    const params = useParams();
    const router = useRouter();
    const perek = parseInt(params.perek as string) || 1;
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);
    const totalPerek = 10; // Default total chapters

    useEffect(() => {
        const fetchStatements = async () => {
            try {
                // For now, return placeholder data since we removed the specific entries
                const placeholderStatements: Statement[] = [
                    { id: 1, order_key: '1', text: 'This sefer content has been temporarily removed. The library structure is preserved but the specific entries are no longer available.' },
                    { id: 2, order_key: '2', text: 'You can browse other available seforim from the main seforim page.' },
                ];
                setStatements(placeholderStatements);
            } catch (error) {
                console.error('Error fetching statements:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatements();
    }, [perek]);

    const navigateToChapter = (chapter: number) => {
        if (chapter >= 1 && chapter <= totalPerek) {
            router.push(`/seforim/tanya-likkutei-amarim/${chapter}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded-lg w-48"></div>
                        <div className="space-y-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-4 bg-muted rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Tanya Likkutei Amarim</h1>
                            <p className="text-sm text-muted-foreground">Chapter {perek} of {totalPerek}</p>
                        </div>
                    </div>
                    <Link 
                        href="/seforim"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Seforim
                    </Link>
                </div>

                {/* Content */}
                <div className="bg-background/50 rounded-2xl border border-border p-8 sm:p-10 lg:p-14">
                    <div className="font-serif text-[18px] sm:text-[19px] lg:text-[21px] leading-[2] text-foreground tracking-wide">
                        {statements.length > 0 ? (
                            statements.map((s, idx) => (
                                <span key={s.id} className="text-foreground">
                                    {s.text}
                                    {idx < statements.length - 1 && ' '}
                                </span>
                            ))
                        ) : (
                            <p className="text-foreground leading-relaxed">
                                No content available for this chapter.
                            </p>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigateToChapter(perek - 1)}
                        disabled={perek <= 1}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                            ${perek <= 1 
                                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Chapter
                    </button>

                    <div className="text-sm text-muted-foreground">
                        {perek} of {totalPerek}
                    </div>

                    <button
                        onClick={() => navigateToChapter(perek + 1)}
                        disabled={perek >= totalPerek}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                            ${perek >= totalPerek 
                                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                    >
                        Next Chapter
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
