import { useCallback, useState } from "react";

export interface CitationRange {
  from: number;
  to: number;
}

export function useCitationPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<CitationRange | null>(null);

  const openWithRange = useCallback((nextRange: CitationRange) => {
    setRange(nextRange);
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setRange(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closePalette();
      } else if (range) {
        setIsOpen(true);
      }
    },
    [closePalette, range]
  );

  return {
    isOpen,
    range,
    openWithRange,
    closePalette,
    handleOpenChange,
  };
}
