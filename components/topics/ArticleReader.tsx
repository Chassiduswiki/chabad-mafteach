'use client';

import { useState, useEffect } from 'react';
import type { Topic } from '@/lib/types';
import { Loader2, BookOpen } from 'lucide-react';
import { CitationViewerModal } from '@/components/editor/CitationViewerModal';

/**
 * ArticleReader Component
 *
 * Displays topic articles with paragraphs and interactive statements.
 *
 * DISPLAY LOGIC:
 * - Shows full paragraph HTML content
 * - Statements appear as clickable footnotes (📖 icon)
 * - Clicking statement opens modal with details
 * - Modal shows: statement text, citations (appended_text), topics, sources
 *
 * DATA FLOW:
 * Topic.paragraphs[] → renderParagraphWithStatements() → Full paragraph + footnotes
 */

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  appended_text?: string; // Citation HTML
  topics: Topic[];
  sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
  document_title?: string;
}

interface ParagraphWithStatements {
  id: number;
  text: string; // Full HTML content
  order_key: string;
  document_title?: string;
  statements: StatementWithTopics[]; // Footnotes/citations
}

interface ArticleReaderProps {
  paragraphs: ParagraphWithStatements[];
  topicsInArticle: Topic[];
  sources: { id: number; title: string; external_url?: string | null }[];
  articleTitle: string;
  isLoading?: boolean;
}

