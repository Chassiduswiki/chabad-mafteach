'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';

interface TopicCollection {
    id: string;
    title: string;
    slug: string;
    description?: string;
    is_featured: boolean;
    is_public: boolean;
    topicCount: number;
    created_at?: string;
}

export default function TopicCollectionsAdmin() {
    const [collections, setCollections] = useState<TopicCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const response = await fetch('/api/topic-collections');
            const data = await response.json();
            setCollections(data.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCollection = async (formData: FormData) => {
        try {
            const data = {
                title: formData.get('title'),
                description: formData.get('description'),
                isPublic: formData.get('isPublic') === 'on',
                topicIds: [] // TODO: Add topic selection
            };

            const response = await fetch('/api/topic-collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                setShowCreateForm(false);
                fetchCollections();
            }
        } catch (error) {
            console.error('Failed to create collection:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading collections...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Topic Collections</h1>
                    <p className="text-muted-foreground mt-2">Create and manage curated topic collections for study paths</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Collection
                </button>
            </div>

            {showCreateForm && (
                <div className="mb-8 p-6 bg-card border border-border rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateCollection(new FormData(e.target as HTMLFormElement));
                    }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                name="title"
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                placeholder="e.g., Foundations of Chassidus"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                placeholder="Describe this collection..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="isPublic" id="isPublic" />
                            <label htmlFor="isPublic" className="text-sm">Make public</label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Create Collection
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 border border-border rounded-md hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {collections.map((collection) => (
                    <div key={collection.id} className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-semibold text-foreground">{collection.title}</h3>
                                    {collection.is_featured && (
                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                            Featured
                                        </span>
                                    )}
                                    {collection.is_public && (
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Public
                                        </span>
                                    )}
                                </div>
                                {collection.description && (
                                    <p className="text-muted-foreground mb-3">{collection.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{collection.topicCount} topics</span>
                                    <span>Created {new Date(collection.created_at || '').toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => router.push(`/topics/collection/${collection.slug}`)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    title="View collection"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    title="Edit collection"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    title="Delete collection"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {collections.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No collections yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first topic collection to get started</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Create Collection
                    </button>
                </div>
            )}
        </div>
    );
}
