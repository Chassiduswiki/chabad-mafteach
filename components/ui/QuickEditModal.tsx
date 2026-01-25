'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  field: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    value: string;
    options?: string[];
  };
  onSave: (fieldId: string, value: string) => Promise<void>;
}

export function QuickEditModal({ 
  isOpen, 
  onClose, 
  topicId, 
  field, 
  onSave 
}: QuickEditModalProps) {
  const [value, setValue] = useState(field.value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Reset value and focus when field changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setValue(field.value || '');
      setError(null);
      // Slight delay to ensure the dialog is fully mounted before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, field.value]);

  const handleSave = async () => {
    if (value === field.value) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(field.id, value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || field.type !== 'textarea')) {
      e.preventDefault();
      handleSave();
    }
  };

  const renderInput = () => {
    const commonProps = {
      value,
      onChange: (e: any) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      className: cn(
        "bg-muted/30 border-primary/10 focus-visible:ring-primary/20",
        field.type === 'textarea' ? "min-h-[180px] resize-none py-3" : "h-11"
      ),
      disabled: isLoading,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={cn(
              "w-full px-3 py-2 border border-primary/10 rounded-md bg-muted/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 h-11 transition-all",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
            ref={inputRef as React.RefObject<HTMLSelectElement>}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type="text"
            ref={inputRef as React.RefObject<HTMLInputElement>}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/98 backdrop-blur-xl border-primary/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Quick Edit
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Updating <span className="font-semibold text-foreground">{field.label}</span> for Topic ID: {topicId}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-background/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {field.label} Content
              </label>
              {field.type === 'textarea' && (
                <span className="text-[10px] text-muted-foreground/50">
                  Markdown supported
                </span>
              )}
            </div>
            {renderInput()}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive animate-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
              <Command className="h-3 w-3" />
              <span>+ Enter to save</span>
              <span className="mx-1">•</span>
              <span>Esc to cancel</span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-9 px-4 text-xs font-bold"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || value === field.value}
                className="h-9 px-6 text-xs font-bold rounded-full shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
