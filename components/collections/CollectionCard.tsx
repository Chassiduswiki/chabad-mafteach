'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, BookmarkPlus, Eye, Users, Tag, MoreVertical, Share2, Edit, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

interface CollectionCardProps {
  collection: Collection;
  currentUserId?: string;
  showActions?: boolean;
  compact?: boolean;
  onLike?: (collectionId: number) => void;
  onUnlike?: (collectionId: number) => void;
  onFollow?: (collectionId: number) => void;
  onUnfollow?: (collectionId: number) => void;
  onShare?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
}

export function CollectionCard({
  collection,
  currentUserId,
  showActions = true,
  compact = false,
  onLike,
  onUnlike,
  onFollow,
  onUnfollow,
  onShare,
  onEdit
}: CollectionCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(collection.like_count);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await onUnlike?.(collection.id);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await onLike?.(collection.id);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like action failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId || isFollowingAction) return;

    setIsFollowingAction(true);
    try {
      if (isFollowing) {
        await onUnfollow?.(collection.id);
        setIsFollowing(false);
      } else {
        await onFollow?.(collection.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsFollowingAction(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(collection);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(collection);
  };

  const topicCount = collection.topic_collection_topics?.length || 0;
  const isOwner = currentUserId === collection.curator.id;

  if (compact) {
    return (
      <Link href={`/collections/${collection.slug}`} className="block group">
        <div className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:shadow-lg transition-all duration-300 group-hover:border-primary/30 group-hover:bg-card">
          <div className="flex items-start gap-4">
            {/* Cover Image */}
            <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 overflow-hidden ring-1 ring-border/50 group-hover:ring-primary/20 transition-all">
              {collection.cover_image ? (
                <img
                  src={`/api/directus-proxy/assets/${collection.cover_image.id}`}
                  alt={collection.cover_image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <BookmarkPlus className="w-6 h-6 text-primary/40" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-[15px] truncate group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <User className="w-3 h-3 opacity-50" />
                    {collection.curator.first_name} {collection.curator.last_name}
                  </p>
                </div>
                
                {showActions && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {isOwner && (
                      <button
                        onClick={handleEdit}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title="Edit collection"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={handleShare}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title="Share collection"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              {collection.tags && collection.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {collection.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 mt-2.5 text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">
                <span className="flex items-center gap-1">
                  <BookmarkPlus className="w-3 h-3" />
                  {topicCount}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className={cn("w-3 h-3", isLiked && "fill-primary text-primary")} />
                  {likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {collection.view_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/collections/${collection.slug}`} className="block group">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group-hover:border-primary/30 group-hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative h-52 bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
          {collection.cover_image ? (
            <img
              src={`/api/directus-proxy/assets/${collection.cover_image.id}`}
              alt={collection.cover_image.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookmarkPlus className="w-16 h-16 text-primary/20" />
            </div>
          )}
          
          {/* Featured Badge */}
          {collection.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-yellow-400 text-yellow-950 rounded-full shadow-lg">
                Featured
              </span>
            </div>
          )}

          {/* Private Badge */}
          {!collection.is_public && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-slate-800/90 text-slate-100 backdrop-blur-md rounded-full border border-white/10">
                Private
              </span>
            </div>
          )}

          {/* Actions Overlay */}
          {showActions && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={handleEdit}
                    className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md text-muted-foreground hover:text-primary rounded-full shadow-xl transition-all hover:scale-110"
                    title="Edit collection"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md text-muted-foreground hover:text-primary rounded-full shadow-xl transition-all hover:scale-110"
                  title="Share collection"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light italic">
                "{collection.description}"
              </p>
            )}
          </div>

          {/* Tags */}
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {collection.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-primary/5 text-primary/70 rounded-lg border border-primary/10 transition-colors group-hover:bg-primary/10"
                >
                  <Tag className="w-2.5 h-2.5 mr-1 opacity-50" />
                  {tag}
                </span>
              ))}
              {collection.tags.length > 3 && (
                <span className="text-[9px] font-bold text-muted-foreground/50 self-center ml-1">
                  +{collection.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Curator Info */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-background shadow-md">
                {collection.curator.avatar ? (
                  <img
                    src={`/api/directus-proxy/assets/${collection.curator.avatar}`}
                    alt={`${collection.curator.first_name} ${collection.curator.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {collection.curator.first_name[0]}{collection.curator.last_name[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {collection.curator.first_name} {collection.curator.last_name}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDistanceToNow(new Date(collection.date_created), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
              <span className="flex items-center gap-1" title={`${topicCount} topics`}>
                <BookmarkPlus className="w-3 h-3" />
                {topicCount}
              </span>
              <span className="flex items-center gap-1" title={`${likeCount} likes`}>
                <Heart className={cn("w-3 h-3", isLiked && "fill-primary text-primary")} />
                {likeCount}
              </span>
            </div>
          </div>

          {/* Follow/Like Action Bar (for non-owners) */}
          {showActions && currentUserId && !isOwner && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  isLiked
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                {isLiked ? 'Appreciated' : 'Appreciate'}
              </button>
              
              <button
                onClick={handleFollow}
                disabled={isFollowingAction}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  isFollowing
                    ? "bg-slate-800 text-white shadow-lg"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
