'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ConstellationErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Constellation Error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="w-full h-[360px] flex flex-col items-center justify-center rounded-3xl bg-muted/20 border border-border/50">
                    <div className="p-4 rounded-full bg-amber-500/10 mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Visualization Unavailable</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                        The concept constellation couldn't load. This doesn't affect the rest of the page.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
