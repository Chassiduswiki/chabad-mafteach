'use client';

import * as React from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';
import { useSearch } from '@/lib/search-context';

export function CommandMenuTrigger() {
    const { setOpen } = useSearch();

    return (
        <button
            onClick={() => setOpen(true)}
            className="group relative z-10 flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 px-5 py-4 text-left shadow-sm backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-background/80 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
        >
            <Search className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="flex-1 text-[15px] text-muted-foreground group-hover:text-foreground transition-colors">
                Search concepts, sources, or authors...
            </span>
            <div className="hidden items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:flex">
                <CommandIcon className="h-3 w-3" />
                <span>K</span>
            </div>
        </button>
    );
}
