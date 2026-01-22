"use client";

import React from "react";
import { useSefariaText } from "@/lib/hooks/useSefariaText";
import { CitationAttrs } from "./plugins/citations/comprehensiveCitationPlugin";

interface CitationViewerModalProps {
  open: boolean;
  citation: CitationAttrs | null;
  citationContent?: string; // HTML content of the citation
  onClose: () => void;
}

export function CitationViewerModal({ open, citation, citationContent, onClose }: CitationViewerModalProps) {
  if (!open || !citation) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Citation</p>
            <p className="text-lg font-semibold text-foreground">
              {citation.source_title ?? "Citation"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {citationContent && (
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Citation Content</p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div
                  className="text-foreground prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: citationContent }}
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Reference</p>
            <p className="text-foreground">
              {citation.reference || "Not specified"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-1">Citation Details</p>
            <p className="text-foreground font-mono text-sm">
              Source ID: {citation.source_id ?? "Unknown"}
            </p>
            <p className="text-foreground font-mono text-sm mt-1">
              Reference: {citation.reference ?? "Not available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
