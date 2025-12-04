'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';

export default function CollectionsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-32 pt-20 px-5 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Collections</h1>
            <p className="text-muted-foreground max-w-xs">
                Your saved quotes and topics will appear here.
            </p>
        </div>
    );
}
