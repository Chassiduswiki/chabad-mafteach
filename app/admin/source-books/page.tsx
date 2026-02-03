"use client";

import React from 'react';
import { Loader2, Save, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validatePageBoundaries } from '@/lib/source-links';
import type { SourceBookChapter } from '@/lib/types';

interface SourceBook {
    id: string;
    canonical_name: string;
    hebrew_name?: string;
    slug?: string;
    hebrewbooks_id?: number;
    hebrewbooks_offset?: number;
    reference_style?: string;
}

interface ValidationSummary {
    totalBooks: number;
    booksWithOverlaps: number;
    totalOverlaps: number;
    booksWithMissing: number;
}

interface BulkValidationResult {
    summary: ValidationSummary;
    results: Array<{
        bookId: string;
        canonicalName: string;
        overlaps: Array<{
            current: { id: string; chapterNumber?: number; chapterName?: string; range: { start: number; end: number } };
            next: { id: string; chapterNumber?: number; chapterName?: string; range: { start: number; end: number } };
        }>;
        missingCount: number;
    }>;
}

const statusStyles: Record<string, string> = {
    valid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    overlap: 'bg-red-100 text-red-700 border-red-200',
    missing: 'bg-amber-100 text-amber-700 border-amber-200',
    invalid: 'bg-rose-100 text-rose-700 border-rose-200',
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function SourceBookBoundariesPage() {
    const [books, setBooks] = React.useState<SourceBook[]>([]);
    const [selectedBookId, setSelectedBookId] = React.useState('');
    const [chapters, setChapters] = React.useState<SourceBookChapter[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [bulkValidating, setBulkValidating] = React.useState(false);
    const [bulkResults, setBulkResults] = React.useState<BulkValidationResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [dirtyIds, setDirtyIds] = React.useState<Set<string>>(new Set());

    const validation = React.useMemo(() => validatePageBoundaries(chapters), [chapters]);

    const overlapMap = React.useMemo(() => {
        const map = new Map<string, string>();
        validation.overlaps.forEach(overlap => {
            map.set(
                overlap.current.id,
                `Overlaps next (${overlap.next.chapter_number ?? overlap.next.sort ?? 'n/a'})`
            );
            map.set(
                overlap.next.id,
                `Overlaps previous (${overlap.current.chapter_number ?? overlap.current.sort ?? 'n/a'})`
            );
        });
        return map;
    }, [validation.overlaps]);

    const fetchBooks = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/source-books');
            if (!response.ok) {
                throw new Error('Failed to load source books');
            }
            const data = await response.json();
            setBooks(data.data || []);
            if (data.data?.length && !selectedBookId) {
                setSelectedBookId(data.data[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load source books');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBookId]);

    const fetchChapters = React.useCallback(async (bookId: string) => {
        if (!bookId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/admin/source-books/${bookId}/chapters`);
            if (!response.ok) {
                throw new Error('Failed to load chapters');
            }
            const data = await response.json();
            setChapters(data.data || []);
            setDirtyIds(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chapters');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    React.useEffect(() => {
        if (selectedBookId) {
            fetchChapters(selectedBookId);
        }
    }, [selectedBookId, fetchChapters]);

    const handleBoundaryChange = (chapterId: string, field: 'hebrewbooks_start_page' | 'hebrewbooks_end_page', value: string) => {
        setChapters(prev =>
            prev.map(chapter => {
                if (chapter.id !== chapterId) return chapter;
                const nextValue = value === '' ? null : Number(value);
                if (nextValue !== null && Number.isNaN(nextValue)) return chapter;
                return { ...chapter, [field]: nextValue };
            })
        );
        setDirtyIds(prev => new Set(prev).add(chapterId));
    };

    const handleSave = async () => {
        if (!selectedBookId || dirtyIds.size === 0) return;
        setIsSaving(true);
        setError(null);
        try {
            const updates = chapters
                .filter(chapter => dirtyIds.has(chapter.id))
                .map(chapter => ({
                    id: chapter.id,
                    hebrewbooks_start_page: chapter.hebrewbooks_start_page ?? null,
                    hebrewbooks_end_page: chapter.hebrewbooks_end_page ?? null,
                }));

            const response = await fetch(`/api/admin/source-books/${selectedBookId}/chapters`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!response.ok) {
                throw new Error('Failed to save page boundaries');
            }

            const data = await response.json();
            setChapters(data.data || []);
            setDirtyIds(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save page boundaries');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkValidate = async () => {
        setBulkValidating(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/source-books/validate', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Bulk validation failed');
            }
            const data = await response.json();
            setBulkResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bulk validation failed');
        } finally {
            setBulkValidating(false);
        }
    };

    const selectedBook = books.find(book => book.id === selectedBookId);

    return (
        <div className="px-6 py-8 space-y-6 max-w-[1400px] mx-auto">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Chapter Page Boundaries</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define HebrewBooks page ranges per chapter. Legacy start/end values are used when HebrewBooks fields are empty.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchChapters(selectedBookId)}
                        disabled={isLoading || !selectedBookId}
                    >
                        <RefreshCw className={cn('w-4 h-4 mr-2', isLoading ? 'animate-spin' : '')} />
                        Refresh
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || dirtyIds.size === 0}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Boundaries
                    </Button>
                </div>
            </div>

            {error && (
                <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <label className="text-xs uppercase tracking-widest text-muted-foreground">Select Book</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedBookId}
                            onChange={e => setSelectedBookId(e.target.value)}
                        >
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.canonical_name}
                                </option>
                            ))}
                        </select>
                        {selectedBook && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Hebrew name: {selectedBook.hebrew_name || '—'}</div>
                                <div>HebrewBooks ID: {selectedBook.hebrewbooks_id || '—'}</div>
                                <div>Reference style: {selectedBook.reference_style || '—'}</div>
                            </div>
                        )}
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold">Bulk Validation</h2>
                                <p className="text-xs text-muted-foreground">Scan every book for overlaps or missing ranges.</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleBulkValidate} disabled={bulkValidating}>
                                {bulkValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                Validate All
                            </Button>
                        </div>
                        {bulkResults && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Total books: {bulkResults.summary.totalBooks}</div>
                                <div>Books with overlaps: {bulkResults.summary.booksWithOverlaps}</div>
                                <div>Total overlaps: {bulkResults.summary.totalOverlaps}</div>
                                <div>Books with missing ranges: {bulkResults.summary.booksWithMissing}</div>
                            </div>
                        )}
                    </div>

                    {bulkResults && (
                        <div className="bg-card border border-border rounded-xl p-4 space-y-2 max-h-[360px] overflow-y-auto">
                            <h3 className="text-sm font-semibold">Overlap Report</h3>
                            {bulkResults.results.filter(result => result.overlaps.length > 0).length === 0 && (
                                <div className="text-xs text-emerald-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    No overlaps detected.
                                </div>
                            )}
                            {bulkResults.results.filter(result => result.overlaps.length > 0).map(result => (
                                <div key={result.bookId} className="text-xs text-muted-foreground space-y-1">
                                    <div className="font-semibold text-foreground">{result.canonicalName}</div>
                                    {result.overlaps.map((overlap, idx) => (
                                        <div key={`${result.bookId}-${idx}`} className="text-red-600">
                                            {overlap.current.chapterNumber ?? '—'} ({overlap.current.range.start}-{overlap.current.range.end}) overlaps
                                            {' '}
                                            {overlap.next.chapterNumber ?? '—'} ({overlap.next.range.start}-{overlap.next.range.end})
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-2xl">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Chapter Boundaries</h2>
                            <p className="text-xs text-muted-foreground">Edit HebrewBooks start/end pages per chapter.</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {chapters.length} chapters
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-10 flex items-center justify-center text-muted-foreground">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Loading chapters...
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            <div className="grid grid-cols-[100px_1fr_140px_140px_120px_160px] gap-3 px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                                <div>Chapter</div>
                                <div>Name</div>
                                <div>Start</div>
                                <div>End</div>
                                <div>Status</div>
                                <div>Notes</div>
                            </div>
                            {chapters.map(chapter => {
                                const status = validation.statusById[chapter.id] ?? chapter.page_validation_status ?? 'pending';
                                const overlapNote = overlapMap.get(chapter.id);
                                const rowHighlight = status === 'overlap' ? 'bg-red-50/60' : status === 'invalid' ? 'bg-rose-50/60' : '';
                                return (
                                    <div
                                        key={chapter.id}
                                        className={cn(
                                            'grid grid-cols-[100px_1fr_140px_140px_120px_160px] gap-3 px-5 py-3 items-center text-sm',
                                            rowHighlight
                                        )}
                                    >
                                        <div className="text-muted-foreground">
                                            {chapter.chapter_number ?? chapter.sort ?? '—'}
                                        </div>
                                        <div className="text-foreground">
                                            <div className="font-medium">{chapter.chapter_name || 'Untitled'}</div>
                                            {chapter.chapter_name_english && (
                                                <div className="text-xs text-muted-foreground">{chapter.chapter_name_english}</div>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            value={chapter.hebrewbooks_start_page ?? ''}
                                            placeholder={chapter.start_page?.toString() ?? ''}
                                            onChange={e => handleBoundaryChange(chapter.id, 'hebrewbooks_start_page', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            value={chapter.hebrewbooks_end_page ?? ''}
                                            placeholder={chapter.end_page?.toString() ?? ''}
                                            onChange={e => handleBoundaryChange(chapter.id, 'hebrewbooks_end_page', e.target.value)}
                                        />
                                        <div>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold',
                                                    statusStyles[status] || statusStyles.pending
                                                )}
                                            >
                                                {status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {overlapNote || (status === 'missing' ? 'Missing range' : status === 'invalid' ? 'Start > End' : '—')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
