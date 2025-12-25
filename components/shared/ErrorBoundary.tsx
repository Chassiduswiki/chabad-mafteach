'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches React errors and displays a fallback UI
 * Prevents the entire app from crashing due to component errors
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // TODO: Send to error tracking service (e.g., Sentry)
        // logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-background flex items-center justify-center px-4">
                    <div className="max-w-lg w-full text-center space-y-6">
                        {/* Error Icon */}
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive" />
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Something went wrong
                            </h1>
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Please try again or return to the home page.
                            </p>
                        </div>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left">
                                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                    Error Details (Development Only)
                                </summary>
                                <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-48">
                                    <div className="text-destructive font-semibold mb-2">
                                        {this.state.error.toString()}
                                    </div>
                                    {this.state.errorInfo && (
                                        <pre className="text-muted-foreground whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors font-medium"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
