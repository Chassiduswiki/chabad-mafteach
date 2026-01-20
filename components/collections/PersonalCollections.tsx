'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Heart, BookmarkPlus, X, Check, Share2, Eye, Trash2 } from 'lucide-react';

interface PersonalCollection {
    id: string;
    name: string;
    description?: string;
    topicIds: number[];
    createdAt: string;
}

interface PersonalCollectionsProps {
    currentTopicId?: number;
    isInCollection?: boolean;
    onCollectionChange?: () => void;
}

export function PersonalCollections({ currentTopicId, isInCollection, onCollectionChange }: PersonalCollectionsProps) {
    const [collections, setCollections] = useState<PersonalCollection[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDesc, setNewCollectionDesc] = useState('');
    const [isAddingToCollection, setIsAddingToCollection] = useState(false);
    const [sharedId, setSharedId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = () => {
        try {
            const saved = localStorage.getItem('chabad-mafteach:personal-collections');
            if (saved) {
                setCollections(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load collections:', error);
        }
    };

    const saveCollections = (newCollections: PersonalCollection[]) => {
        try {
            localStorage.setItem('chabad-mafteach:personal-collections', JSON.stringify(newCollections));
            setCollections(newCollections);
        } catch (error) {
            console.error('Failed to save collections:', error);
        }
    };

    const createCollection = () => {
        if (!newCollectionName.trim()) return;

        const newCollection: PersonalCollection = {
            id: `personal-${Date.now()}`,
            name: newCollectionName.trim(),
            description: newCollectionDesc.trim() || undefined,
            topicIds: currentTopicId ? [currentTopicId] : [],
            createdAt: new Date().toISOString()
        };

        const updatedCollections = [...collections, newCollection];
        saveCollections(updatedCollections);

        setNewCollectionName('');
        setNewCollectionDesc('');
        setShowCreateForm(false);

        if (onCollectionChange) onCollectionChange();
    };

    const addToCollection = (collectionId: string) => {
        if (!currentTopicId) return;

        const updatedCollections = collections.map(collection => {
            if (collection.id === collectionId && !collection.topicIds.includes(currentTopicId)) {
                return {
                    ...collection,
                    topicIds: [...collection.topicIds, currentTopicId]
                };
            }
            return collection;
        });

        saveCollections(updatedCollections);
        setIsAddingToCollection(false);
        if (onCollectionChange) onCollectionChange();
    };

    const removeFromCollection = (collectionId: string) => {
        if (!currentTopicId) return;

        const updatedCollections = collections.map(collection => {
            if (collection.id === collectionId) {
                return {
                    ...collection,
                    topicIds: collection.topicIds.filter(id => id !== currentTopicId)
                };
            }
            return collection;
        });

        saveCollections(updatedCollections);
        if (onCollectionChange) onCollectionChange();
    };

    const deleteCollection = (collectionId: string) => {
        const updatedCollections = collections.filter(c => c.id !== collectionId);
        saveCollections(updatedCollections);
    };

    const handleShare = async (collection: PersonalCollection) => {
        // Create a shareable data object
        const shareData = {
            name: collection.name,
            description: collection.description,
            topics: collection.topicIds,
            created: collection.createdAt
        };

        const shareText = `Check out my study collection: ${collection.name}\n${collection.description || ''}\n\nShared from Chabad Mafteach`;

        try {
            if (navigator.share) {
                // Use native share API on mobile
                await navigator.share({
                    title: collection.name,
                    text: shareText,
                    url: window.location.href
                });
            } else {
                // Fallback to copying collection data
                await navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
                setSharedId(collection.id);
                setTimeout(() => setSharedId(null), 2000);
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    if (currentTopicId) {
        // Show collection actions for current topic
        const relevantCollections = collections.filter(c => c.topicIds.includes(currentTopicId));

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">My Collections</h3>
                    <button
                        onClick={() => setIsAddingToCollection(!isAddingToCollection)}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                        <BookmarkPlus className="w-3 h-3" />
                        {isAddingToCollection ? 'Cancel' : 'Add to collection'}
                    </button>
                </div>

                {relevantCollections.length > 0 && (
                    <div className="space-y-2">
                        {relevantCollections.map(collection => (
                            <div key={collection.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <span className="text-sm text-foreground">{collection.name}</span>
                                <button
                                    onClick={() => removeFromCollection(collection.id)}
                                    className="text-muted-foreground hover:text-destructive p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {isAddingToCollection && (
                    <div className="space-y-2">
                        {collections.filter(c => !c.topicIds.includes(currentTopicId)).map(collection => (
                            <button
                                key={collection.id}
                                onClick={() => addToCollection(collection.id)}
                                className="w-full text-left p-2 hover:bg-muted/50 rounded-lg flex items-center justify-between"
                            >
                                <span className="text-sm">{collection.name}</span>
                                <Plus className="w-3 h-3" />
                            </button>
                        ))}

                        <div className="border-t border-border pt-2">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full text-left p-2 hover:bg-muted/50 rounded-lg flex items-center gap-2 text-primary"
                            >
                                <Plus className="w-3 h-3" />
                                <span className="text-sm">Create new collection</span>
                            </button>
                        </div>
                    </div>
                )}

                {showCreateForm && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                        <input
                            type="text"
                            placeholder="Collection name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-border rounded"
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={newCollectionDesc}
                            onChange={(e) => setNewCollectionDesc(e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-border rounded resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={createCollection}
                                className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-3 py-1 border border-border text-sm rounded hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Show collection overview
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">My Study Collections</h3>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Collection
                </button>
            </div>

            {showCreateForm && (
                <div className="p-4 bg-card border border-border rounded-lg space-y-3">
                    <h4 className="font-medium">Create New Collection</h4>
                    <input
                        type="text"
                        placeholder="Collection name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={createCollection}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Create Collection
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-4 py-2 border border-border rounded-md hover:bg-muted"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {collections.map((collection) => (
                    <div key={collection.id} className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="font-medium text-foreground">{collection.name}</h4>
                                {collection.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    {collection.topicIds.length} topics • Created {new Date(collection.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => router.push(`/collections/personal/${collection.id}`)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    title="View collection"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteCollection(collection.id)}
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

            {collections.length === 0 && !showCreateForm && (
                <div className="text-center py-8 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <h3 className="font-medium mb-2">No collections yet</h3>
                    <p className="text-sm mb-4">Create your first study collection to organize topics you're learning</p>
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
