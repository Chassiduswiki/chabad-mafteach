'use client';

import { useState, useEffect } from 'react';
import type { Topic } from '@/lib/directus';
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  topics: Topic[];
  sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
}

interface BookReaderProps {
  paragraphText: string;
  statements: StatementWithTopics[];
  topicsInPerek: Topic[];
  sources: { id: number; title: string; external_url?: string | null }[];
  currentPerek: number;
  totalPerek?: number;
  isLoading?: boolean;
}

export function BookReader({
  paragraphText,
  statements,
  topicsInPerek,
  sources,
  currentPerek,
  totalPerek = 10,
  isLoading = false
}: BookReaderProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [viewedStatements, setViewedStatements] = useState<Set<number>>(new Set());
  const router = useRouter();

  const selected = selectedId != null ? statements.find((s) => s.id === selectedId) || null : null;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    // Track reading progress
    setViewedStatements(prev => new Set(prev).add(id));
  };

  const handleClose = () => setSelectedId(null);

  const navigateToChapter = (chapter: number) => {
    router.push(`/seforim/tanya-likkutei-amarim/${chapter}`);
  };

  // Calculate reading progress
  useEffect(() => {
    if (statements.length > 0) {
      const progress = (viewedStatements.size / statements.length) * 100;
      setReadingProgress(progress);
    }
  }, [viewedStatements, statements.length]);

  if (isLoading) {
    return <BookReaderSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 dark:from-stone-900/30 dark:via-stone-900 dark:to-stone-900/20">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Chapter Header */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <h1 className="text-lg font-serif text-foreground">Perek {currentPerek}</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {viewedStatements.size} of {statements.length} sentences read
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:py-12">
        {/* Book-like Text Container */}
        <div className="bg-white/60 dark:bg-stone-800/40 rounded-lg shadow-sm border border-amber-200/30 dark:border-amber-900/30">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="font-hebrew font-serif text-[17px] sm:text-[18px] lg:text-[20px] leading-[1.8] text-stone-800 dark:text-stone-200 tracking-wide">
              {statements.length > 0 ? (
                statements.map((s, idx) => (
                  <span
                    key={s.id}
                    onClick={() => handleSelect(s.id)}
                    className={`
                      cursor-pointer transition-all duration-200 rounded-sm px-0.5 -mx-0.5
                      hover:bg-amber-200/40 dark:hover:bg-amber-900/30
                      ${viewedStatements.has(s.id) ? 'text-stone-600 dark:text-stone-400' : 'text-stone-900 dark:text-stone-100'}
                    `}
                  >
                    {s.text}
                    {idx < statements.length - 1 && ' '}
                  </span>
                ))
              ) : (
                <p className="text-stone-700 dark:text-stone-300">{paragraphText}</p>
              )}
            </div>
            
            {statements.length > 0 && (
              <p className="mt-6 text-xs text-stone-500 dark:text-stone-400 text-center font-medium uppercase tracking-wide">
                Tap any sentence to explore its topics and sources
              </p>
            )}
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={() => navigateToChapter(currentPerek - 1)}
            disabled={currentPerek <= 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${currentPerek <= 1 
                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Perek
          </button>

          <div className="text-sm text-muted-foreground">
            {currentPerek} of {totalPerek}
          </div>

          <button
            onClick={() => navigateToChapter(currentPerek + 1)}
            disabled={currentPerek >= totalPerek}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${currentPerek >= totalPerek 
                ? 'text-muted-foreground bg-muted cursor-not-allowed' 
                : 'text-foreground bg-background border border-border hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            Next Perek
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Topics & Sources Sidebar (hidden on mobile) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2" />
          <div className="space-y-6">
            <div className="bg-background/60 rounded-lg border border-border p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Topics in this Perek
              </h2>
              {topicsInPerek.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No topics linked yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {topicsInPerek.map((t) => (
                    <li key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors">
                      <span className="font-medium">{t.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-background/60 rounded-lg border border-border p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Sources
              </h2>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No sources linked yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {sources.map((s) => (
                    <li key={s.id} className="flex flex-col p-2 rounded hover:bg-accent/50 transition-colors">
                      <span className="font-medium">{s.title}</span>
                      {s.external_url && (
                        <a
                          href={s.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          View Source →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Mobile Bottom Sheet */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={handleClose}>
          <div 
            className="w-full max-w-2xl rounded-t-2xl bg-background border-t border-border shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 bg-muted-foreground/30 rounded-full" />
            </div>
            
            <div className="px-4 pb-6 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Statement {selected.order_key}
                </div>
                <button
                  onClick={handleClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded hover:bg-accent"
                >
                  Close
                </button>
              </div>
              
              <div className="font-serif text-[17px] leading-relaxed mb-6 text-stone-800 dark:text-stone-200">
                {selected.text}
              </div>

              {selected.topics.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Topics
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.topics.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.sources.length > 0 && (
                <div>
                  <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sources & Citations
                  </div>
                  <div className="space-y-3">
                    {selected.sources.map((s) => (
                      <div key={s.id} className="bg-accent/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{s.title}</span>
                          {s.relationship_type && (
                            <span className="text-xs text-muted-foreground capitalize">{s.relationship_type}</span>
                          )}
                        </div>
                        {(s.page_number || s.verse_reference) && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {s.verse_reference && <span>{s.verse_reference}</span>}
                            {s.verse_reference && s.page_number && <span> • </span>}
                            {s.page_number && <span>Page {s.page_number}</span>}
                          </div>
                        )}
                        {s.external_url && (
                          <a
                            href={s.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookReaderSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 dark:from-stone-900/30 dark:via-stone-900 dark:to-stone-900/20">
      {/* Progress Bar Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div className="h-full bg-muted animate-pulse" style={{ width: '30%' }} />
      </div>

      {/* Header Skeleton */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:py-12">
        <div className="bg-white/60 dark:bg-stone-800/40 rounded-lg shadow-sm border border-amber-200/30 dark:border-amber-900/30">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${Math.random() * 30 + 70}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </main>
    </div>
  );
}
