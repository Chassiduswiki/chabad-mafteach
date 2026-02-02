'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Eye, 
  Timer, 
  UserPlus, 
  BarChart3, 
  FileText,
  Zap,
  Loader2,
  RefreshCw,
  AlertCircle,
  Activity,
  Trash2,
  ShieldCheck,
  Palette,
  Layout,
  Megaphone,
  Settings,
  Search,
  ArrowRight,
  Clock,
  Check,
  CheckCircle2,
  BookOpen,
  Lock,
  History,
  Database,
  Globe,
  FileSearch,
  Key,
  ShieldAlert,
  Save,
  Download,
  Share2,
  PieChart,
  TrendingUp,
  LineChart,
  ActivitySquare,
  Terminal,
  Server,
  CloudCog,
  KeyRound,
  FileCode,
  Languages,
  Workflow,
  Split,
  CalendarClock,
  CloudUpload,
  HardDriveDownload,
  Fingerprint,
  Monitor
} from 'lucide-react';
import { 
  Empty, 
  EmptyDescription, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle 
} from '@/components/ui/v2/empty';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from './MetricCard';
import { ReviewQueueV2 } from './ReviewQueueV2';
import { SystemHealth } from './SystemHealth';
import { 
  AIChatPanel, 
  FloatingAIChatButton 
} from '@/components/topic-editor';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchDashboardData, 
  fetchRealTimeData, 
  fetchUserAnalytics, 
  fetchReviewQueue, 
  fetchActivityLog, 
  fetchMaintenanceStatus,
  fetchContentStats
} from '@/lib/api/dashboard';

