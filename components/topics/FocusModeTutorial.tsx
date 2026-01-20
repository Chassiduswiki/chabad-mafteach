'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FocusModeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FocusModeTutorial({ isOpen, onClose }: FocusModeTutorialProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Focus Mode</DialogTitle>
          <DialogDescription>
            Double-tap any section to enter Focus Mode. This will dim other sections, allowing you to concentrate on the content that matters most to you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">You can exit focus mode by double-tapping the focused section again.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
