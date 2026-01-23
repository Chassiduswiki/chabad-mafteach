'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface CitationReferenceProps {
  id: string;
  sourceId: string | number;
  sourceTitle: string;
  reference?: string;
  quote?: string;
  note?: string;
  url?: string;
  index?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Interactive citation reference component that displays as a superscript indicator
 * and shows citation details on click. Uses only inline elements to avoid hydration errors.
 */
export function CitationReference({
  id,
  sourceId,
  sourceTitle,
  reference,
  quote,
  note,
  url,
  index,
  className,
  children,
}: CitationReferenceProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [citationData, setCitationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch citation data when dialog opens
  const fetchCitationData = useCallback(async () => {
    if (citationData || !id || id.startsWith('auto-') || id.startsWith('plain-')) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/citations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCitationData(data);
      }
    } catch (err) {
      console.warn('Citation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, citationData]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
    fetchCitationData();
  };

  const displayIndicator = index !== undefined ? `${index}` : '*';
  
  // Combine source info for display
  const displayTitle = citationData?.source?.title || sourceTitle;
  const displayReference = reference || citationData?.reference?.section || '';
  const displayQuote = quote || citationData?.quote;
  const displayNote = note || citationData?.note;
  const displayUrl = url || citationData?.source?.externalUrl;

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        title={`${sourceTitle}${reference ? ` – ${reference}` : ''}`}
        className={cn(
          'inline cursor-pointer text-primary hover:text-primary/80 font-medium transition-colors',
          className
        )}
        style={{ 
          fontSize: '0.7em', 
          verticalAlign: 'super',
          marginLeft: '1px',
          marginRight: '2px',
        }}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
      >
        [{displayIndicator}]
      </span>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border/50 shadow-2xl [&>button]:hidden">
          {/* Accessibility: Hidden title for screen readers */}
          <VisuallyHidden.Root>
            <DialogTitle>{displayTitle}</DialogTitle>
          </VisuallyHidden.Root>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto" />
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header: Source title + reference */}
              <div className="px-6 pt-5 pb-4 border-b border-border/30">
                <h3 className="text-base font-semibold text-foreground leading-tight pr-6">
                  {displayTitle}
                </h3>
                {displayReference && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayReference}
                  </p>
                )}
              </div>

              {/* Content area */}
              <div className="px-6 py-5 space-y-4">
                {/* Quote - Primary focus */}
                {displayQuote && (
                  <div className="relative pl-4">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 rounded-full" />
                    <blockquote className="text-[15px] leading-relaxed text-foreground/90 italic">
                      "{displayQuote}"
                    </blockquote>
                  </div>
                )}

                {/* Note - Secondary */}
                {displayNote && (
                  <p className={cn(
                    "text-sm text-muted-foreground leading-relaxed",
                    displayQuote && "pt-3 border-t border-border/20"
                  )}>
                    {displayNote}
                  </p>
                )}

                {/* Empty state */}
                {!displayQuote && !displayNote && (
                  <p className="text-sm text-muted-foreground/60 text-center py-2">
                    No additional details available
                  </p>
                )}
              </div>

              {/* Footer with link */}
              {displayUrl && (
                <div className="px-6 py-3 bg-muted/30 border-t border-border/30">
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Original Source
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
