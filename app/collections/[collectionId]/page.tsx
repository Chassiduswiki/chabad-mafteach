'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookmarkPlus, Heart, Users, Eye, Calendar, User, Share2, Edit, MoreVertical, ChevronLeft, Sparkles, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { TopicAnnotations } from '@/components/annotations/TopicAnnotations';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    title?: string;
    description?: string;
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
  status: string;
  date_created: string;
  date_updated: string;
  topic_collection_topics?: Array<{
    topic_id: number;
    order_index: number;
    topic?: {
      id: number;
      canonical_title: string;
      slug: string;
      description?: string;
      topic_type: string;
    };
  }>;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  // @ts-ignore
  const collectionId = React.use(params).collectionId as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch collection details
  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch by slug first, then by ID
      let response = await fetch(`/api/collections/${collectionId}?include_topics=true`);
      
      // If slug fetch fails, try ID
      if (!response.ok && response.status === 404) {
        response = await fetch(`/api/collections/${collectionId}?include_topics=true&by_id=true`);
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Collection not found');
        } else if (response.status === 403) {
          setError('This collection is private');
        } else {
          throw new Error('Failed to fetch collection');
        }
        return;
      }

      const data = await response.json();
      setCollection(data);
    } catch (err) {
      console.error('[CollectionDetail] Fetch error:', err);
      setError('An error occurred while loading the collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('chabad-mafteach:user-id') : null;
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!currentUserId || !collection) return;

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/collections/${collection.id}/like`, { method });
      
      if (!response.ok) throw new Error('Failed to update like status');
      
      setIsLiked(!isLiked);
      setCollection(prev => prev ? {
        ...prev,
        like_count: isLiked ? (prev.like_count || 0) - 1 : (prev.like_count || 0) + 1
      } : null);
    } catch (err) {
      console.error('Like action failed:', err);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!currentUserId || !collection) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/collections/${collection.id}/follow`, { method });
      
      if (!response.ok) throw new Error('Failed to update follow status');
      
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: collection?.title,
        text: collection?.description || `Check out this collection by ${collection?.curator.first_name} ${collection?.curator.last_name}`,
        url: shareUrl
      }).catch(err => {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleEdit = () => {
    router.push(`/collections/${collection?.slug}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="h-80 bg-muted/20" />
          <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
            <div className="space-y-4">
              <div className="h-10 bg-muted/30 rounded-xl w-1/3" />
              <div className="h-4 bg-muted/20 rounded-lg w-1/2" />
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted/20 rounded-2xl border border-border/50" />
                ))}
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-muted/20 rounded-2xl border border-border/50" />
                <div className="h-48 bg-muted/20 rounded-2xl border border-border/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="bg-muted/30 p-6 rounded-full w-fit mx-auto">
            <BookmarkPlus className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Collection Not Found</h1>
            <p className="text-muted-foreground leading-relaxed font-light italic">"{error || 'This collection may have been removed or set to private.'}"</p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Explore Library
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === collection.curator.id;
  const topicCount = collection.topic_collection_topics?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Breadcrumbs items={[
            { label: 'Collections', href: '/collections' },
            { label: collection?.title || 'Collection' }
          ]} />
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={handleEdit} className="rounded-full h-9 w-9">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-9 w-9">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative h-[40vh] lg:h-[50vh] bg-gradient-to-br from-primary/20 via-primary/5 to-background overflow-hidden">
        {collection.cover_image ? (
          <img
            src={`/api/directus-proxy/assets/${collection.cover_image.id}`}
            alt={collection.cover_image.title}
            className="w-full h-full object-cover opacity-60 dark:opacity-40"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-10">
            <BookmarkPlus className="w-32 h-32 text-primary" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 pb-12">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
              {collection.is_featured && (
                <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Featured
                </Badge>
              )}
              {!collection.is_public && (
                <Badge variant="outline" className="bg-slate-800/50 backdrop-blur-md text-white border-white/10 px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                  Private
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif italic tracking-tight text-foreground leading-tight">
              {collection.title}
            </h1>
            
            {collection.description && (
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl italic">
                "{collection.description}"
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                  <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  Collection Contents
                  <span className="text-sm font-normal text-muted-foreground ml-2">({topicCount})</span>
                </h2>
              </div>

              {topicCount === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border border-dashed border-border/50 space-y-4">
                  <BookmarkPlus className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground italic font-light">No topics have been added to this collection yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {collection.topic_collection_topics
                    ?.sort((a, b) => a.order_index - b.order_index)
                    .map((item, index) => (
                      <Link
                        key={item.topic_id}
                        href={`/topics/${item.topic?.slug}`}
                        className="group flex items-start gap-5 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                              {item.topic?.canonical_title}
                            </h3>
                            <Badge variant="secondary" className="bg-muted/50 text-[9px] font-bold uppercase h-5">
                              {item.topic?.topic_type}
                            </Badge>
                          </div>
                          {item.topic?.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
                              {item.topic.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </section>

            {currentUserId && (
              <section className="space-y-6">
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-2xl font-bold tracking-tight">Reflections & Discussion</h2>
                </div>
                <TopicAnnotations
                  topicId={collection.id}
                  currentUserId={currentUserId}
                  allowCreate={true}
                  className="max-w-none shadow-none bg-transparent p-0 border-none"
                />
              </section>
            )}
          </div>

          <div className="space-y-8">
            <section className="p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] shadow-sm space-y-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Curator</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden ring-4 ring-background shadow-xl">
                    {collection.curator.avatar ? (
                      <img
                        src={`/api/directus-proxy/assets/${collection.curator.avatar}`}
                        alt={`${collection.curator.first_name} ${collection.curator.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
                        {collection.curator.first_name[0]}{collection.curator.last_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg text-foreground truncate">
                      {collection.curator.first_name} {collection.curator.last_name}
                    </p>
                    {collection.curator.title && (
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{collection.curator.title}</p>
                    )}
                  </div>
                </div>
                {collection.curator.description && (
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {collection.curator.description}
                  </p>
                )}
              </div>

              <div className="space-y-6 pt-8 border-t border-border/30">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Engagement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{collection.view_count || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Appreciations</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{collection.like_count || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Forks</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">{collection.fork_count || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Since</span>
                    </div>
                    <p className="text-xs font-bold uppercase truncate">
                      {formatDistanceToNow(new Date(collection.date_created))}
                    </p>
                  </div>
                </div>
              </div>

              {currentUserId && !isOwner && (
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleLike}
                    variant={isLiked ? "secondary" : "outline"}
                    className={cn(
                      "w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest gap-3 transition-all",
                      isLiked && "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                    {isLiked ? 'Appreciated' : 'Appreciate Journey'}
                  </Button>
                  
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "default" : "outline"}
                    className={cn(
                      "w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest gap-3 transition-all",
                      !isFollowing && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    {isFollowing ? 'Following Curator' : 'Follow for Updates'}
                  </Button>
                </div>
              )}
            </section>

            {collection.tags.length > 0 && (
              <section className="p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2.5rem] shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Concept Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {collection.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-[11px] font-medium bg-muted/50 border border-border/50 rounded-xl hover:bg-muted transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
