'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink, BookOpen, Quote, Info } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const fetchCitationData = useCallback(async () => {
    if (citationData || !id || id.startsWith('auto-') || id.startsWith('plain-')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/citations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCitationData(data);
      } else if (response.status === 404) {
        // Not an error, just no extra data found in DB for this specific ID
        setCitationData({ empty: true });
      } else {
        throw new Error('Failed to load citation details');
      }
    } catch (err) {
      console.warn('Citation fetch error:', err);
      setError('Details unavailable');
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
  const displayTitle = citationData?.source?.title || sourceTitle;
  const displayReference = reference || citationData?.reference?.section || '';
  const displayQuote = quote || citationData?.quote;
  const displayNote = note || citationData?.note;
  const displayUrl = url || citationData?.source?.externalUrl;

  const tooltipLabel = `${sourceTitle}${reference ? ` – ${reference}` : ''}`;

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className={cn(
                'inline-flex items-center justify-center cursor-pointer text-primary hover:text-primary/80 font-bold transition-all hover:scale-110 active:scale-95',
                className
              )}
              style={{ 
                fontSize: '0.75em', 
                verticalAlign: 'super',
                marginLeft: '2px',
                marginRight: '3px',
                lineHeight: 1,
              }}
              onClick={handleClick}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
            >
              [{displayIndicator}]
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-popover/95 backdrop-blur shadow-md border-border py-1 px-2">
            <span className="text-[11px] font-medium max-w-[200px] truncate block">{tooltipLabel}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[425px] p-0 gap-0 overflow-hidden border-primary/10 shadow-2xl bg-background/98 backdrop-blur-xl">
          <VisuallyHidden.Root>
            <DialogTitle>{displayTitle}</DialogTitle>
          </VisuallyHidden.Root>

          {isLoading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-xs text-muted-foreground animate-pulse">Retrieving source details...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Modern Apple-style header */}
              <div className="px-6 pt-6 pb-5 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                      <BookOpen className="h-3 w-3" />
                      Source Reference
                    </div>
                    <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">
                      {displayTitle}
                    </h3>
                    {displayReference && (
                      <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        {displayReference}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced content area */}
              <div className="px-6 pb-6 space-y-5">
                {displayQuote && (
                  <div className="relative group">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/20 rounded-full transition-colors group-hover:bg-primary/40" />
                    <div className="flex items-start gap-3">
                      <Quote className="h-4 w-4 text-primary/40 shrink-0 mt-1" />
                      <blockquote className="text-[15px] leading-relaxed text-foreground/90 font-serif italic">
                        {displayQuote}
                      </blockquote>
                    </div>
                  </div>
                )}

                {displayNote && (
                  <div className={cn(
                    "p-4 rounded-xl bg-muted/40 border border-border/50",
                    !displayQuote && "mt-2"
                  )}>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {displayNote}
                    </p>
                  </div>
                )}

                {error && !displayQuote && !displayNote && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-center">
                    <p className="text-xs text-destructive/80 font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {!displayQuote && !displayNote && !error && (
                  <div className="py-8 text-center space-y-3 opacity-40">
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Reference placeholder
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom action bar */}
              {displayUrl && (
                <div className="px-6 py-4 bg-muted/20 border-t border-border/30 flex justify-end">
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-all hover:translate-x-0.5 bg-primary/10 px-4 py-2 rounded-full"
                  >
                    View Original Source
                    <ExternalLink className="h-3 w-3" />
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
