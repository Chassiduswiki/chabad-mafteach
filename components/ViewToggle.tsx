'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center rounded-lg border border-border bg-background p-1">
            <button
                onClick={() => onViewChange('grid')}
                className={`rounded-md p-2 transition-all ${view === 'grid'
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                aria-label="Grid view"
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                onClick={() => onViewChange('list')}
                className={`rounded-md p-2 transition-all ${view === 'list'
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                aria-label="List view"
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    );
}
