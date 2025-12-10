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
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">Citation</p>
            <p className="text-base font-semibold text-gray-900">
              {citation.source_title ?? "Source"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Reference</p>
            <p className="text-sm text-gray-900">
              {citation.reference || "Not specified"}
            </p>
          </div>

          {citation.reference && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sefaria Text</p>
              {loading && (
                <div className="text-sm text-gray-600">Loading text...</div>
              )}
              {error && (
                <div className="text-sm text-red-600">Error loading text: {error}</div>
              )}
              {sefariaData && (
                <div className="space-y-3">
                  {sefariaData.text.map((paragraph, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <p className="text-sm text-gray-800 leading-relaxed">{paragraph}</p>
                      {sefariaData.he && sefariaData.he[index] && (
                        <p className="text-sm text-blue-700 font-serif mt-1 leading-relaxed" dir="rtl">
                          {sefariaData.he[index]}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-2">
                    Source: {sefariaData.ref} ({sefariaData.book})
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Source ID</p>
            <p className="text-sm text-gray-800">
              {citation.source_id ?? "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