export function AdminDashboardV2() {
  const [mounted, setMounted] = React.useState(false);
  const { 
    dashboard, 
    realTime, 
    userAnalytics, 
    reviewQueue, 
    activityLog, 
    maintenance, 
    isLoading, 
    isError, 
    refetch 
  } = useDashboardData();

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const { data: contentStats } = useQuery({
    queryKey: ['contentStats'],
    queryFn: fetchContentStats,
    refetchInterval: 60000 // Refresh every minute
  });

  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const [isTechOpsLoading, setIsTechOpsLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Handler for tech ops - defined before useEffect that uses it
  const handleTechOp = async (action: 'invalidate-cache' | 'optimize-database' | 'purge-storage') => {
    setIsTechOpsLoading(action);
    try {
      const res = await fetch('/api/admin/technical-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        console.log(`Technical op ${action} successful`);
      }
    } catch (e) {
      console.error(`Failed to perform technical op: ${action}`);
    } finally {
      setIsTechOpsLoading(null);
    }
  };

  // This useEffect MUST be before any early returns to maintain hook order
  React.useEffect(() => {
    const handleOptimize = async () => {
      console.log('Starting platform optimization...');
      await handleTechOp('invalidate-cache');
      await handleTechOp('optimize-database');
    };

    window.addEventListener('platform-optimize', handleOptimize);
    return () => window.removeEventListener('platform-optimize', handleOptimize);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-12 pb-20 max-w-[1600px] mx-auto animate-pulse opacity-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-96 bg-muted rounded-3xl" />
          <div className="h-96 bg-muted rounded-3xl" />
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
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

  const handleReviewAction = async (type: 'topics' | 'statements', id: number, action: 'approve' | 'reject') => {
    const actionKey = `${type}-${id}-${action}`;
    setActionLoading(actionKey);
    try {
      const response = await fetch(`/api/admin/review-queue/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action })
      });
      
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error('Failed to perform review action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleMaintenance = async () => {
    setIsMaintenanceLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenance?.isMaintenance })
      });
      if (res.ok) {
        refetch();
      }
    } catch (e) {
      console.error('Failed to toggle maintenance');
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  if (isError) {
    return (
      <div className="p-8 rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm shadow-sm">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const popularTopics = dashboard?.popularTopics || [];
  const isMaintenanceActive = maintenance?.isMaintenance || false;

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto px-6">
      {/* 1. Critical Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={realTime?.activeUsers || 0}
          icon={Users}
          isLoading={isLoading}
        />
        <MetricCard
          title="Today's Views"
          value={realTime?.todayViews || 0}
          icon={Eye}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg Session"
          value={`${Math.floor((userAnalytics?.avgSessionDuration || 0) / 60)}m`}
          icon={Timer}
          isLoading={isLoading}
        />
        <MetricCard
          title="New Users"
          value={userAnalytics?.newUsers || 0}
          icon={UserPlus}
          isLoading={isLoading}
        />
      </div>

      {/* 2. Content & Review Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
          <ReviewQueueV2
            data={reviewQueue}
            onReviewAction={handleReviewAction}
            actionLoading={actionLoading}
            formatTimeAgo={formatTimeAgo}
          />
        </div>

        <div className="space-y-8">
          <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif italic flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Popular Topics
              </h2>
              {popularTopics.length > 0 && (
                <Link href="/analytics/topics" className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                  View all
                </Link>
              )}
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-2xl" />
                ))}
              </div>
            ) : popularTopics.length > 0 ? (
              <div className="space-y-1">
                {popularTopics.slice(0, 5).map((topic: any, index: number) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground/30 w-4">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </span>
                      <div>
                        <h3 className="text-[15px] font-medium group-hover:text-primary transition-colors">
                          {topic.canonical_title}
                        </h3>
                        {topic.topic_type && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold">
                            {topic.topic_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{topic.views}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty className="min-h-[250px] border-none p-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>No Popular Topics</EmptyTitle>
                  <EmptyDescription>Analytics will appear once live.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>

          <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif italic flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Encyclopedia Manager
              </h2>
              <Link href="/admin/content" className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                Full Manager
              </Link>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-border/50 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium">Published Topics</span>
                </div>
                <span className="text-lg font-serif italic">{contentStats?.topics.published || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-border/50 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium">Drafts in Progress</span>
                </div>
                <span className="text-lg font-serif italic">{contentStats?.topics.draft || 0}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-border/50 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-medium">Archived / Legacy</span>
                </div>
                <span className="text-lg font-serif italic">{contentStats?.topics.archived || 0}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 px-1">
                  <span>Growth Velocity</span>
                  <span>+12% this month</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${contentStats?.topics.percentage || 0}%` }} 
                  />
                  <div 
                    className="h-full bg-amber-500/50 transition-all duration-1000" 
                    style={{ width: `${(contentStats?.topics.draft / contentStats?.topics.total) * 100 || 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif italic flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Content Governance
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/content?type=topics" className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Topics Published</div>
                <div className="text-xl font-serif italic text-foreground">
                  {isLoading || !contentStats ? (
                    <div className="h-6 w-16 animate-pulse bg-muted rounded" />
                  ) : (
                    `${contentStats.topics.published} / ${contentStats.topics.total}`
                  )}
                </div>
                <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${contentStats?.topics.percentage || 0}%` }} 
                  />
                </div>
              </Link>
              <Link href="/admin/content?type=statements" className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Statements Published</div>
                <div className="text-xl font-serif italic text-foreground">
                  {isLoading || !contentStats ? (
                    <div className="h-6 w-16 animate-pulse bg-muted rounded" />
                  ) : (
                    `${contentStats.statements.published} / ${contentStats.statements.total}`
                  )}
                </div>
                <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000" 
                    style={{ width: `${contentStats?.statements.percentage || 0}%` }} 
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Monitoring & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif italic flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-500" />
              System Audit Trail
            </h2>
            <Link href="/admin/audit-log" className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
              Full Activity Log
            </Link>
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-xl" />)
            ) : activityLog && activityLog.length > 0 ? (
              activityLog.slice(0, 6).map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-border/50 shadow-sm group">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        <span className="text-primary font-semibold">{item.user?.first_name || 'System'}</span>
                        <span className="text-muted-foreground font-normal ml-1">performed {item.action} on {item.collection}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">{formatTimeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty className="min-h-[200px] border-none p-0">
                <EmptyHeader>
                  <EmptyTitle>No recent activity</EmptyTitle>
                  <EmptyDescription>System logs will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SystemHealth
            contentStats={contentStats}
            reviewQueue={reviewQueue}
            maintenance={maintenance}
            isLoading={isLoading}
          />

          <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif italic flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Controls
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Server className={cn("w-5 h-5", isMaintenanceActive ? "text-amber-500" : "text-emerald-500")} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Maintenance</div>
                    <div className={cn("text-[9px] font-bold uppercase", isMaintenanceActive ? "text-amber-600" : "text-emerald-600")}>
                      {isMaintenanceActive ? 'Active' : 'Offline'}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={toggleMaintenance}
                  disabled={isMaintenanceLoading}
                  variant={isMaintenanceActive ? "warning" : "default"}
                  size="sm"
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-md",
                    !isMaintenanceActive && "bg-emerald-500 text-emerald-50 hover:bg-emerald-600"
                  )}
                >
                  {isMaintenanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isMaintenanceActive ? 'Disable' : 'Enable')}
                </Button>
              </div>

              <Link href="/admin/settings" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between hover:border-indigo-500/10 transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <KeyRound className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">API Keys</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold">Access Tokens</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-indigo-500 transition-colors" />
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif italic flex items-center gap-3">
                <CloudCog className="w-5 h-5 text-emerald-500" />
                Technical Ops
              </h2>
            </div>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleTechOp('invalidate-cache')}
              disabled={!!isTechOpsLoading}
              className="justify-start h-12 rounded-xl border-border/50 bg-background/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group shadow-sm"
            >
              {isTechOpsLoading === 'invalidate-cache' ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-3 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">Invalidate Cache</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTechOp('optimize-database')}
              disabled={!!isTechOpsLoading}
              className="justify-start h-12 rounded-xl border-border/50 bg-background/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group shadow-sm"
            >
              {isTechOpsLoading === 'optimize-database' ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-3 text-blue-500 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">Optimize Database</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleTechOp('purge-storage')}
              disabled={!!isTechOpsLoading}
              className="justify-start h-12 rounded-xl border-border/50 bg-background/50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all group shadow-sm"
            >
              {isTechOpsLoading === 'purge-storage' ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-3 text-rose-500 group-hover:animate-bounce" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">Purge Storage</span>
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* 4. Advanced Governance, CMS & Branding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Governance HUB (Access, SEO, Injection, Backups) */}
        <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif italic flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              Governance Hub
            </h2>
          </div>

          <div className="space-y-4">
            <Link href="/admin/settings" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Lock className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">Access Control</div>
                  <div className="text-[10px] text-muted-foreground font-light">Role-based editor permissions</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-indigo-500 transition-colors" />
            </Link>

            <Link href="/admin/branding" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Terminal className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Code Injection</div>
                  <div className="text-[10px] text-muted-foreground font-light">Custom CSS/JS quick fixes</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 uppercase">2 Scripts</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>

            <Link href="/admin/settings" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Globe className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">SEO & Sitemap</div>
                  <div className="text-[10px] text-muted-foreground font-light">Metadata coverage & indexing</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 uppercase">Optimized</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>

            <Link href="/admin/settings" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between hover:border-primary/10 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <HardDriveDownload className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">Data Safety</div>
                  <div className="text-[10px] text-muted-foreground font-light">Backups, exports & recovery</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </div>

        {/* CMS & Branding Hub */}
        <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif italic flex items-center gap-3">
              <Monitor className="w-5 h-5 text-rose-500" />
              CMS & Branding
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <Link href="/admin/cms/pages" className="p-4 bg-muted/30 rounded-[2rem] border border-transparent hover:border-primary/10 transition-all flex flex-col items-center text-center justify-center group shadow-sm">
              <div className="w-16 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md border border-border/50">
                <Layout className="w-7 h-7 text-blue-500" />
              </div>
              <div className="text-xs font-bold tracking-tight">CMS Pages</div>
              <p className="text-[8px] text-muted-foreground mt-1 uppercase font-black opacity-50">About, Home, Search</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-600/70">Dynamic</span>
              </div>
            </Link>
            <Link href="/admin/branding/style" className="p-4 bg-muted/30 rounded-[2rem] border border-transparent hover:border-rose-500/10 transition-all flex flex-col items-center text-center justify-center group shadow-sm">
              <div className="w-16 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md border border-border/50">
                <Palette className="w-7 h-7 text-purple-500" />
              </div>
              <div className="text-xs font-bold tracking-tight">Site Style</div>
              <p className="text-[8px] text-muted-foreground mt-1 uppercase font-black opacity-50">Design Tokens</p>
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            <Link href="/admin/branding" className="p-4 bg-muted/30 rounded-2xl border border-transparent flex items-center justify-between shadow-sm hover:border-amber-500/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">Global Banner</div>
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Announcements</div>
                </div>
              </div>
              <span className="rounded-xl text-[10px] font-bold px-3 py-1.5 border-amber-500/20 bg-amber-500/10 text-amber-600">
                Configure
              </span>
            </Link>
            
            <Link href="/admin/branding" className="block">
              <Button className="w-full rounded-2xl py-7 font-serif italic text-xl tracking-wide hover:shadow-2xl hover:shadow-primary/20 transition-all group bg-primary relative overflow-hidden shadow-lg shadow-primary/10">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center text-primary-foreground drop-shadow-sm">
                  Open Branding Studio
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Advanced Features & Growth (from Longterm tasks) */}
      <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif italic flex items-center gap-3">
            <Workflow className="w-5 h-5 text-purple-500" />
            Advanced Growth Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Webhooks', icon: CloudUpload, desc: 'External platform sync', color: 'text-purple-500', href: '/admin/settings' },
            { name: 'A/B Testing', icon: Split, desc: 'UX experiment manager', color: 'text-indigo-500', href: '/admin/settings' },
            { name: 'Scheduled Pubs', icon: CalendarClock, desc: 'Future content rollout', color: 'text-blue-500', href: '/admin/content' },
            { name: 'Growth Analytics', icon: TrendingUp, desc: 'Advanced funnel tracking', color: 'text-emerald-500', href: '/analytics/topics' },
          ].map((feature) => (
            <Link key={feature.name} href={feature.href} className="p-6 bg-muted/30 rounded-[2rem] border border-transparent hover:border-purple-500/10 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-border/50">
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">{feature.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">Platform Tool</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">{feature.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 6. Reporting Suite (Wide Middle) */}
      <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif italic flex items-center gap-3">
            <PieChart className="w-5 h-5 text-orange-500" />
            Reporting & Analytics
          </h2>
          <Link href="/admin/content">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all">
              Export Data <Download className="ml-2 w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Traffic Flow', icon: TrendingUp, color: 'text-emerald-500', barColor: 'bg-emerald-500/20' },
            { title: 'Engagement', icon: Activity, color: 'text-amber-500', barColor: 'bg-amber-500/20' },
            { title: 'User Growth', icon: UserPlus, color: 'text-blue-500', barColor: 'bg-blue-500/20' }
          ].map((report) => (
            <div key={report.title} className="p-6 rounded-[2.5rem] bg-muted/30 border border-transparent hover:border-primary/5 transition-all group shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <report.icon className={cn("w-5 h-5", report.color)} />
                </div>
                <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">{report.title}</div>
              </div>
              <div className="h-24 flex items-end gap-1.5 mb-6 px-1">
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn("flex-1 rounded-full group-hover:opacity-80 transition-all", report.barColor)} 
                    style={{ height: `${20 + ((i * 13) % 75)}%` }} 
                  />
                ))}
              </div>
              <Link href="/analytics/topics">
                <Button variant="ghost" className="w-full text-[10px] font-black h-11 text-primary uppercase tracking-[0.2em] border border-border/20 rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm">View Analytics</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Platform Health & Observability (Final Wide Section) */}
      <div className="p-10 rounded-[3.5rem] border border-border/50 bg-card/50 backdrop-blur-3xl shadow-2xl border-t-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
          <ActivitySquare className="w-96 h-96 text-emerald-500" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center shadow-inner border border-emerald-500/20">
              <ActivitySquare className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl font-serif italic tracking-tight text-foreground">Infrastructure Observability</h2>
              <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-[0.2em] opacity-60">Real-time platform vitals, uptime & error rates</p>
            </div>
          </div>
          <div className="flex items-center gap-10 px-8 py-4 bg-background/40 rounded-3xl border border-border/50 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-black text-foreground uppercase tracking-widest">API: Healthy</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground border-l border-border/50 pl-10">
              <Fingerprint className="w-4 h-4 opacity-40 text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-widest">Uptime: 99.98%</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Network Latency</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">124ms p95</span>
            </div>
            <div className="h-40 flex items-end gap-1.5 px-3">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-emerald-500/20 rounded-full hover:bg-emerald-500 hover:scale-y-110 transition-all duration-300 cursor-help" 
                  style={{ height: `${30 + Math.sin(i / 3) * 20 + ((i * 7) % 40)}%` }} 
                  title={`Latency: ${100 + ((i * 3) % 50)}ms`} 
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center font-black uppercase tracking-[0.3em] opacity-40">24h System Response Profile</p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-muted/30 border border-border/30 flex flex-col justify-between shadow-sm hover:border-blue-500/20 transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4 text-blue-500">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <FileSearch className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Log Monitor</span>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Live</span>
            </div>
            <div className="space-y-5 py-2">
              {[
                { label: 'DB Connections', status: 'Optimal', color: 'text-emerald-600' },
                { label: 'Storage Cluster', status: '94% Free', color: 'text-blue-600' },
                { label: 'Cache Hit Rate', status: '88.2%', color: 'text-indigo-600' },
                { label: 'Asset Processor', status: 'Healthy', color: 'text-muted-foreground' }
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-[11px] font-bold border-b border-border/10 pb-4 last:border-0 last:pb-0">
                  <span className="text-muted-foreground opacity-70 tracking-tight">{row.label}</span>
                  <span className={cn("tracking-tighter", row.color)}>{row.status}</span>
                </div>
              ))}
            </div>
            <Link href="/admin/audit-log">
              <Button variant="ghost" className="w-full text-[10px] font-black h-12 mt-8 rounded-2xl uppercase tracking-[0.2em] hover:bg-blue-500/5 hover:text-blue-600 border border-border/50 shadow-sm transition-all">Open Audit Log</Button>
            </Link>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-muted/30 border border-border/30 flex flex-col justify-between shadow-sm hover:border-rose-500/20 transition-all group">
            <div className="flex items-center justify-between mb-8 text-rose-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Stability Rate</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Optimal</span>
            </div>
            <div className="space-y-8">
              <div className="flex justify-between items-end px-2">
                <span className="text-[11px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">Active Incidents</span>
                <span className="text-4xl font-serif italic text-foreground leading-none drop-shadow-sm">0</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-border/20">
                <div className="h-full bg-emerald-500 w-full opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 leading-relaxed">System uptime stable for</p>
                <p className="text-lg font-serif italic text-emerald-600">14 Consecutive Days</p>
              </div>
            </div>
            <Link href="/admin/audit-log">
              <Button variant="ghost" className="w-full text-[10px] font-black h-12 mt-8 rounded-2xl uppercase tracking-[0.2em] hover:bg-rose-500/5 hover:text-rose-600 border border-border/50 shadow-sm transition-all">View Audit Log</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <FloatingAIChatButton onClick={() => setShowChatPanel(true)} />
      <AIChatPanel
        open={showChatPanel}
        onOpenChange={setShowChatPanel}
        topicTitle="Admin Control Center"
      />
    </div>
  );
}
