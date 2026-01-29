'use client';

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface AccordionSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isComplete?: boolean;
  isEmpty?: boolean;
  helpText?: string;
  aiActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    loading?: boolean;
  }>;
  badge?: string;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export function AccordionSection({
  id,
  title,
  children,
  defaultOpen = false,
  isComplete = false,
  isEmpty = false,
  helpText,
  aiActions = [],
  badge,
  className,
  onOpenChange,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const completionStatus = isComplete ? 'complete' : isEmpty ? 'empty' : 'partial';

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-card transition-shadow',
        isOpen && 'shadow-sm',
        className
      )}
      data-section-id={id}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors',
          isOpen ? 'bg-muted/50' : 'hover:bg-muted/30'
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {/* Completion Indicator */}
          {completionStatus === 'complete' ? (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : completionStatus === 'empty' ? (
            <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-yellow-500 flex-shrink-0" />
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{title}</span>
              {badge && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded">
                  {badge}
                </span>
              )}
            </div>
            {helpText && !isOpen && (
              <span className="text-[11px] text-muted-foreground line-clamp-1">{helpText}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Action Buttons - Only show when open */}
          {isOpen && aiActions.length > 0 && (
            <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
              {aiActions.map((action, index) => {
                const Icon = action.icon || Sparkles;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.loading}
                    className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1"
                  >
                    <Icon className={cn('w-3 h-3', action.loading && 'animate-spin')} />
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          )}

          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 py-4 border-t border-border bg-background">
              {helpText && (
                <p className="text-xs text-muted-foreground mb-4 pb-3 border-b border-border/50">
                  {helpText}
                </p>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccordionSection;
