'use client';

import { useState, useEffect } from 'react';
import type { Topic } from '@/lib/types';
import { Loader2, BookOpen, Languages, Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReaderSettingsModal, type ReaderSettings } from './features/reader/ReaderSettings';

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  translated_text?: string; // **[NEW]** Bilingual support
  commentary_type?: 'commentary' | 'translation' | 'explanation'; // **[NEW]** Commentary support
  commentary_text?: string; // **[NEW]** Inline commentary
  commentary_author?: string; // **[NEW]** Commentary attribution
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

type DisplayMode = 'hebrew-only' | 'english-only' | 'side-by-side' | 'commentary-inline';

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
  const [displayMode, setDisplayMode] = useState<DisplayMode>('hebrew-only'); // **[NEW]** Bilingual display mode
  const [showCommentaries, setShowCommentaries] = useState(false); // **[NEW]** Commentary toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 19,
    fontFamily: 'serif',
    lineHeight: 1.8,
    theme: 'light'
  });
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

            {/* **[NEW]** Bilingual Display Controls */}
            <div className="flex items-center gap-2">
              {/* Commentary Toggle */}
              <button
                onClick={() => setShowCommentaries(!showCommentaries)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showCommentaries
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                title="Toggle commentary display"
              >
                {showCommentaries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="hidden sm:inline">Commentary</span>
              </button>

              {/* Display Mode Selector */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setDisplayMode('hebrew-only')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${displayMode === 'hebrew-only'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="Hebrew only"
                >
                  עברית
                </button>
                <button
                  onClick={() => setDisplayMode('english-only')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${displayMode === 'english-only'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="English only"
                >
                  EN
                </button>
                <button
                  onClick={() => setDisplayMode('side-by-side')}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${displayMode === 'side-by-side'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                  title="Side by side"
                >
                  <Languages className="h-3 w-3" />
                </button>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="ml-2 p-2 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Reader Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
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

                {/* Section content with bilingual display */}
                {displayMode === 'hebrew-only' && (
                  <div
                    className="text-foreground tracking-wide"
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      fontFamily: settings.fontFamily === 'serif' ? 'var(--font-hebrew)' : 'sans-serif',
                      lineHeight: settings.lineHeight
                    }}
                  >
                    {currentSectionData.statements.length > 0 ? (
                      currentSectionData.statements.map((s, idx) => (
                        <div key={s.id} className="mb-4 font-hebrew">
                          <span
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
                          </span>
                          {/* **[NEW]** Inline commentary display */}
                          {showCommentaries && s.commentary_text && (
                            <div className="mt-3 ml-4 p-3 bg-accent/20 rounded-lg border-l-4 border-primary">
                              <div className="text-sm text-muted-foreground mb-1">
                                {s.commentary_type && (
                                  <span className="font-medium capitalize">{s.commentary_type}</span>
                                )}
                                {s.commentary_author && (
                                  <span className="ml-2">• {s.commentary_author}</span>
                                )}
                              </div>
                              <div className="text-sm text-foreground leading-relaxed">
                                {s.commentary_text}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-foreground leading-relaxed">No content available for this section.</p>
                    )}
                  </div>
                )}

                {displayMode === 'english-only' && (
                  <div
                    className="text-foreground"
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      fontFamily: settings.fontFamily === 'serif' ? 'serif' : 'sans-serif',
                      lineHeight: settings.lineHeight
                    }}
                  >
                    {currentSectionData.statements.length > 0 ? (
                      currentSectionData.statements.map((s, idx) => (
                        <div key={s.id} className="mb-4">
                          <span
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
                            {s.translated_text || s.text}
                          </span>
                          {/* **[NEW]** Inline commentary display */}
                          {showCommentaries && s.commentary_text && (
                            <div className="mt-3 ml-4 p-3 bg-accent/20 rounded-lg border-l-4 border-primary">
                              <div className="text-sm text-muted-foreground mb-1">
                                {s.commentary_type && (
                                  <span className="font-medium capitalize">{s.commentary_type}</span>
                                )}
                                {s.commentary_author && (
                                  <span className="ml-2">• {s.commentary_author}</span>
                                )}
                              </div>
                              <div className="text-sm text-foreground leading-relaxed">
                                {s.commentary_text}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-foreground leading-relaxed">No content available for this section.</p>
                    )}
                  </div>
                )}

                {displayMode === 'side-by-side' && (
                  <div className="space-y-12">
                    {currentSectionData.statements.length > 0 ? (
                      currentSectionData.statements.map((s, idx) => (
                        <div key={`pair-${s.id}`} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start border-b border-border/40 pb-8 last:border-0">
                          {/* Hebrew Side */}
                          <div className="space-y-4">
                            <div
                              onClick={() => handleSelect(s.id)}
                              className={`
                                    font-hebrew cursor-pointer transition-all duration-200 rounded-sm px-1 -mx-1 py-0.5
                                    hover:bg-accent/50 dark:hover:bg-accent/10
                                    ${viewedStatements.has(s.id) ? 'text-muted-foreground' : 'text-foreground'}
                                `}
                              style={{
                                fontSize: `${settings.fontSize}px`,
                                fontFamily: settings.fontFamily === 'serif' ? 'var(--font-hebrew)' : 'sans-serif',
                                lineHeight: settings.lineHeight
                              }}
                            >
                              {s.text}
                            </div>

                            {/* Hebrew Commentary if exists and toggled */}
                            {showCommentaries && s.commentary_text && (
                              <div className="p-3 bg-accent/10 rounded-lg border-r-4 border-primary font-hebrew text-sm leading-relaxed">
                                <span className="font-semibold">{s.commentary_author || 'Commentary'}: </span>
                                {s.commentary_text}
                              </div>
                            )}
                          </div>

                          {/* English Side */}
                          <div className="space-y-4">
                            <div
                              onClick={() => handleSelect(s.id)}
                              className={`
                                    cursor-pointer transition-all duration-200 rounded-sm px-1 -mx-1 py-0.5
                                    hover:bg-accent/50 dark:hover:bg-accent/10
                                    ${viewedStatements.has(s.id) ? 'text-muted-foreground' : 'text-foreground'}
                                `}
                              style={{
                                fontSize: `${Math.max(14, settings.fontSize - 3)}px`,
                                fontFamily: settings.fontFamily === 'serif' ? 'serif' : 'sans-serif',
                                lineHeight: settings.lineHeight
                              }}
                            >
                              {s.translated_text || s.text}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-foreground leading-relaxed">No content available for this section.</p>
                    )}
                  </div>
                )}
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ReaderSettingsModal
          settings={settings}
          onUpdate={(u) => setSettings({ ...settings, ...u })}
          onClose={() => setIsSettingsOpen(false)}
        />
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
