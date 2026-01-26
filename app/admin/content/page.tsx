'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Settings2,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  FileText,
  Tag,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ContentItem {
  id: number;
  canonical_title?: string;
  text?: string;
  status: 'draft' | 'published' | 'archived';
  date_updated: string;
  topic_type?: string;
  slug?: string;
}

export default function ContentManagerPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'topics' | 'statements'>('topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch content
  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', activeTab, statusFilter, page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/content/list?type=${activeTab}&${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch content');
      return res.json();
    }
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[], status: string }) => {
      const res = await fetch(`/api/admin/content/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          ids: ids,
          updates: { status }
        })
      });
      if (!res.ok) throw new Error('Bulk update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['contentStats'] });
      setSelectedItems([]);
    }
  });

  const toggleSelectAll = () => {
    if (selectedItems.length === data?.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data?.items.map((item: ContentItem) => item.id) || []);
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (status: string) => {
    if (selectedItems.length === 0) return;
    bulkStatusMutation.mutate({ ids: selectedItems, status });
  };

  return (
    <div className="space-y-10 p-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-serif italic text-foreground mb-2">Content Manager</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Manage your encyclopedia entries, visibility, and review status at scale.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-2xl w-fit border border-border/50 backdrop-blur-sm shadow-sm">
          <button
            onClick={() => setActiveTab('topics')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'topics' 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Topics
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === 'statements' 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Statements
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-card/50 border border-border/50 rounded-3xl p-6 backdrop-blur-sm shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
          <div className="flex-1 w-full max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-2xl pl-12 pr-4 py-3 text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-transparent">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 border-l border-border/50 pl-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkStatus('published')}
                  className="rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider h-9"
                >
                  Publish ({selectedItems.length})
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkStatus('draft')}
                  className="rounded-xl border-amber-500/20 text-amber-600 hover:bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider h-9"
                >
                  Unpublish
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table/List Area */}
        <div className="rounded-2xl border border-border/30 overflow-hidden shadow-sm">
          <div className="bg-muted/30 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-border/30">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded-md accent-primary"
              checked={selectedItems.length > 0 && selectedItems.length === data?.items.length}
              onChange={toggleSelectAll}
            />
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Content</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Type</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center">Status</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/20">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted/10" />
              ))
            ) : data?.items.map((item: ContentItem) => (
              <div 
                key={item.id} 
                className={cn(
                  "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-all",
                  selectedItems.includes(item.id) && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-md accent-primary"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                />
                
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {activeTab === 'topics' ? item.canonical_title : item.text}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Updated {new Date(item.date_updated).toLocaleDateString()}
                  </div>
                </div>

                <div className="px-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                    {activeTab === 'topics' ? (item.topic_type || 'General') : 'Statement'}
                  </span>
                </div>

                <div className="flex justify-center">
                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                    item.status === 'published' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    item.status === 'draft' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      item.status === 'published' ? "bg-emerald-500" :
                      item.status === 'draft' ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    {item.status}
                  </span>
                </div>

                <div className="flex justify-end gap-1">
                  {activeTab === 'topics' && item.slug && (
                    <Link 
                      href={`/topics/${item.slug}`}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                  <Link 
                    href={activeTab === 'topics' ? `/admin/topics/${item.id}` : `/admin/statements/${item.id}`}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground font-medium">
            Showing <span className="text-foreground">{((page-1)*limit)+1}-{Math.min(page*limit, data?.total || 0)}</span> of <span className="text-foreground">{data?.total || 0}</span> results
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
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.hasMore}
              onClick={() => setPage(p => p + 1)}
              className="rounded-xl h-9 w-9 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
