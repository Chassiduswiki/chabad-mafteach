'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Topic {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type?: string;
  status: 'draft' | 'published' | 'archived';
  date_updated: string;
  date_created: string;
}

export default function TopicsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-topics', statusFilter, typeFilter, page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/content/list?type=topics&${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
  });

  const topics: Topic[] = data?.items || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const topicTypes = ['General', 'Concept', 'Person', 'Event', 'Location', 'Term'];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-10 p-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-serif italic text-foreground">Topics</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Manage all encyclopedia entries.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/editor/topics/new">
            <Button className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-card/50 border border-border/50 rounded-3xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-muted/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-2xl pl-12 pr-4 py-3 text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-transparent">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-transparent">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {topicTypes.map(type => (
                  <option key={type} value={type.toLowerCase()}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Table */}
      <div className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-sm">
        <div className="bg-muted/30 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-border/30">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Topic</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-24">Type</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-24">Status</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-28">Updated</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 w-24 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No topics found</p>
              <Link href="/editor/topics/new">
                <Button variant="outline" className="mt-4 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Topic
                </Button>
              </Link>
            </div>
          ) : (
            topics.map((topic) => (
              <div 
                key={topic.id} 
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-all group"
              >
                <div className="min-w-0">
                  <Link 
                    href={`/editor/topics/${topic.slug}`}
                    className="font-medium text-sm hover:text-primary transition-colors block truncate"
                  >
                    {topic.canonical_title}
                  </Link>
                  <div className="text-[10px] text-muted-foreground truncate">
                    /{topic.slug}
                  </div>
                </div>

                <div className="text-center w-24">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                    {topic.topic_type || 'General'}
                  </span>
                </div>

                <div className="flex justify-center w-24">
                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                    topic.status === 'published' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    topic.status === 'draft' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}>
                    {topic.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                    {topic.status === 'draft' && <Clock className="w-3 h-3" />}
                    {topic.status === 'archived' && <AlertCircle className="w-3 h-3" />}
                    {topic.status}
                  </span>
                </div>

                <div className="text-center w-28">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(topic.date_updated)}
                  </span>
                </div>

                <div className="flex justify-end gap-1 w-24">
                  <Link 
                    href={`/topics/${topic.slug}`}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link 
                    href={`/editor/topics/${topic.slug}`}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Link 
                    href={`/admin/topics/${topic.id}/ai-enhance`}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="AI Enhance"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {topics.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/10">
            <p className="text-xs text-muted-foreground font-medium">
              Showing <span className="text-foreground">{((page-1)*limit)+1}-{Math.min(page*limit, total)}</span> of <span className="text-foreground">{total}</span> topics
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-xl h-9 w-9 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">{page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl h-9 w-9 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
