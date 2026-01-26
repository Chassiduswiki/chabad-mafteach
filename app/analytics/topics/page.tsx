'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Users,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  Loader2,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TopicAnalytics {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type?: string;
  views: number;
  uniqueVisitors?: number;
  avgTimeOnPage?: number;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export default function TopicsAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [sortBy, setSortBy] = useState<'views' | 'trend'>('views');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['topics-analytics', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/topics?range=${timeRange}`);
      if (!res.ok) {
        // Return empty data structure if API doesn't exist yet
        return { topics: [], summary: { totalViews: 0, totalTopics: 0, avgViewsPerTopic: 0 } };
      }
      return res.json();
    },
  });

  const topics: TopicAnalytics[] = data?.topics || [];
  const summary = data?.summary || { totalViews: 0, totalTopics: 0, avgViewsPerTopic: 0 };

  const filteredTopics = topics
    .filter(t => {
      if (!searchQuery) return true;
      return t.canonical_title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'trend') return (b.changePercent || 0) - (a.changePercent || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-10 p-10 max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-4xl font-serif italic text-foreground">Topics Analytics</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Performance insights for encyclopedia entries.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-2xl border border-border/50">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  timeRange === range 
                    ? "bg-foreground text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-serif italic text-foreground mb-1">
              {isLoading ? '...' : summary.totalViews.toLocaleString()}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Views
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="text-3xl font-serif italic text-foreground mb-1">
              {isLoading ? '...' : summary.totalTopics}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Topics Tracked
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-serif italic text-foreground mb-1">
              {isLoading ? '...' : Math.round(summary.avgViewsPerTopic)}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Views / Topic
            </div>
          </div>
        </div>

        {/* Topics Table */}
        <div className="bg-card/50 border border-border/50 rounded-3xl p-6 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <h2 className="text-xl font-serif italic">Topic Performance</h2>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted/30 border border-transparent focus:border-primary/20 rounded-2xl pl-12 pr-4 py-2.5 text-sm w-64 outline-none"
                />
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
                >
                  <option value="views">Most Views</option>
                  <option value="trend">Trending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/30 overflow-hidden">
            <div className="bg-muted/30 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-border/30">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Topic</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-20">Views</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-20">Trend</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center w-20">Type</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 w-10"></div>
            </div>

            <div className="divide-y divide-border/20">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-20">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No analytics data available yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Analytics will populate as users visit topic pages
                  </p>
                </div>
              ) : (
                filteredTopics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground/30 w-6">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{topic.canonical_title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">/{topic.slug}</div>
                      </div>
                    </div>
                    
                    <div className="text-center w-20">
                      <span className="font-serif italic text-lg">{topic.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-center w-20">
                      {topic.trend === 'up' ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <TrendingUp className="w-3 h-3" />
                          +{topic.changePercent || 0}%
                        </span>
                      ) : topic.trend === 'down' ? (
                        <span className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                          <TrendingDown className="w-3 h-3" />
                          {topic.changePercent || 0}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                    
                    <div className="text-center w-20">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-md">
                        {topic.topic_type || 'General'}
                      </span>
                    </div>
                    
                    <div className="w-10">
                      <Link 
                        href={`/topics/${topic.slug}`}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
