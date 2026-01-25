'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
}

export function FieldGroup({ 
  title, 
  children, 
  defaultOpen = false, 
  required = false,
  helpText,
  className
}: FieldGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={cn(
      'border border-border/50 rounded-2xl overflow-hidden transition-all duration-300',
      isOpen ? 'bg-card/50 shadow-sm' : 'bg-transparent hover:border-primary/20',
      className
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-6 py-4 flex items-center justify-between transition-colors group",
          isOpen ? "bg-primary/5 border-b border-border/30" : "bg-transparent hover:bg-muted/30"
        )}
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
              {title}
              {required && <span className="text-red-500 ml-1.5 font-bold">*</span>}
            </h3>
          </div>
          {helpText && (
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-70">
              {helpText}
            </span>
          )}
        </div>
        <div className={cn(
          "p-1.5 rounded-full transition-all duration-300",
          isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
        )}>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
