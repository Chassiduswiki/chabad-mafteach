"use client";

import React from "react";
import { useSefariaText } from "@/lib/hooks/useSefariaText";

interface Citation {
  source_id: number | string | null;
  source_title: string | null;
  reference: string | null;
}

interface CitationViewerModalProps {
  open: boolean;
  citation: Citation | null;
  onClose: () => void;
}

export function CitationViewerModal({ open, citation, onClose }: CitationViewerModalProps) {
  const { data: sefariaData, loading, error } = useSefariaText(citation?.reference ?? null);

  if (!open || !citation) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Citation</p>
            <p className="text-lg font-semibold text-foreground">
              {citation.source_title ?? "Source"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Reference</p>
            <p className="text-foreground">
              {citation.reference || "Not specified"}
            </p>
          </div>

          {citation.reference && (
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Sefaria Text</p>
              {loading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  Loading text...
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  Error loading text: {error}
                </div>
              )}
              {sefariaData && (
                <div className="space-y-4">
                  {sefariaData.text.map((paragraph, index) => (
                    <div key={index} className="border-l-4 border-primary/20 pl-4 py-3 bg-muted/20 rounded-r-lg">
                      <p className="text-foreground leading-relaxed">{paragraph}</p>
                      {sefariaData.he && sefariaData.he[index] && (
                        <p className="text-primary font-serif mt-2 leading-relaxed" dir="rtl">
                          {sefariaData.he[index]}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Source: <span className="font-medium">{sefariaData.ref}</span> ({sefariaData.book})
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-1">Source ID</p>
            <p className="text-foreground font-mono text-sm">
              {citation.source_id ?? "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
