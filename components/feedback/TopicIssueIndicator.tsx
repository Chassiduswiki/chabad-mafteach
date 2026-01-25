'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageSquare, ChevronDown, ChevronUp, Clock, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TopicIssue {
  id: string;
  type: 'content_issue' | 'suggestion' | 'question' | 'technical_bug';
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
}

interface TopicIssueIndicatorProps {
  topicId: string;
  className?: string;
  showDetails?: boolean;
}

export function TopicIssueIndicator({ 
  topicId, 
  className = "",
  showDetails = false 
}: TopicIssueIndicatorProps) {
  const [issues, setIssues] = useState<TopicIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`/api/feedback/topic/${topicId}/issues`);
        if (response.ok) {
          const data = await response.json();
          setIssues(data.issues || []);
        }
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [topicId]);

  const activeIssues = issues.filter(issue => issue.status !== 'resolved');
  if (activeIssues.length === 0 && !isLoading) return null;

  const highPriorityCount = activeIssues.filter(issue => issue.priority === 'high').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_issue': return '⚠️';
      case 'suggestion': return '💡';
      case 'question': return '❓';
      case 'technical_bug': return '🐛';
      default: return '📝';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50", className)}>
        <div className="h-4 w-4 bg-muted rounded-full" />
        <div className="h-3 bg-muted rounded w-24" />
      </div>
    );
  }

  return (
    <div className={cn("group", className)}>
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-l-4",
        highPriorityCount > 0 ? "border-l-red-500 shadow-red-500/5" : "border-l-orange-400 shadow-orange-500/5",
        "bg-background/50 backdrop-blur-sm border-y border-r border-border/50"
      )}>
        <div 
          className="p-3 flex items-center justify-between cursor-pointer select-none"
          onClick={() => showDetails && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              highPriorityCount > 0 ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
            )}>
              <AlertTriangle className={cn("h-4 w-4", highPriorityCount > 0 && "animate-pulse")} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">
                {activeIssues.length} Quality Issue{activeIssues.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {highPriorityCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-tight">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {highPriorityCount} Urgent
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-medium">
                  Reported by community
                </span>
              </div>
            </div>
          </div>
          
          {showDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {showDetails && isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-3 animate-in slide-in-from-top-2 duration-300">
            {activeIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-muted/30 rounded-xl p-3 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0" title={issue.type}>{getTypeIcon(issue.type)}</span>
                    <h4 className="text-xs font-bold text-foreground">{issue.category}</h4>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[9px] font-bold uppercase tracking-widest h-5", getPriorityStyles(issue.priority))}
                  >
                    {issue.priority}
                  </Badge>
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-relaxed italic mb-3 line-clamp-3">
                  "{issue.message}"
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {issue.status}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 hover:text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
