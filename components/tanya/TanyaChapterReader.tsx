'use client';

import { useState } from 'react';
import type { Topic } from '@/lib/directus';

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  topics: Topic[];
  sources: { id: number; title: string; external_url?: string | null; relationship_type?: string; page_number?: string; verse_reference?: string }[];
}

interface TanyaChapterReaderProps {
  paragraphText: string;
  statements: StatementWithTopics[];
  topicsInPerek: Topic[];
  sources: { id: number; title: string; external_url?: string | null }[];
}

export function TanyaChapterReader({
  paragraphText,
  statements,
  topicsInPerek,
  sources,
}: TanyaChapterReaderProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected =
    selectedId != null ? statements.find((s) => s.id === selectedId) || null : null;

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleClose = () => setSelectedId(null);

  return (
    <>
      {/* Main paragraph composed of statement spans */}
      <div className="rounded-2xl border border-border bg-background/50 p-4 sm:p-6">
        <p className="font-hebrew text-lg leading-relaxed">
          {statements.length > 0
            ? statements.map((s, idx) => (
                <span
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className="cursor-pointer rounded px-0.5 hover:bg-primary/15 transition-colors"
                >
                  {s.text}
                  {idx < statements.length - 1 && ' '}
                </span>
              ))
            : paragraphText}
        </p>
        {statements.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Tap a sentence to view its topics and sources.
          </p>
        )}
      </div>

      {/* Sidebar cards moved into this component for cohesion on mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2" />
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Topics in this Perek
            </h2>
            {topicsInPerek.length === 0 ? (
              <p className="text-sm text-muted-foreground">No topics linked yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topicsInPerek.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span>{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </h2>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sources linked yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {sources.map((s) => (
                  <li key={s.id} className="flex flex-col">
                    <span className="font-medium">{s.title}</span>
                    {s.external_url && (
                      <a
                        href={s.external_url}
                        target="_blank"
                        className="text-xs text-primary hover:underline"
                      >
                        External link
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sheet for selected statement */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={handleClose}>
          <div className="w-full max-w-xl rounded-t-2xl border border-border bg-background p-4 sm:p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Statement {selected.order_key}
              </div>
              <button
                onClick={handleClose}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <p className="font-hebrew text-base leading-relaxed mb-3">{selected.text}</p>

            {selected.topics.length > 0 && (
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.topics.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.sources.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sources & Citations
                </div>
                <ul className="space-y-2 text-xs">
                  {selected.sources.map((s) => (
                    <li key={s.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.title}</span>
                        {s.relationship_type && (
                          <span className="text-muted-foreground capitalize">{s.relationship_type}</span>
                        )}
                      </div>
                      {(s.page_number || s.verse_reference) && (
                        <div className="text-muted-foreground">
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
                          className="text-primary hover:underline"
                        >
                          View Source →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
