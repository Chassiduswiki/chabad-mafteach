'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InstantLookup } from '@/components/InstantLookup';
import { Sparkles } from 'lucide-react';

export default function LookupDemoPage() {
    const [lookupTerm, setLookupTerm] = useState<string | null>(null);
    const [lookupPosition, setLookupPosition] = useState({ x: 0, y: 0 });

    function handleTermClick(term: string, event: React.MouseEvent) {
        setLookupPosition({ x: event.clientX, y: event.clientY });
        setLookupTerm(term);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                        ← Back to Home
                    </Link>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight">
                        InstantLookup Demo
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Click on any <span className="font-semibold text-primary">highlighted term</span> to see the InstantLookup popup in action.
                    </p>
                </div>

                {/* Demo Content */}
                <div className="space-y-8">
                    <div className="rounded-2xl border border-border bg-muted/30 p-8">
                        <h2 className="mb-4 text-2xl font-semibold">Sample Text with Lookup Terms</h2>

                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <p className="leading-relaxed">
                                In Chassidic philosophy, the concept of{' '}
                                <button
                                    onClick={(e) => handleTermClick('Bittul', e)}
                                    className="font-semibold text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer transition-colors"
                                >
                                    Bittul
                                </button>{' '}
                                (self-nullification) is fundamental to understanding divine service. It relates closely to{' '}
                                <button
                                    onClick={(e) => handleTermClick('Ahavas Yisroel', e)}
                                    className="font-semibold text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer transition-colors"
                                >
                                    Ahavas Yisroel
                                </button>{' '}
                                (love of fellow Jews), as both require transcending one's ego.
                            </p>

                            <p className="leading-relaxed">
                                The{' '}
                                <button
                                    onClick={(e) => handleTermClick('Hiskashrus', e)}
                                    className="font-semibold text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer transition-colors"
                                >
                                    Hiskashrus
                                </button>{' '}
                                (connection) between a Chassid and the Rebbe enables the Chassid to receive spiritual guidance and blessing. This connection is essential for proper{' '}
                                <button
                                    onClick={(e) => handleTermClick('Avodah B\'Gashmiyus', e)}
                                    className="font-semibold text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer transition-colors"
                                >
                                    Avodah B'Gashmiyus
                                </button>{' '}
                                (divine service through physical activities).
                            </p>

                            <p className="leading-relaxed">
                                At the deepest level of the soul is the{' '}
                                <button
                                    onClick={(e) => handleTermClick('Yechidah', e)}
                                    className="font-semibold text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer transition-colors"
                                >
                                    Yechidah
                                </button>
                                , which is utterly one with G-d and transcends all levels of consciousness.
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                        <div className="flex items-start gap-3">
                            <Sparkles className="mt-1 h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">How to Use</h3>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Click any highlighted term to see its instant definition</li>
                                    <li>• Press <kbd className="rounded bg-background px-1.5 py-0.5">ESC</kbd> to close the popup</li>
                                    <li>• Press <kbd className="rounded bg-background px-1.5 py-0.5">Enter</kbd> to navigate to the full topic page</li>
                                    <li>• Click outside the popup to dismiss it</li>
                                    <li>• Try clicking "2-min Overview" or "Full Topic →" buttons</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* InstantLookup Popup */}
            {lookupTerm && (
                <InstantLookup
                    term={lookupTerm}
                    position={lookupPosition}
                    onClose={() => setLookupTerm(null)}
                />
            )}
        </div>
    );
}
