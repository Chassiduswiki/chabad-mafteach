'use client';

import { useState } from 'react';
import { trackTranslationFeedback } from '@/lib/analytics';
import { X, CheckCircle2, Star, StarOff, Info, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TranslationFeedbackProps {
  contentType: 'topic' | 'paragraph' | 'statement';
  contentId: string;
  contentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TranslationFeedback({ contentType, contentId, contentName, isOpen, onClose }: TranslationFeedbackProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [aspects, setAspects] = useState({
    accuracy: null as 1 | 2 | 3 | 4 | 5 | null,
    readability: null as 1 | 2 | 3 | 4 | 5 | null,
    completeness: null as 1 | 2 | 3 | 4 | 5 | null,
  });
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating) return;

    trackTranslationFeedback(
      contentType,
      contentId,
      rating,
      {
        accuracy: aspects.accuracy || undefined,
        readability: aspects.readability || undefined,
        completeness: aspects.completeness || undefined,
      },
      feedback || undefined
    );

    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  const handleAspectRating = (aspect: keyof typeof aspects, value: 1 | 2 | 3 | 4 | 5) => {
    setAspects(prev => ({ ...prev, [aspect]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-primary/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {submitted ? (
          <div className="py-16 px-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Thank you!</h3>
              <p className="text-muted-foreground mt-2">Your feedback helps improve translations for the entire community.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-primary/5 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Translation Review</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest truncate max-w-[300px]">
                  {contentName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-background/80"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {/* Overall Rating */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Overall Quality
                </label>
                <div className="flex justify-center gap-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
                      className="group transition-all duration-200 active:scale-90"
                    >
                      {rating && star <= rating ? (
                        <Star className="h-8 w-8 text-yellow-400 fill-yellow-400 transition-colors group-hover:scale-110" />
                      ) : (
                        <Star className="h-8 w-8 text-muted-foreground/30 transition-colors group-hover:text-yellow-400/50" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Aspects */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Technical Breakdown
                </label>
                <div className="space-y-3">
                  {(['accuracy', 'readability', 'completeness'] as const).map((aspect) => (
                    <div key={aspect} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
                      <span className="text-sm font-medium capitalize flex items-center gap-2">
                        {aspect === 'accuracy' && <Info className="h-3.5 w-3.5 text-blue-500" />}
                        {aspect === 'readability' && <Send className="h-3.5 w-3.5 text-purple-500" />}
                        {aspect === 'completeness' && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                        {aspect}
                      </span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleAspectRating(aspect, num as 1 | 2 | 3 | 4 | 5)}
                            className={cn(
                              "w-7 h-7 text-[10px] font-bold rounded-lg transition-all",
                              aspects[aspect] === num
                                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-110"
                                : "bg-background border border-border/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Feedback */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Specific Observations (Optional)
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what specifically could be improved..."
                  className="min-h-[100px] bg-muted/20 border-border/50 rounded-xl resize-none focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border/50 bg-muted/10 flex items-center justify-end gap-3 mt-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                className="font-bold text-xs uppercase"
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rating}
                className="rounded-full px-8 font-bold text-xs uppercase shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Send Contribution
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
