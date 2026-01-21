'use client';

import React from 'react';

interface CharacterCountProps {
  current: number;
  max?: number;
  min?: number;
  showWarning?: boolean;
  className?: string;
}

export function CharacterCount({
  current,
  max,
  min,
  showWarning = true,
  className = '',
}: CharacterCountProps) {
  const isOverMax = max !== undefined && current > max;
  const isUnderMin = min !== undefined && current < min;
  const isNearMax = max !== undefined && current > max * 0.9;
  
  const getStatusColor = () => {
    if (isOverMax) return 'text-red-500';
    if (isUnderMin && showWarning) return 'text-yellow-500';
    if (isNearMax && showWarning) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const percentage = max ? Math.min((current / max) * 100, 100) : 0;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {max && (
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-20">
          <div 
            className={`h-full transition-all ${
              isOverMax 
                ? 'bg-red-500' 
                : isNearMax 
                  ? 'bg-yellow-500' 
                  : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      <span className={getStatusColor()}>
        {current.toLocaleString()}
        {max && ` / ${max.toLocaleString()}`}
      </span>
    </div>
  );
}

interface WordCountProps {
  text: string;
  className?: string;
}

export function WordCount({ text, className = '' }: WordCountProps) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  
  return (
    <div className={`flex items-center gap-3 text-xs text-muted-foreground ${className}`}>
      <span>{words.toLocaleString()} words</span>
      <span className="w-px h-3 bg-border" />
      <span>{chars.toLocaleString()} characters</span>
    </div>
  );
}
