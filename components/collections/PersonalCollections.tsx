'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Heart, BookmarkPlus, X, Check, Share2, Eye, Trash2, Library, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    className?: string;
}

export function PersonalCollections({ currentTopicId, isInCollection, onCollectionChange, className }: PersonalCollectionsProps) {
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
        const shareData = {
            name: collection.name,
            description: collection.description,
            topics: collection.topicIds,
            created: collection.createdAt
        };

        const shareText = `Check out my study collection: ${collection.name}\n${collection.description || ''}\n\nShared from Chabad Mafteach`;

        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: collection.name,
                    text: shareText,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
                setSharedId(collection.id);
                setTimeout(() => setSharedId(null), 2000);
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    if (currentTopicId) {
        const relevantCollections = collections.filter(c => c.topicIds.includes(currentTopicId));

        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-md text-primary">
                            <Library className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight">Personal Collections</h3>
                    </div>
                    <button
                        onClick={() => setIsAddingToCollection(!isAddingToCollection)}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                        {isAddingToCollection ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isAddingToCollection ? 'Cancel' : 'Add to collection'}
                    </button>
                </div>

                {relevantCollections.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {relevantCollections.map(collection => (
                            <Badge 
                                key={collection.id} 
                                variant="secondary" 
                                className="pl-2 pr-1 h-7 rounded-full bg-primary/5 text-primary border-primary/10 text-[10px] font-bold"
                            >
                                {collection.name}
                                <button
                                    onClick={() => removeFromCollection(collection.id)}
                                    className="ml-1.5 p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {isAddingToCollection && (
                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {collections.filter(c => !c.topicIds.includes(currentTopicId)).length > 0 ? (
                            <div className="max-h-40 overflow-y-auto p-1">
                                {collections.filter(c => !c.topicIds.includes(currentTopicId)).map(collection => (
                                    <button
                                        key={collection.id}
                                        onClick={() => addToCollection(collection.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-primary/10 hover:text-primary rounded-xl flex items-center justify-between group transition-colors"
                                    >
                                        <span className="text-xs font-medium">{collection.name}</span>
                                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-[10px] text-muted-foreground italic mb-2">No other collections available</p>
                            </div>
                        )}

                        <div className="border-t border-border/30 p-1">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-xl flex items-center gap-2 text-primary transition-all group"
                            >
                                <div className="bg-primary/10 p-1 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Plus className="w-3 h-3" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider">Create new collection</span>
                            </button>
                        </div>
                    </div>
                )}

                {showCreateForm && (
                    <div className="p-4 bg-card border border-primary/20 rounded-2xl space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">New Collection</h4>
                            <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <Input
                            placeholder="Collection name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="h-9 text-xs bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                        />
                        <Textarea
                            placeholder="Description (optional)"
                            value={newCollectionDesc}
                            onChange={(e) => setNewCollectionDesc(e.target.value)}
                            rows={2}
                            className="text-xs bg-muted/30 border-border/50 focus-visible:ring-primary/20 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                onClick={() => setShowCreateForm(false)}
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-bold uppercase"
                            >
                                Discard
                            </Button>
                            <Button
                                onClick={createCollection}
                                size="sm"
                                className="h-8 rounded-full px-4 font-bold text-[10px] uppercase"
                                disabled={!newCollectionName.trim()}
                            >
                                Create & Add
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Show collection overview (Library view)
    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary font-bold">
                            <Library className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">My Study Collections</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Personalized spaces for your Torah learning journeys.</p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 rounded-full px-5 h-10 font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" />
                    New Collection
                </Button>
            </div>

            {showCreateForm && (
                <div className="p-6 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-3xl space-y-5 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h4 className="font-bold text-lg leading-none">Create Collection</h4>
                        </div>
                        <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Name</label>
                            <Input
                                placeholder="e.g., Daily Tanya Insights"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                            <Textarea
                                placeholder="Focus area for this collection..."
                                value={newCollectionDesc}
                                onChange={(e) => setNewCollectionDesc(e.target.value)}
                                rows={3}
                                className="bg-background/50 border-border/50 focus-visible:ring-primary/20 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            onClick={() => setShowCreateForm(false)}
                            variant="ghost"
                            className="font-bold text-xs uppercase"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={createCollection}
                            className="rounded-full px-8 font-bold text-xs uppercase shadow-md shadow-primary/10"
                            disabled={!newCollectionName.trim()}
                        >
                            Create Collection
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                    <div 
                        key={collection.id} 
                        className="group p-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-primary/10 p-2.5 rounded-xl text-primary transition-all group-hover:scale-110">
                                    <BookmarkPlus className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleShare(collection)}
                                        className={cn(
                                            "p-2 rounded-full transition-colors",
                                            sharedId === collection.id ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground hover:bg-muted"
                                        )}
                                        title="Share collection"
                                    >
                                        {sharedId === collection.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => deleteCollection(collection.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        title="Delete collection"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow space-y-2">
                                <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {collection.name}
                                </h4>
                                {collection.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light italic">
                                        "{collection.description}"
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1.5">
                                        <Heart className="w-3 h-3" />
                                        {collection.topicIds.length} topics
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.push(`/collections/personal/${collection.id}`)}
                                    className="h-8 rounded-full px-3 text-[10px] font-bold uppercase gap-1.5 hover:bg-primary hover:text-primary-foreground"
                                >
                                    Open
                                    <Eye className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {collections.length === 0 && !showCreateForm && (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50 max-w-2xl mx-auto space-y-6">
                    <div className="bg-muted p-6 rounded-full w-fit mx-auto opacity-30 shadow-inner">
                        <Heart className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-serif italic text-foreground/70">A Blank Slate...</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Create your first collection to organize the concepts that inspire your learning.</p>
                    </div>
                    <Button 
                        onClick={() => setShowCreateForm(true)}
                        className="rounded-full px-10 h-12 font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:scale-105"
                    >
                        Begin Your Collection
                    </Button>
                </div>
            )}
        </div>
    );
}
