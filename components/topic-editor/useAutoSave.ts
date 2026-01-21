import { useState, useEffect, useRef, useCallback } from 'react';
import { TopicFormData } from './types';

interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave: (data: TopicFormData) => Promise<void>;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  hasUnsavedChanges: boolean;
  triggerSave: () => Promise<void>;
  markAsSaved: () => void;
}

export function useAutoSave(
  data: TopicFormData,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { debounceMs = 3000, onSave, enabled = true } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lastSavedDataRef = useRef<string>(JSON.stringify(data));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Perform save
  const performSave = useCallback(async (dataToSave: TopicFormData) => {
    if (!isMountedRef.current) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      await onSave(dataToSave);
      
      if (isMountedRef.current) {
        lastSavedDataRef.current = JSON.stringify(dataToSave);
        setLastSaved(new Date());
        setSaveStatus('success');
        setHasUnsavedChanges(false);

        // Reset status after a delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus('idle');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (isMountedRef.current) {
        setSaveStatus('error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [onSave]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    const currentDataString = JSON.stringify(data);
    const hasChanges = currentDataString !== lastSavedDataRef.current;
    
    setHasUnsavedChanges(hasChanges);

    if (!hasChanges) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, performSave]);

  // Manual save trigger
  const triggerSave = useCallback(async () => {
    // Clear any pending auto-save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await performSave(data);
  }, [data, performSave]);

  // Mark as saved (for external save operations)
  const markAsSaved = useCallback(() => {
    lastSavedDataRef.current = JSON.stringify(data);
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
    setSaveStatus('success');
    setTimeout(() => {
      if (isMountedRef.current) {
        setSaveStatus('idle');
      }
    }, 2000);
  }, [data]);

  return {
    isSaving,
    lastSaved,
    saveStatus,
    hasUnsavedChanges,
    triggerSave,
    markAsSaved,
  };
}

// Keyboard shortcut hook for save
export function useSaveShortcut(onSave: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);
}

export default useAutoSave;
