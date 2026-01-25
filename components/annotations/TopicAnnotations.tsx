'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Heart, Reply, Edit3, Trash2, Flag, Filter, ChevronDown, Sparkles, User, Info, AlertCircle, X, Clock, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Annotation {
  id: string;
  content: string;
  annotation_type: 'note' | 'question' | 'insight' | 'correction';
  section_reference?: string;
  is_public: boolean;
  like_count: number;
  date_created: string;
  user_created: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

interface TopicAnnotationsProps {
  topicId: number | string;
  currentUserId?: string;
  section?: string;
  allowCreate?: boolean;
  compact?: boolean;
  className?: string;
}

export function TopicAnnotations({
  topicId,
  currentUserId,
  section,
  allowCreate = true,
  compact = false,
  className,
}: TopicAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [annotationType, setAnnotationType] = useState<Annotation['annotation_type']>('note');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<Annotation['annotation_type'] | 'all'>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());

  // Fetch annotations
  const fetchAnnotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        ...(section && { section }),
        ...(filterType !== 'all' && { type: filterType }),
        public: showPublicOnly.toString()
      });

      const response = await fetch(`/api/topics/${topicId}/annotations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch annotations');
      }

      const data = await response.json();
      setAnnotations(data);
    } catch (err) {
      console.error('Annotations fetch error:', err);
      setError('Unable to load annotations at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, [topicId, section, filterType, showPublicOnly]);

  // Create annotation
  const handleCreateAnnotation = async () => {
    if (!newAnnotation.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/topics/${topicId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newAnnotation.trim(),
          annotation_type: annotationType,
          section_reference: section || null,
          is_public: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create annotation');
      }

      const newAnnotationData = await response.json();
      setAnnotations(prev => [newAnnotationData, ...prev]);
      setNewAnnotation('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to post annotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like annotation
  const handleLikeAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(`/api/annotations/${annotationId}/like`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to like annotation');

      setAnnotations(prev => prev.map(a => 
        a.id === annotationId 
          ? { ...a, like_count: a.like_count + 1 }
          : a
      ));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  // Toggle annotation expansion
  const toggleExpansion = (annotationId: string) => {
    setExpandedAnnotations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(annotationId)) {
        newSet.delete(annotationId);
      } else {
        newSet.add(annotationId);
      }
      return newSet;
    });
  };

  // Get annotation type config
  const getAnnotationTypeConfig = (type: Annotation['annotation_type']) => {
    const configs = {
      note: {
        label: 'Note',
        color: 'blue',
        icon: MessageSquare,
        styles: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      },
      question: {
        label: 'Question',
        color: 'yellow',
        icon: MessageSquare,
        styles: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      },
      insight: {
        label: 'Insight',
        color: 'green',
        icon: Sparkles,
        styles: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      },
      correction: {
        label: 'Correction',
        color: 'red',
        icon: Info,
        styles: 'bg-red-500/10 text-red-600 border-red-500/20'
      }
    };
    return configs[type];
  };

  // Filter annotations
  const filteredAnnotations = annotations.filter(annotation => {
    if (filterType !== 'all' && annotation.annotation_type !== filterType) {
      return false;
    }
    return true;
  });

  if (loading && annotations.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted/20 rounded-2xl p-5 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-2 bg-muted rounded w-1/6" />
              </div>
            </div>
            <div className="h-3 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", compact ? "" : "p-6 bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-foreground tracking-tight">
            Community Insights {annotations.length > 0 && <span className="ml-1 text-muted-foreground font-normal">({annotations.length})</span>}
          </h3>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-xs pl-7 pr-8 py-1.5 bg-muted/50 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium transition-all hover:bg-muted"
            >
              <option value="all">All Thoughts</option>
              <option value="note">Notes</option>
              <option value="question">Questions</option>
              <option value="insight">Insights</option>
              <option value="correction">Corrections</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={() => setShowPublicOnly(!showPublicOnly)}
            className={cn(
              "text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all",
              showPublicOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Public
          </button>
        </div>
      </div>

      {/* Create Form */}
      {allowCreate && currentUserId && (
        <div className="relative">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-3 w-full p-4 bg-muted/30 border border-dashed border-border/50 rounded-2xl hover:bg-muted/50 transition-all text-muted-foreground group"
            >
              <div className="bg-background p-1.5 rounded-lg border border-border group-hover:text-primary group-hover:border-primary/30 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Add your perspective or ask a question...</span>
            </button>
          ) : (
            <div className="p-5 bg-card border border-primary/20 rounded-2xl space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Annotation Type</label>
                  <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                    {(['note', 'question', 'insight', 'correction'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setAnnotationType(type)}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-tight",
                          annotationType === type 
                            ? "bg-background text-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                placeholder="Share your thoughts, connections, or clarifications with the community..."
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground italic">Your thought will be visible to all learners.</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewAnnotation('');
                    }}
                    className="text-xs font-bold"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleCreateAnnotation}
                    disabled={!newAnnotation.trim() || isSubmitting}
                    size="sm"
                    className="rounded-full px-5 font-bold"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Insight'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annotations List */}
      {error ? (
        <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border">
          <AlertCircle className="w-8 h-8 text-destructive/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="link" size="sm" onClick={fetchAnnotations}>Try refreshing</Button>
        </div>
      ) : filteredAnnotations.length === 0 ? (
        <div className="text-center py-16 opacity-40">
          <div className="bg-muted p-4 rounded-full w-fit mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium italic">
            {filterType !== 'all' 
              ? `No ${filterType} annotations found for this section.`
              : 'Be the first to share an insight on this topic!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnotations.map((annotation) => {
            const typeConfig = getAnnotationTypeConfig(annotation.annotation_type);
            const isExpanded = expandedAnnotations.has(annotation.id);
            const isLong = annotation.content.length > 240;

            return (
              <div
                key={annotation.id}
                className="group p-5 bg-card border border-border/50 rounded-2xl space-y-4 transition-all hover:border-primary/20 hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
                      {annotation.user_created.avatar ? (
                        <img
                          src={`/api/directus-proxy/assets/${annotation.user_created.avatar}`}
                          alt={`${annotation.user_created.first_name} ${annotation.user_created.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {annotation.user_created.first_name[0]}{annotation.user_created.last_name[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {annotation.user_created.first_name} {annotation.user_created.last_name}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[9px] font-bold uppercase h-5 px-2", typeConfig.styles)}
                        >
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(annotation.date_created), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentUserId && (
                      <button
                        onClick={() => handleLikeAnnotation(annotation.id)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title="Like insight"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Reply">
                      <Reply className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors" title="Report">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="text-[13px] leading-relaxed text-foreground/90 font-light">
                  {isLong && !isExpanded ? (
                    <div className="space-y-2">
                      <p className="line-clamp-3 italic">"{annotation.content}"</p>
                      <button
                        onClick={() => toggleExpansion(annotation.id)}
                        className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider"
                      >
                        Expand Reflection
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="italic">"{annotation.content}"</p>
                      {isLong && (
                        <button
                          onClick={() => toggleExpansion(annotation.id)}
                          className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    <span className="flex items-center gap-1.5">
                      <Heart className={cn("w-3 h-3", annotation.like_count > 0 && "fill-primary text-primary")} />
                      {annotation.like_count} Appreciation
                    </span>
                    {annotation.section_reference && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Ref: {annotation.section_reference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
