'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter,
  RefreshCw,
  User,
  FileText,
  Settings,
  Trash2,
  Plus,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ActivityItem {
  id: number;
  action: string;
  collection: string;
  timestamp: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  item?: string;
}

const actionIcons: Record<string, React.ComponentType<any>> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: User,
  read: Eye,
};

const actionColors: Record<string, string> = {
  create: 'text-emerald-500 bg-emerald-500/10',
  update: 'text-blue-500 bg-blue-500/10',
  delete: 'text-rose-500 bg-rose-500/10',
  login: 'text-purple-500 bg-purple-500/10',
  read: 'text-slate-500 bg-slate-500/10',
};

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-log', actionFilter, collectionFilter],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-log');
      if (!res.ok) throw new Error('Failed to fetch audit log');
      return res.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const activity: ActivityItem[] = data?.activity || [];

  const filteredActivity = activity.filter(item => {
    if (actionFilter !== 'all' && item.action !== actionFilter) return false;
    if (collectionFilter !== 'all' && item.collection !== collectionFilter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.action.toLowerCase().includes(searchLower) ||
        item.collection.toLowerCase().includes(searchLower) ||
        item.user?.first_name?.toLowerCase().includes(searchLower) ||
        item.user?.last_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const collections = [...new Set(activity.map(a => a.collection))].sort();
  const actions = [...new Set(activity.map(a => a.action))].sort();

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-10 p-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-serif italic text-foreground">Audit Log</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Complete activity history across all collections and users.
          </p>
        </div>
        
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching}
          variant="outline" 
          className="rounded-xl"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </header>

      {/* Filters */}
      <div className="bg-card/50 border border-border/50 rounded-3xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 border border-transparent focus:border-primary/20 focus:bg-background rounded-2xl pl-12 pr-4 py-3 text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-transparent">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-transparent">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <select 
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="all">All Collections</option>
                {collections.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-card/50 border border-border/50 rounded-3xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif italic flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-500" />
            Recent Activity
          </h2>
          <span className="text-xs text-muted-foreground">
            {filteredActivity.length} entries
          </span>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No activity found</p>
            </div>
          ) : (
            filteredActivity.map((item) => {
              const IconComponent = actionIcons[item.action] || Activity;
              const colorClass = actionColors[item.action] || 'text-slate-500 bg-slate-500/10';
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-border/50 group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">
                          {item.user?.first_name || 'System'} {item.user?.last_name || ''}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          performed <span className="font-medium text-foreground">{item.action}</span> on
                        </span>
                        <span className="ml-1 font-medium text-primary">{item.collection}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                    {item.item && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Item ID: {item.item}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
