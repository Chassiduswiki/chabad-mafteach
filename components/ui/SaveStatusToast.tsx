'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, CloudOff } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface SaveStatusToastProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  className?: string;
}

export function SaveStatusToast({ 
  status, 
  lastSaved, 
  hasUnsavedChanges = false,
  className = '' 
}: SaveStatusToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show toast when status changes (except idle)
  useEffect(() => {
    if (status !== 'idle') {
      setIsVisible(true);
    }
    
    // Auto-hide success after 3 seconds
    if (status === 'success') {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Format relative time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Saving...',
          bgClass: 'bg-muted border-border',
          textClass: 'text-muted-foreground',
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: lastSaved ? `Saved ${formatTime(lastSaved)}` : 'Saved',
          bgClass: 'bg-green-500/10 border-green-500/20',
          textClass: 'text-green-700 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Save failed',
          bgClass: 'bg-red-500/10 border-red-500/20',
          textClass: 'text-red-700 dark:text-red-400',
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: <CloudOff className="h-4 w-4" />,
            text: 'Unsaved changes',
            bgClass: 'bg-yellow-500/10 border-yellow-500/20',
            textClass: 'text-yellow-700 dark:text-yellow-400',
          };
        }
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config && !isVisible) return null;
  if (!config) return null;

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2 px-3 py-2 
        rounded-lg border shadow-lg
        transition-all duration-300
        ${config.bgClass} ${config.textClass}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${className}
      `}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}
