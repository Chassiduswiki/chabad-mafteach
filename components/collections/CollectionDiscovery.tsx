'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, TrendingUp, Clock, Heart, Users, Tag, X, BookmarkPlus, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { CollectionCard } from './CollectionCard';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Collection {
  id: number;
  title: string;
  slug: string;
  description?: string;
  curator: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  is_public: boolean;
  is_featured: boolean;
  cover_image?: {
    id: string;
    title: string;
    filename_download: string;
  };
  tags: string[];
  view_count: number;
  like_count: number;
  fork_count: number;
  date_created: string;
  date_updated: string;
  topic_collection_topics?: Array<{
    topic_id: number;
    topic?: {
      id: number;
      canonical_title: string;
      slug: string;
      description?: string;
      topic_type: string;
    };
  }>;
}

interface CollectionDiscoveryProps {
  currentUserId?: string;
  featured?: boolean;
  curator?: string;
  initialTags?: string[];
}

export function CollectionDiscovery({
  currentUserId,
  featured = false,
  curator,
  initialTags = []
}: CollectionDiscoveryProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [sortBy, setSortBy] = useState('date_updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  const router = useRouter();

  // Fetch collections
  const fetchCollections = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '12',
        sort: sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(featured && { featured: 'true' }),
        ...(curator && { curator })
      });

      const response = await fetch(`/api/collections?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      
      if (reset) {
        setCollections(data.collections || []);
        setPage(1);
      } else {
        setCollections(prev => [...prev, ...(data.collections || [])]);
      }

      setHasMore(data.pagination ? data.pagination.page < data.pagination.pages : false);
    } catch (err) {
      console.error('[CollectionDiscovery] Fetch error:', err);
      setError('Unable to load collections at this time.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch popular tags
  const fetchPopularTags = async () => {
    try {
      const response = await fetch('/api/collections/tags/popular');
      if (response.ok) {
        const tags = await response.json();
        setPopularTags(tags || []);
      }
    } catch (err) {
      console.warn('[CollectionDiscovery] Failed to fetch tags:', err);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCollections(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, sortBy, selectedTags, featured, curator]);

  // Initial load
  useEffect(() => {
    fetchPopularTags();
  }, []);

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchCollections();
    }
  };

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Handle collection actions
  const handleLike = async (collectionId: number) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/like`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to like collection');
      
      setCollections(prev => prev.map(c => 
        c.id === collectionId 
          ? { ...c, like_count: (c.like_count || 0) + 1 }
          : c
      ));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleUnlike = async (collectionId: number) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/like`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to unlike collection');
      
      setCollections(prev => prev.map(c => 
        c.id === collectionId 
          ? { ...c, like_count: Math.max(0, (c.like_count || 0) - 1) }
          : c
      ));
    } catch (err) {
      console.error('Unlike failed:', err);
    }
  };

  const handleFollow = async (collectionId: number) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/follow`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to follow collection');
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const handleUnfollow = async (collectionId: number) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/follow`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to unfollow collection');
    } catch (err) {
      console.error('Unfollow failed:', err);
    }
  };

  const handleShare = (collection: Collection) => {
    const shareUrl = `${window.location.origin}/collections/${collection.slug}`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: collection.title,
        text: collection.description || `Check out this collection by ${collection.curator.first_name} ${collection.curator.last_name}`,
        url: shareUrl
      }).catch(err => {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleEdit = (collection: Collection) => {
    router.push(`/collections/${collection.slug}/edit`);
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters Card */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-sm space-y-6 transition-all hover:border-primary/10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-grow group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by title, description, or curator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Toggle */}
            <div className="relative min-w-[160px]">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-background/50 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs font-bold uppercase tracking-tight transition-all hover:bg-muted cursor-pointer"
              >
                <option value="date_updated">Recently Updated</option>
                <option value="date_created">Newest First</option>
                <option value="like_count">Most Appreciated</option>
                <option value="view_count">Most Viewed</option>
                <option value="title">Alphabetical</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="bg-muted/50 p-1 rounded-2xl border border-border/50 flex items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  viewMode === 'grid' ? "bg-background text-primary shadow-sm ring-1 ring-border/10" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  viewMode === 'list' ? "bg-background text-primary shadow-sm ring-1 ring-border/10" : "text-muted-foreground hover:text-foreground"
                )}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toggle and Active Tags */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-wider gap-2 border-primary/10"
          >
            <Filter className="h-3 w-3" />
            Refine Tags
            {selectedTags.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                {selectedTags.length}
              </span>
            )}
          </Button>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="pl-2 pr-1 h-6 rounded-full bg-primary/5 text-primary border-primary/10 text-[9px] font-bold uppercase"
                >
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="ml-1 p-0.5 hover:bg-primary/10 rounded-full">
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTags([])}
                className="h-6 px-2 text-[9px] font-bold uppercase text-muted-foreground hover:text-primary"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Expanded Tag Cloud */}
        {showFilters && popularTags.length > 0 && (
          <div className="pt-4 border-t border-border/30 animate-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 ml-1 flex items-center gap-2">
              <Tag className="h-2.5 w-2.5" />
              Popular Concept Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                    selectedTags.includes(tag)
                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10 scale-105"
                      : "bg-background border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Grid/List */}
      {loading && collections.length === 0 ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted/20 animate-pulse rounded-3xl h-64 border border-border/50" />
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-3xl border border-destructive/10 max-w-lg mx-auto">
          <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Discovery Interrupted</h3>
            <p className="text-sm text-muted-foreground px-10">{error}</p>
          </div>
          <Button onClick={() => fetchCollections(true)} variant="outline" className="rounded-full font-bold text-xs uppercase">
            Retry Search
          </Button>
        </div>
      ) : collections.length === 0 ? (
        <div className="py-24 text-center space-y-4 opacity-60 max-w-md mx-auto">
          <div className="bg-muted p-5 rounded-full w-fit mx-auto">
            <Search className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">No collections found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search terms or refining your tags.</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => { setSearchTerm(''); setSelectedTags([]); fetchCollections(true); }}
            className="text-primary font-bold text-xs uppercase"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                currentUserId={currentUserId}
                compact={viewMode === 'list'}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onShare={handleShare}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {/* Load More Action */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="outline"
                className="rounded-full px-10 h-12 font-bold text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Expanding results...
                  </>
                ) : (
                  'Explore More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
