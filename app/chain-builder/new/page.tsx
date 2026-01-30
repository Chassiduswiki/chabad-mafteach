'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface NewChainForm {
    title: string;
    title_hebrew: string;
    slug: string;
    description: string;
    status: 'draft' | 'review' | 'published';
    is_featured: boolean;
}

export default function NewChainPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<NewChainForm>({
        title: '',
        title_hebrew: '',
        slug: '',
        description: '',
        status: 'draft',
        is_featured: false,
    });

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title]);

    const updateField = <K extends keyof NewChainForm>(field: K, value: NewChainForm[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!formData.slug.trim()) {
            setError('Slug is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/idea-chains', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to create chain');
            }

            const chain = await response.json();

            // Redirect to edit the new chain
            router.push(`/chain-builder/${chain.slug}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create chain');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/chain-builder')}
                            className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Create New Idea Chain</h1>
                            <p className="text-sm text-muted-foreground">Start tracing an idea through sources</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Basic Info Card */}
                    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Chain Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Title (English) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    placeholder="e.g., The Five Levels of the Soul"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Name the concept you&apos;re tracing
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Title (Hebrew)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title_hebrew}
                                    onChange={(e) => updateField('title_hebrew', e.target.value)}
                                    placeholder="חמש מדרגות הנשמה"
                                    dir="rtl"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    URL Slug *
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    placeholder="five-levels-of-soul"
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Auto-generated from title
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => updateField('status', e.target.value as 'draft' | 'review' | 'published')}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="review">Review</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Describe what this chain traces - the evolution of the idea from its origins to modern applications..."
                                rows={4}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_featured"
                                checked={formData.is_featured}
                                onChange={(e) => updateField('is_featured', e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_featured" className="text-sm text-foreground">
                                Feature this chain (highlight as specialty content)
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/chain-builder')}
                            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Create Chain
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
