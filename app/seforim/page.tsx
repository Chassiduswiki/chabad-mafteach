'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

interface Document {
    id: number;
    title: string;
    doc_type?: string;
}

export default function SeforimPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch('/api/documents?doc_type=sefer');
                if (!response.ok) {
                    throw new Error('Failed to fetch documents');
                }
                const docsArray = await response.json();
                setDocuments(docsArray);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-2 mb-8">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Seforim Library</h1>
                    </div>
                    <div className="animate-pulse space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Seforim Library</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search seforim..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="mx-auto h-16 w-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium mb-2">No seforim found</h3>
                            <p className="text-sm">
                                {searchQuery ? 'Try adjusting your search terms' : 'No seforim available yet'}
                            </p>
                        </div>
                    ) : (
                        filteredDocuments.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/seforim/${doc.id}`}
                                className="block p-6 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">{doc.title}</h3>
                                        {doc.doc_type && (
                                            <span className="text-sm text-muted-foreground capitalize">
                                                {doc.doc_type}
                                            </span>
                                        )}
                                    </div>
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
