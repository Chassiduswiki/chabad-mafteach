'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface FloatingAIChatButtonProps {
  onClick: () => void;
}

export function FloatingAIChatButton({ onClick }: FloatingAIChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-transform hover:scale-110"
      aria-label="Open AI Assistant"
    >
      <MessageSquare className="h-8 w-8 text-primary-foreground" />
    </Button>
  );
}
