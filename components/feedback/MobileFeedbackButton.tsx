'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Send, ChevronUp, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileFeedbackButtonProps {
  topicId: string;
  topicTitle: string;
  section?: string;
  content?: string;
  className?: string;
}

interface FeedbackData {
  type: 'content_issue' | 'suggestion' | 'question' | 'technical_bug';
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  section?: string;
  content?: string;
}

export function MobileFeedbackButton({ 
  topicId, 
  topicTitle, 
  section, 
  content,
  className = "" 
}: MobileFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'content_issue',
    category: '',
    message: '',
    priority: 'medium',
    section,
    content
  });

  const feedbackTypes = [
    { value: 'content_issue', label: 'Content Issue', icon: '⚠️', color: 'bg-orange-500' },
    { value: 'suggestion', label: 'Suggestion', icon: '💡', color: 'bg-blue-500' },
    { value: 'question', label: 'Question', icon: '❓', color: 'bg-purple-500' },
    { value: 'technical_bug', label: 'Technical Bug', icon: '🐛', color: 'bg-red-500' }
  ];

  const contentCategories = [
    'Accuracy Issue',
    'Missing Information', 
    'Unclear Explanation',
    'Translation Error',
    'Citation Problem',
    'Typo/Grammar',
    'Source Reference',
    'Historical Context',
    'Definition Clarity',
    'Practical Application'
  ];

  const handleSubmit = async () => {
    if (!feedback.message.trim() || !feedback.category) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId,
          topicTitle,
          ...feedback,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus('idle');
          setFeedback({
            type: 'content_issue',
            category: '',
            message: '',
            priority: 'medium',
            section,
            content
          });
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentType = feedbackTypes.find(t => t.value === feedback.type);

  return (
    <div className={cn("fixed bottom-24 right-6 z-[101]", className)}>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="rounded-full w-14 h-14 shadow-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-300 hover:scale-110 group"
          title="Report an issue"
        >
          <AlertTriangle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        </Button>
      )}

      {/* Feedback Panel */}
      {isOpen && (
        <div className="bg-background/98 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl w-[320px] sm:w-[360px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-5 border-b border-border/50 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", currentType?.color)} />
                <h3 className="font-bold text-foreground tracking-tight text-base">Send Feedback</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-background/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-2 truncate">
              {topicTitle}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {submitStatus === 'success' ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Thank you!</h4>
                  <p className="text-sm text-muted-foreground px-4">Your insights help us build a more accurate Mafteach.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Type Selection */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setFeedback(prev => ({ ...prev, type: type.value as any }))}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left",
                          feedback.type === type.value 
                            ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                            : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <span className="text-sm">{type.icon}</span>
                        <span className="text-[11px] font-bold">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category & Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      Category
                    </label>
                    <Select
                      value={feedback.category}
                      onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="h-10 bg-muted/30 border-border/50 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contentCategories.map((category) => (
                          <SelectItem key={category} value={category} className="text-xs">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      Priority
                    </label>
                    <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 h-10">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFeedback(prev => ({ ...prev, priority: p }))}
                          className={cn(
                            "flex-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-tighter",
                            feedback.priority === p 
                              ? p === 'high' ? "bg-red-500 text-white shadow-sm" : "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground/60 hover:text-muted-foreground"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      Description
                    </label>
                    <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                      {feedback.message.length}/500
                    </span>
                  </div>
                  <Textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Provide specific details about what could be improved..."
                    className="min-h-[120px] resize-none bg-muted/30 border-border/50 text-sm focus-visible:ring-primary/20"
                    maxLength={500}
                  />
                </div>

                {/* Context - Compact */}
                {(section || content) && (
                  <div className="bg-primary/[0.03] border border-primary/5 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary/60">
                      <ChevronDown className="h-2.5 w-2.5" />
                      Attachment Context
                    </div>
                    {section && <div className="text-[11px] font-medium truncate">Section: {section}</div>}
                    {content && <div className="text-[10px] text-muted-foreground italic truncate">"{content}"</div>}
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 animate-in shake-1">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-[11px] font-medium">Failed to send. Please try again.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 pt-0 mt-auto">
            <Button
              onClick={handleSubmit}
              disabled={!feedback.message.trim() || !feedback.category || isSubmitting || submitStatus === 'success'}
              className="w-full h-11 rounded-xl font-bold text-xs shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending Report...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Contribution
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
