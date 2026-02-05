'use client';

import React from 'react';
import { X, BookOpen, ExternalLink, Copy, Check, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CitationData {
  source_id: number | string | null;
  source_title: string | null;
  reference: string | null;
  content?: string;
  quote?: string;
  note?: string;
  url?: string;
  citationId?: string;
  pos?: number;
  citationType?: string;
}

interface CitationViewerModalProps {
  open: boolean;
  citation: CitationData | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getTypeBadgeStyle(citationType?: string): { label: string; className: string } {
  switch (citationType) {
    case 'daf':
      return { label: 'Daf', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    case 'halacha':
      return { label: 'Halacha', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    case 'verse':
      return { label: 'Verse', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' };
    case 'chapter':
      return { label: 'Chapter', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' };
    case 'page':
      return { label: 'Page', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    case 'section':
      return { label: 'Section', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    case 'custom':
      return { label: 'Custom', className: 'bg-muted text-muted-foreground' };
    default:
      return { label: citationType ? citationType.charAt(0).toUpperCase() + citationType.slice(1) : 'Reference', className: 'bg-muted text-muted-foreground' };
  }
}

export function CitationViewerModal({ open, citation, onClose, onEdit, onDelete }: CitationViewerModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!open) setShowDeleteConfirm(false);
  }, [open]);

  if (!open || !citation) return null;

  const handleCopy = () => {
    const citationText = `${citation.source_title}${citation.reference ? ' — ' + citation.reference : ''}`;
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Citation Details</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {citation.source_id ? 'Synced Source' : 'Manual Citation'}
                </p>
                {citation.citationType && (() => {
                  const { label, className: badgeClass } = getTypeBadgeStyle(citation.citationType);
                  return <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${badgeClass}`}>{label}</Badge>;
                })()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Source Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Source
            </label>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-semibold text-foreground flex-1">
                {citation.source_title || 'Unknown Source'}
              </p>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                title="Copy citation"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {citation.source_id && (
              <span className="inline-block mt-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                Source ID: {citation.source_id}
              </span>
            )}
          </div>

          {/* Reference */}
          {citation.reference && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Reference
              </label>
              <p className="text-base text-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5">
                {citation.reference}
              </p>
            </div>
          )}

          {/* Quote */}
          {citation.quote && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Quote
              </label>
              <blockquote className="text-sm text-foreground bg-muted/30 border-l-4 border-primary rounded-r-lg px-4 py-3 italic">
                "{citation.quote}"
              </blockquote>
            </div>
          )}

          {/* Note */}
          {citation.note && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Note
              </label>
              <p className="text-sm text-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5">
                {citation.note}
              </p>
            </div>
          )}

          {/* URL */}
          {citation.url && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Link
              </label>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 bg-muted/30 border border-border rounded-lg px-4 py-2.5 hover:bg-muted/50 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{citation.url}</span>
              </a>
            </div>
          )}

          {/* Full Content (if available) */}
          {citation.content && citation.content !== `${citation.source_title} - ${citation.reference}` && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Full Citation
              </label>
              <p className="text-sm text-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5">
                {citation.content}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full">
              <p className="text-sm font-medium text-foreground">Remove this citation?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onDelete?.(); onClose(); }}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Citation
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
