'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Don't worry, our team has been notified.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-colors hover:bg-primary/90"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium transition-colors hover:bg-muted/80"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Link>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                    Technical Details (Development Only)
                                </summary>
                                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto text-muted-foreground">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
