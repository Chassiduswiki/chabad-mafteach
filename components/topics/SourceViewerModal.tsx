'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Source } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SourceViewerModalProps {
  source: Source | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceViewerModal({ source, isOpen, onClose }: SourceViewerModalProps) {
  const [sefariaText, setSefariaText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSefariaText = async (reference: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://www.sefaria.org/api/texts/${reference}`);
        const data = await response.json();
        if (data && data.text) {
          setSefariaText(Array.isArray(data.text) ? data.text.join(' ') : data.text);
        } else {
          setSefariaText('Text not found.');
        }
      } catch (error) {
        console.error('Error fetching Sefaria text:', error);
        setSefariaText('Could not load text.');
      }
      setIsLoading(false);
    };

    if (isOpen && source?.relationships?.[0]?.verse_reference) {
      fetchSefariaText(source.relationships[0].verse_reference);
    } else {
      setSefariaText(null);
    }
  }, [isOpen, source]);

  if (!source) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{source.title}</DialogTitle>
          {(source.author || source.publication_year) && (
            <DialogDescription>
              {source.author} {source.author && source.publication_year && '•'} {source.publication_year}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-4">
          {source.relationships?.map((rel, idx) => (
            <div key={idx}>
              {rel.verse_reference && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2">Reference: {rel.verse_reference}</h4>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground italic">Loading Sefaria text...</p>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap font-serif">{sefariaText}</p>
                  )}
                </div>
              )}
              {rel.page_number && <p className="text-sm text-muted-foreground mt-2">Page: {rel.page_number}</p>}
            </div>
          ))}
          {source.external_url && (
            <Button asChild variant="outline">
              <a href={source.external_url} target="_blank" rel="noopener noreferrer">
                Read Full Source <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
