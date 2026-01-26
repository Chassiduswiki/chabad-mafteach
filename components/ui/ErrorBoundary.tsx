"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  /** If true, don't report to Sentry (useful for expected errors) */
  silent?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    eventId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || "Unknown Component";

    console.error(`[ErrorBoundary] Uncaught error in ${componentName}:`, error, errorInfo);

    // Report to Sentry unless silent mode
    if (!this.props.silent) {
      const eventId = Sentry.captureException(error, {
        tags: {
          component: componentName,
          errorBoundary: true,
        },
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
      this.setState({ eventId });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 border rounded-lg bg-destructive/5 border-destructive/20">
          <Alert variant="destructive" className="bg-transparent border-none p-0">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold ml-2">
              Something went wrong
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm opacity-90">
              {this.props.componentName ? `An error occurred in ${this.props.componentName}.` : "An unexpected error occurred while rendering this component."}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="mt-4 p-4 rounded bg-black/10 overflow-auto max-h-40 text-xs font-mono">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
