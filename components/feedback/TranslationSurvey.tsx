'use client';

import { useState } from 'react';
import { trackTranslationSurvey } from '@/lib/analytics';
import { X, ChevronRight, ChevronLeft, Sparkles, Languages, BookOpen, Brain, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TranslationSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: string;
}

export function TranslationSurvey({ isOpen, onClose, triggerContext }: TranslationSurveyProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responses, setResponses] = useState({
    primaryLanguage: '' as 'he' | 'en' | '',
    hebrewProficiency: '' as 'none' | 'basic' | 'intermediate' | 'advanced' | 'native' | '',
    usagePurpose: '' as 'study' | 'research' | 'casual' | 'teaching' | '',
    topicTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',
    contentTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',
    citationTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',
    preferredDisplay: '' as 'english_first' | 'hebrew_first' | 'bilingual' | 'auto' | '',
    machineTranslations: '' as 'acceptable' | 'prefer_human' | 'only_human' | '',
    biggestBarrier: '' as 'reading_hebrew' | 'understanding_concepts' | 'finding_content' | 'other' | '',
    additionalComments: '',
  });

  const updateResponse = (field: keyof typeof responses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const userContext = {
      primaryLanguage: responses.primaryLanguage as 'he' | 'en' | undefined,
      hebrewProficiency: responses.hebrewProficiency as 'none' | 'basic' | 'intermediate' | 'advanced' | 'native' | undefined,
      usagePurpose: responses.usagePurpose as 'study' | 'research' | 'casual' | 'teaching' | undefined,
    };

    trackTranslationSurvey('translation_priority', responses, userContext);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setTimeout(onClose, 2000);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  const isStepComplete = () => {
    if (step === 1) return !!(responses.primaryLanguage && responses.hebrewProficiency && responses.usagePurpose);
    if (step === 2) return !!(responses.topicTranslations && responses.contentTranslations);
    if (step === 3) return !!(responses.preferredDisplay && responses.machineTranslations);
    return true;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-primary/10 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-fit max-h-[90vh]">
        {isSubmitted ? (
          <div className="py-20 px-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-emerald-500/10 p-5 rounded-full text-emerald-500">
              <CheckCircle2 className="h-16 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Contribution Received</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">Your feedback helps us map out the future of Chassidic learning.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 border-b border-border/50 bg-primary/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <Languages className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Translation Roadmap</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-background/80">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-500",
                        num === step ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : num < step ? "bg-primary/40" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  <span>Step {step} of 4</span>
                  <span>{Math.round((step / 4) * 100)}% Complete</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto scrollbar-thin">
              {/* Step 1: User Context */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Languages className="h-3.5 w-3.5" />
                      Primary Language
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'en', label: 'English' },
                        { value: 'he', label: 'Hebrew' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('primaryLanguage', value)}
                          className={cn(
                            "p-4 rounded-2xl border text-sm font-bold transition-all text-center",
                            responses.primaryLanguage === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5" />
                      Hebrew Proficiency
                    </label>
                    <div className="grid gap-2">
                      {[
                        { value: 'none', label: 'None - Cannot read Hebrew' },
                        { value: 'basic', label: 'Basic - Read with difficulty' },
                        { value: 'intermediate', label: 'Intermediate - Read slowly' },
                        { value: 'advanced', label: 'Advanced - Read comfortably' },
                        { value: 'native', label: 'Native - Primary language' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('hebrewProficiency', value)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-xs font-medium transition-all text-left",
                            responses.hebrewProficiency === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5" />
                      Usage Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'study', label: 'Personal Study' },
                        { value: 'research', label: 'Academic Research' },
                        { value: 'casual', label: 'Casual Browsing' },
                        { value: 'teaching', label: 'Teaching' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('usagePurpose', value)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-[11px] font-bold uppercase transition-all text-center",
                            responses.usagePurpose === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Priorities */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground">How important are translations for...?</h4>
                    {[
                      { field: 'topicTranslations', label: 'Topic Names (e.g., "Tzadik" → "Righteous")' },
                      { field: 'contentTranslations', label: 'Core Content (Paragraphs & Statements)' },
                      { field: 'citationTranslations', label: 'Source Citations & References' },
                    ].map(({ field, label }) => (
                      <div key={field} className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'critical', label: 'Critical' },
                            { value: 'important', label: 'High' },
                            { value: 'nice', label: 'Medium' },
                            { value: 'unnecessary', label: 'Low' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateResponse(field as any, opt.value)}
                              className={cn(
                                "py-2 rounded-lg border text-[10px] font-bold uppercase transition-all",
                                responses[field as keyof typeof responses] === opt.value
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Display Mode</label>
                    <div className="grid gap-3">
                      {[
                        { value: 'english_first', label: 'English Primary (Hebrew Secondary)' },
                        { value: 'hebrew_first', label: 'Hebrew Primary (English Secondary)' },
                        { value: 'bilingual', label: 'Parallel Display (Side-by-side)' },
                        { value: 'auto', label: 'Smart Auto-detection' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('preferredDisplay', value)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                            responses.preferredDisplay === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Machine Translation Acceptance</label>
                    <div className="grid gap-3">
                      {[
                        { value: 'acceptable', label: 'Always (Better than no translation)' },
                        { value: 'prefer_human', label: 'Hybrid (Prefer human, allow machine)' },
                        { value: 'only_human', label: 'Exclusive (Human-verified only)' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('machineTranslations', value)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                            responses.machineTranslations === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Barriers */}
              {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Main Accessibility Barrier</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'reading_hebrew', label: 'Reading Script' },
                        { value: 'understanding_concepts', label: 'Concept Complexity' },
                        { value: 'finding_content', label: 'Finding Content' },
                        { value: 'other', label: 'Other' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateResponse('biggestBarrier', value)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-[11px] font-bold uppercase transition-all text-center",
                            responses.biggestBarrier === value 
                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vision & Feedback</label>
                    <Textarea
                      value={responses.additionalComments}
                      onChange={(e) => updateResponse('additionalComments', e.target.value)}
                      placeholder="How can we better support your learning experience?"
                      className="min-h-[120px] bg-muted/20 border-border/50 rounded-2xl resize-none focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-border/50 bg-muted/10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={step === 1 ? onClose : prevStep}
                className="font-bold text-xs uppercase gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? 'Discard' : 'Back'}
              </Button>

              {step < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepComplete()}
                  className="rounded-full px-8 font-bold text-xs uppercase gap-2 shadow-lg shadow-primary/10"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-full px-10 font-bold text-xs uppercase gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Complete Survey
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
