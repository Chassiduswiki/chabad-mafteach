'use client';

import { useState, useEffect } from 'react';
import type { Topic } from '@/lib/types';
import { Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  topics: Topic[];
  sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
}

interface TorahReaderProps {
  // Document info
  documentTitle: string;
  documentType?: string;

  // Content structure - flexible for any sefer
  sections: Array<{
    id: number;
    title?: string;
    order_key: string;
    statements: StatementWithTopics[];
  }>;

  // Current position info
  currentSection: number;
  totalSections?: number;

  // Related content
  topicsInDocument: Topic[];
  sources: { id: number; title: string; external_url?: string | null }[];

  // UI state
  isLoading?: boolean;
}

export function TorahReader({
  documentTitle,
  documentType,
  sections,
  currentSection,
  totalSections,
  topicsInDocument,
  sources,
  isLoading = false
}: TorahReaderProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [viewedStatements, setViewedStatements] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Get current section data
  const currentSectionData = sections.find(s => parseInt(s.order_key) === currentSection);
  const selected = selectedId != null ? currentSectionData?.statements.find((s) => s.id === selectedId) || null : null;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    // Track reading progress
    setViewedStatements(prev => new Set(prev).add(id));
  };

  const handleClose = () => setSelectedId(null);

  // Calculate reading progress across all sections
  useEffect(() => {
    if (sections.length > 0) {
      const totalStatements = sections.reduce((sum, section) => sum + section.statements.length, 0);
      const progress = totalStatements > 0 ? (viewedStatements.size / totalStatements) * 100 : 0;
      setReadingProgress(progress);
    }
  }, [viewedStatements, sections]);

  if (isLoading) {
    return <TorahReaderSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div
          className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary transition-all duration-500 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Section Header */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{documentTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {documentType && `${documentType} • `}Section {currentSection}
                  {totalSections && ` of ${totalSections}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:py-12">
        {/* Book-like Text Container */}
        <div className="bg-card/80 dark:bg-card/40 border border-border p-8 sm:p-10 lg:p-14 backdrop-blur-sm">
          <div className="space-y-8">
            {currentSectionData ? (
              <div className="space-y-4">
                {/* Section title if present */}
                {currentSectionData.title && (
                  <div className="text-sm text-muted-foreground font-medium border-b border-border pb-2">
                    {currentSectionData.title}
                  </div>
                )}

                {/* Section content with highlighted statements */}
                <div className="font-hebrew font-serif text-[18px] sm:text-[19px] lg:text-[21px] leading-[2] text-foreground tracking-wide">
                  {currentSectionData.statements.length > 0 ? (
                    currentSectionData.statements.map((s, idx) => (
                      <span
                        key={s.id}
                        onClick={() => handleSelect(s.id)}
                        className={`
                          cursor-pointer transition-all duration-200 rounded-sm px-1 -mx-1 py-0.5
                          hover:bg-accent/50 dark:hover:bg-accent/10
                          ${viewedStatements.has(s.id)
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                          }
                        `}
                      >
                        {s.text}
                        {idx < currentSectionData.statements.length - 1 && ' '}
                      </span>
                    ))
                  ) : (
                    <p className="text-foreground leading-relaxed">No content available for this section.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-foreground leading-relaxed">No content available for this section.</p>
            )}
          </div>

          {currentSectionData && currentSectionData.statements.length > 0 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Tap any sentence to explore its topics and sources
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Topics & Sources Sidebar (hidden on mobile) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2" />
          <div className="space-y-6">
            <div className="bg-background/60 rounded-lg border border-border p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Topics in this Document
              </h2>
              {topicsInDocument.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No topics linked yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {topicsInDocument.map((t) => (
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

              <div className="font-serif text-[17px] leading-relaxed mb-6 text-foreground bg-muted/30 rounded-lg p-4 border border-border">
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
                        className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
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
                      <div key={s.id} className="bg-accent/30 rounded-lg p-3 border border-border">
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

function TorahReaderSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Progress Bar Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div className="h-full bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" style={{ width: '30%' }} />
      </div>

      {/* Header Skeleton */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 animate-pulse">
                <div className="h-5 w-5 bg-muted rounded" />
              </div>
              <div>
                <div className="h-6 w-24 bg-muted rounded animate-pulse mb-1" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:py-12">
        <div className="bg-background/50 rounded-2xl border border-border p-8 sm:p-10 lg:p-14">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-muted rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border animate-pulse">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <div className="h-3 w-48 bg-muted rounded" />
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
