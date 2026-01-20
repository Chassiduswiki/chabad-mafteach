'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error Boundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-destructive">Editor Error</h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong while loading the editor.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="mb-4 p-3 bg-muted rounded text-sm font-mono text-destructive max-w-md">
              {this.state.error.message}
            </div>
          )}

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <p className="text-xs text-muted-foreground mt-4 text-center max-w-sm">
            If this error persists, please refresh the page or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary behavior
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Editor error caught by hook:', error, errorInfo);

    // Could integrate with error reporting service here
    // reportError(error, errorInfo);
  };
};

// Higher-order component for wrapping components with error boundary
export function withEditorErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <EditorErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </EditorErrorBoundary>
  );

  WrappedComponent.displayName = `withEditorErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
