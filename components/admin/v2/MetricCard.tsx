'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
  isLoading?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  isLoading 
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-5 w-20 bg-muted rounded mb-4"></div>
          <div className="h-8 w-16 bg-muted rounded mb-2"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
      "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 group cursor-pointer"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
          "bg-primary/5"
        )}>
          <Icon className={cn("w-5 h-5", "text-primary/70")} />
        </div>
        {change !== undefined && trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2 py-1 rounded-full",
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 
            trend === 'down' ? 'bg-rose-500/10 text-rose-600' : 
            'bg-muted text-muted-foreground'
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-serif italic text-foreground mb-1">{value}</div>
        <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">{title}</div>
      </div>
    </div>
  );
}
