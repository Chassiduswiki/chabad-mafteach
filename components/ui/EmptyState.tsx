'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  tips?: string[];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tips,
  className = ''
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-6"
          >
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-6"
          >
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {action.label}
          </button>
        )
      )}

      {tips && tips.length > 0 && (
        <div className="w-full max-w-md mt-2 p-4 bg-muted/30 rounded-lg border border-border text-left">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            💡 Helpful Tips
          </h4>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  className = ''
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