export function ArticleReader({
  paragraphs,
  topicsInArticle,
  sources,
  articleTitle,
  isLoading = false
}: ArticleReaderProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [viewedParagraphs, setViewedParagraphs] = useState<Set<number>>(new Set());
  const [activeCitation, setActiveCitation] = useState<{
    source_id: number | string | null;
    source_title: string | null;
    reference: string | null;
    content?: string; // HTML content of the citation
  } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Find selected statement across all paragraphs (if any)
  const selected = selectedId != null ? 
    paragraphs.flatMap(p => p.statements).find((s) => s.id === selectedId) || null : null;

  // Track paragraph viewing for progress
  const handleParagraphView = (paragraphId: number) => {
    setViewedParagraphs(prev => new Set(prev).add(paragraphId));
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setActiveCitation(null);
    // Reset the closing flag after a short delay to allow DOM updates
    setTimeout(() => setIsModalClosing(false), 100);
  };

  const handleClose = () => setSelectedId(null);

  // Extract citation reference from text
  const extractCitationReference = (text: string): string | null => {
    // Look for common citation patterns
    const patterns = [
      /(ראה|see)\s+([^.!?]+)[.!?]?/i, // "ראה ליקוטי תורה" or "see Likkutei Torah"
      /(לקוטי\s+תורה|תורה\s+אור|תניא|לקוטי\s+אמרים)/i, // Common Chabad texts
      /([א-ת]+\s*,\s*[א-ת])/ // Hebrew folio references like "א, א"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  };

  // Handle citation clicks from appended_text
  const handleCitationClick = (appendedText: string, statement: StatementWithTopics) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = appendedText;
    const text = tempDiv.textContent || '';

    // Try to extract reference from common patterns
    const reference = extractCitationReference(text);

    setActiveCitation({
      source_id: null,
      source_title: 'Citation',
      reference: reference || text.substring(0, 100),
      content: appendedText // Pass the full HTML content
    });
  };

  // Intersection Observer to track paragraph visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const paragraphId = parseInt(entry.target.getAttribute('data-paragraph-id') || '0');
            if (paragraphId) {
              handleParagraphView(paragraphId);
            }
          }
        });
      },
      { threshold: 0.5 } // Consider paragraph "viewed" when 50% visible
    );

    // Observe all paragraph elements
    const paragraphElements = document.querySelectorAll('[data-paragraph-id]');
    paragraphElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [paragraphs]);

  // Render paragraph with highlighted statements
  const renderParagraphWithStatements = (paragraph: ParagraphWithStatements) => {
    // Detect if text is primarily Hebrew (RTL) or English (LTR)
    const isHebrew = (text: string) => {
      const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
      const totalChars = text.replace(/<[^>]*>/g, '').length; // Remove HTML tags
      return hebrewChars > totalChars * 0.1; // More than 10% Hebrew characters
    };

    const textDirection = isHebrew(paragraph.text) ? 'rtl' : 'ltr';
    const textAlign = isHebrew(paragraph.text) ? 'right' : 'left';

    // Function to highlight statement text within paragraph HTML
    const highlightStatements = (htmlText: string, statements: StatementWithTopics[]): string => {
      if (!statements.length) return htmlText;

      let highlightedHtml = htmlText;

      statements.forEach((statement, index) => {
        if (!statement.text) return;

        const statementText = statement.text.trim();

        // For "complete rasha", look for the pattern in HTML
        if (statementText === 'complete rasha') {
          // Replace the HTML pattern: complete&nbsp;<em>rasha</em>
          const htmlPattern = /complete&nbsp;<em>rasha<\/em>/gi;
          highlightedHtml = highlightedHtml.replace(htmlPattern, `<span class="statement-highlight cursor-pointer bg-accent/50 hover:bg-accent text-accent-foreground px-1 rounded transition-colors duration-200" data-statement-id="${statement.id}" title="Click to view citation">complete&nbsp;<em>rasha</em></span>`);
        } else {
          // For other statements, try exact match
          const regex = new RegExp(`(${statementText})`, 'gi');
          highlightedHtml = highlightedHtml.replace(regex, `<span class="statement-highlight cursor-pointer bg-accent/50 hover:bg-accent text-accent-foreground px-1 rounded transition-colors duration-200" data-statement-id="${statement.id}" title="Click to view citation">$1</span>`);
        }
      });

      return highlightedHtml;
    };

    // Apply highlighting to paragraph text
    const highlightedText = highlightStatements(paragraph.text, paragraph.statements);

    // Handle statement click
    const handleStatementClick = (statementId: number) => {
      const statement = paragraph.statements.find(s => s.id === statementId);
      if (statement) {
        setSelectedId(statementId);
      }
    };

    return (
      <div
        key={paragraph.id}
        data-paragraph-id={paragraph.id}
        className="space-y-4"
        style={{
          direction: textDirection,
          textAlign: textAlign,
          textAlignLast: textAlign
        }}
        lang={textDirection === 'rtl' ? 'he' : undefined}
        onClick={(e) => {
          // Prevent clicks during modal closing animation
          if (isModalClosing) return;

          const target = e.target as HTMLElement;

          // Handle statement highlights (existing functionality)
          if (target.classList.contains('statement-highlight')) {
            const statementId = parseInt(target.getAttribute('data-statement-id') || '0');
            if (statementId) {
              handleStatementClick(statementId);
            }
          }

          // Handle editor citations (new functionality)
          const citationEl = target.closest("[data-type='citation']") as HTMLElement | null;
          if (citationEl) {
            const sourceId = citationEl.getAttribute("data-source-id");
            const sourceTitle = citationEl.getAttribute("data-source-title");
            const reference = citationEl.getAttribute("data-reference");

            setActiveCitation({
              source_id: sourceId ? Number(sourceId) || sourceId : null,
              source_title: sourceTitle,
              reference,
            });
          }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
      </div>
    );
  };

  if (isLoading) {
    return <ArticleReaderSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Article Header */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          {/* Reading progress indicator or other minimal header content could go here */}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:py-12">
        {/* Article-like Text Container */}
        <div className="bg-card/80 dark:bg-card/40 border border-border p-8 sm:p-10 lg:p-14 backdrop-blur-sm">
          <div className="space-y-8">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph) => (
                <div key={paragraph.id} className="space-y-4">
                  {/* Document title if different from article title */}
                  {paragraph.document_title && paragraph.document_title !== articleTitle && (
                    <div className="text-sm text-muted-foreground font-medium border-b border-border pb-2">
                      {paragraph.document_title}
                    </div>
                  )}

                  {/* Paragraph content with highlighted statements */}
                  <div className="font-hebrew font-serif text-[18px] sm:text-[19px] lg:text-[21px] leading-[2] text-foreground tracking-wide">
                    {renderParagraphWithStatements(paragraph)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-foreground leading-relaxed">No content available for this article.</p>
            )}
          </div>

          {paragraphs.length > 0 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Scroll through the article to track your reading progress
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
                Topics in this Article
              </h2>
              {topicsInArticle.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No topics linked yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {topicsInArticle.map((t) => (
                    <li key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors">
                      <span className="font-medium">{t.canonical_title || t.name}</span>
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

              {selected.appended_text && (
                <div className="mb-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                    Citation
                  </div>
                  <div className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: selected.appended_text }} />
                </div>
              )}

              {selected.document_title && (
                <div className="mb-4 text-xs text-muted-foreground">
                  From: <span className="font-medium">{selected.document_title}</span>
                </div>
              )}

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
                        {t.canonical_title || t.name}
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

      {/* Citation Viewer Modal */}
      <CitationViewerModal
        open={Boolean(activeCitation)}
        citation={activeCitation}
        citationContent={activeCitation?.content}
        onClose={handleCloseModal}
      />
    </div>
  );
}

function ArticleReaderSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Progress Bar Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-border">
        <div className="h-full bg-primary animate-pulse" style={{ width: '30%' }} />
      </div>

      {/* Header Skeleton */}
      <div className="sticky top-1 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          {/* Minimal header space for consistency */}
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
      </main>
    </div>
  );
}
