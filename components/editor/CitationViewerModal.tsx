"use client";

import React from "react";

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
  if (!open || !citation) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
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

        <div className="p-5 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Reference</p>
            <p className="text-sm text-gray-900">
              {citation.reference || "Not specified"}
            </p>
          </div>

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
