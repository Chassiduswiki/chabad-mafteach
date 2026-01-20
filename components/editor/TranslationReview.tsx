'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MessageSquare, Star, AlertCircle } from 'lucide-react';

interface Translation {
    id: number;
    statement_id?: number;
    paragraph_id?: number;
    language_code: string;
    translated_text: string;
    translator_notes?: string;
    quality_score?: number;
    translation_status: 'draft' | 'review' | 'approved' | 'published';
    reviewed_by?: string;
    reviewed_at?: string;
    statement?: { text: string };
    paragraph?: { text: string };
}

interface Language {
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
}

interface TranslationReviewProps {
    onReviewComplete?: () => void;
}

export function TranslationReview({ onReviewComplete }: TranslationReviewProps) {
    const [pendingTranslations, setPendingTranslations] = useState<Translation[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingTranslation, setReviewingTranslation] = useState<Translation | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
    const [qualityScore, setQualityScore] = useState<number>(8);
    const [reviewNotes, setReviewNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPendingTranslations();
        loadLanguages();
    }, []);

    const loadPendingTranslations = async () => {
        try {
            const response = await fetch('/api/editor/translations?status=review');
            const data = await response.json();
            setPendingTranslations(data.translations || []);
        } catch (error) {
            console.error('Failed to load pending translations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLanguages = async () => {
        try {
            const response = await fetch('/api/editor/translations/languages');
            const data = await response.json();
            setLanguages(data.languages || []);
        } catch (error) {
            console.error('Failed to load languages:', error);
        }
    };

    const startReview = (translation: Translation, action: 'approve' | 'reject') => {
        setReviewingTranslation(translation);
        setReviewAction(action);
        setQualityScore(action === 'approve' ? 8 : 1);
        setReviewNotes('');
    };

    const submitReview = async () => {
        if (!reviewingTranslation || !reviewAction) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/editor/translations/${reviewingTranslation.id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: reviewAction,
                    quality_score: reviewAction === 'approve' ? qualityScore : null,
                    review_notes: reviewNotes.trim() || null
                })
            });

            if (response.ok) {
                // Remove from pending list
                setPendingTranslations(prev => prev.filter(t => t.id !== reviewingTranslation.id));
                setReviewingTranslation(null);
                setReviewAction(null);
                onReviewComplete?.();
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getLanguageName = (code: string) => {
        return languages.find(l => l.code === code)?.name || code;
    };

    const getOriginalText = (translation: Translation) => {
        return translation.statement?.text || translation.paragraph?.text || '';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (reviewingTranslation) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                        Review Translation - {getLanguageName(reviewingTranslation.language_code)}
                    </h3>
                    <button
                        onClick={() => setReviewingTranslation(null)}
                        className="px-3 py-1 text-muted-foreground hover:text-foreground text-sm"
                    >
                        Cancel
                    </button>
                </div>

                {/* Original and Translation Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Original Text
                        </h4>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div
                                className="prose prose-sm max-w-none text-blue-900 dark:text-blue-100"
                                dangerouslySetInnerHTML={{ __html: getOriginalText(reviewingTranslation) }}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Translation
                        </h4>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div
                                className="prose prose-sm max-w-none text-green-900 dark:text-green-100"
                                dangerouslySetInnerHTML={{ __html: reviewingTranslation.translated_text }}
                            />
                        </div>
                    </div>
                </div>

                {/* Review Form */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h4 className="font-medium text-foreground mb-4">
                        Review Decision: {reviewAction === 'approve' ? 'Approve' : 'Reject'} Translation
                    </h4>

                    <div className="space-y-4">
                        {reviewAction === 'approve' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Quality Score (1-10)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={qualityScore}
                                        onChange={(e) => setQualityScore(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-medium">{qualityScore}/10</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Poor</span>
                                    <span>Excellent</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Review Notes (Optional)
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add comments about the translation quality, suggestions for improvement, etc."
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={submitReview}
                                disabled={submitting}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                                    reviewAction === 'approve'
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                } disabled:opacity-50`}
                            >
                                {reviewAction === 'approve' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                {submitting ? 'Submitting...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Translation`}
                            </button>

                            <button
                                onClick={() => setReviewingTranslation(null)}
                                className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-foreground">Translation Review Queue</h3>
                    <span className="text-sm text-muted-foreground">
                        ({pendingTranslations.length} pending)
                    </span>
                </div>
            </div>

            {pendingTranslations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                    <p className="text-sm">No translations are currently waiting for review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingTranslations.map((translation) => (
                        <div
                            key={translation.id}
                            className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-foreground">
                                            {getLanguageName(translation.language_code)}
                                        </span>
                                        <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 px-2 py-1 rounded">
                                            Awaiting Review
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {translation.statement_id ? 'Statement' : 'Paragraph'} translation
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Original
                                    </div>
                                    <div
                                        className="text-sm text-foreground line-clamp-3"
                                        dangerouslySetInnerHTML={{ __html: getOriginalText(translation) }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Translation
                                    </div>
                                    <div
                                        className="text-sm text-foreground line-clamp-3"
                                        dangerouslySetInnerHTML={{ __html: translation.translated_text }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => startReview(translation, 'approve')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => startReview(translation, 'reject')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                {translation.translator_notes && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MessageSquare className="w-3 h-3" />
                                        Has translator notes
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
