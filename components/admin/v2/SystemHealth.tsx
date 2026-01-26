'use client';

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Circle, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck,
  Activity,
  Database,
  Globe,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  percentage: number;
  status: 'optimal' | 'warning' | 'critical';
  suggestion?: string;
}

interface SystemHealthProps {
  contentStats?: any;
  reviewQueue?: any;
  maintenance?: any;
  isLoading?: boolean;
  className?: string;
}

export function SystemHealth({
  contentStats,
  reviewQueue,
  maintenance,
  isLoading,
  className
}: SystemHealthProps) {
  const calculateHealth = () => {
    if (!contentStats || !reviewQueue) return null;

    const metrics: HealthMetric[] = [];
    
    // 1. Content Coverage (Topics)
    const topicCoverage = contentStats.topics.percentage || 0;
    metrics.push({
      label: 'Topic Coverage',
      percentage: topicCoverage,
      status: topicCoverage >= 80 ? 'optimal' : topicCoverage >= 50 ? 'warning' : 'critical',
      suggestion: topicCoverage < 80 ? 'Generate missing content for 12 key topics' : undefined
    });

    // 2. Statement Integrity (Tagged vs Total)
    const stmtIntegrity = contentStats.statements.percentage || 0;
    metrics.push({
      label: 'Citation Integrity',
      percentage: stmtIntegrity,
      status: stmtIntegrity >= 90 ? 'optimal' : stmtIntegrity >= 70 ? 'warning' : 'critical',
      suggestion: stmtIntegrity < 90 ? 'Review untagged statements in the queue' : undefined
    });

    // 3. Review Efficiency
    const totalPending = reviewQueue.summary?.totalPending || 0;
    const reviewScore = Math.max(0, 100 - (totalPending * 5));
    metrics.push({
      label: 'Editorial Velocity',
      percentage: reviewScore,
      status: reviewScore >= 80 ? 'optimal' : reviewScore >= 50 ? 'warning' : 'critical',
      suggestion: totalPending > 0 ? `Process ${totalPending} items in the review queue` : undefined
    });

    // 4. Infrastructure (Simulated for now based on maintenance mode)
    const infraScore = maintenance?.isMaintenance ? 50 : 100;
    metrics.push({
      label: 'Infrastructure',
      percentage: infraScore,
      status: infraScore === 100 ? 'optimal' : 'warning',
      suggestion: maintenance?.isMaintenance ? 'System is in maintenance mode' : undefined
    });

    const overall = Math.round(metrics.reduce((acc, m) => acc + m.percentage, 0) / metrics.length);

    return {
      overall,
      metrics,
      suggestions: metrics.filter(m => m.suggestion).map(m => m.suggestion!)
    };
  };

  const health = calculateHealth();

  if (isLoading || !health) {
    return (
      <div className={cn("p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm animate-pulse", className)}>
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (percentage >= 50) return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Circle className="h-4 w-4 text-rose-500" />;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-serif italic">Platform Integrity</h2>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-4xl font-serif italic",
              health.overall >= 80 ? "text-emerald-600" : health.overall >= 50 ? "text-amber-600" : "text-rose-600"
            )}>
              {health.overall}%
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Health Score</div>
          </div>
        </div>

        <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-10 shadow-inner">
          <div 
            className={cn("h-full transition-all duration-1000", getProgressColor(health.overall))}
            style={{ width: `${health.overall}%` }}
          />
        </div>

        <div className="space-y-6">
          {health.metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.percentage)}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <span className="text-xs font-bold">{metric.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-700", getProgressColor(metric.percentage))}
                  style={{ width: `${metric.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-10 rounded-2xl h-12 text-[10px] font-black uppercase tracking-[0.2em] border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all shadow-sm"
          onClick={() => window.dispatchEvent(new CustomEvent('platform-optimize'))}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          One-Click Optimize
        </Button>
      </div>

      {/* Proactive Intelligence */}
      {health.suggestions.length > 0 && (
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Admin Intelligence</h4>
          </div>
          <ul className="space-y-4">
            {health.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30 mt-1.5 shrink-0" />
                <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">
                  {suggestion}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
