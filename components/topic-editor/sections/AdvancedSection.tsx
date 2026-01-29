'use client';

import React from 'react';
import { Wand2, Plus, Trash2 } from 'lucide-react';
import { AccordionSection } from './AccordionSection';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { TranslateButton } from '@/components/editor/TranslateButton';
import { GenerateSectionButton } from '@/components/editor/GenerateSectionButton';
import { TopicFormData } from '../types';

interface TopicContext {
  title: string;
  title_en?: string;
  type: string;
  description: string;
  slug: string;
}

interface AdvancedSectionProps {
  formData: TopicFormData;
  topicId?: number;
  topicContext: TopicContext;
  editorsRef: React.MutableRefObject<Record<string, any>>;
  onFieldChange: (field: keyof TopicFormData, value: any) => void;
  onEditorUpdate: (field: keyof TopicFormData, content: string) => void;
  onGenerateField?: (fieldId: string) => void;
  defaultOpen?: boolean;
}

export function AdvancedSection({
  formData,
  topicId,
  topicContext,
  editorsRef,
  onFieldChange,
  onEditorUpdate,
  onGenerateField,
  defaultOpen = false,
}: AdvancedSectionProps) {
  const hasCharts = Boolean(formData.charts && formData.charts.length > 10);
  const hasConfusions = Boolean(formData.common_confusions && formData.common_confusions.length > 0);
  const isComplete = hasCharts || hasConfusions;
  const isEmpty = !hasCharts && !hasConfusions;

  return (
    <AccordionSection
      id="advanced"
      title="Advanced Content"
      defaultOpen={defaultOpen}
      isComplete={isComplete}
      isEmpty={isEmpty}
      helpText="Charts, tables, and FAQ-style common confusions"
    >
      <div className="space-y-6">
        {/* Charts & Tables */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Charts & Tables
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="charts"
                currentContent={formData.charts}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('charts', content)}
              />
              <TranslateButton
                content={formData.charts || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('charts', translation)}
                topicId={topicId}
                field="charts"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Use the Table tool in the editor or start with "Reference Chart" for advanced rendering
          </p>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[120px]"
              onEditorReady={(editor) => {
                if (formData.charts && editor) {
                  editor.commands.setContent(formData.charts);
                }
                editorsRef.current['charts'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('charts', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>

        {/* Common Confusions */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Common Confusions / FAQ
          </label>
          <div className="space-y-3">
            {(formData.common_confusions || []).map((item, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50 relative group">
                <button
                  onClick={() => {
                    const newConfusions = [...(formData.common_confusions || [])];
                    newConfusions.splice(index, 1);
                    onFieldChange('common_confusions', newConfusions);
                  }}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                        Question
                      </label>
                      <TranslateButton
                        content={item.question}
                        targetLanguage="en"
                        onTranslation={(translation) => {
                          const newConfusions = [...(formData.common_confusions || [])];
                          newConfusions[index] = { ...item, question: translation };
                          onFieldChange('common_confusions', newConfusions);
                        }}
                        className="h-6"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const newConfusions = [...(formData.common_confusions || [])];
                        newConfusions[index] = { ...item, question: e.target.value };
                        onFieldChange('common_confusions', newConfusions);
                      }}
                      placeholder="Question (e.g., Is this the same as... ?)"
                      className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                        Answer
                      </label>
                      <TranslateButton
                        content={item.answer}
                        targetLanguage="en"
                        onTranslation={(translation) => {
                          const newConfusions = [...(formData.common_confusions || [])];
                          newConfusions[index] = { ...item, answer: translation };
                          onFieldChange('common_confusions', newConfusions);
                        }}
                        className="h-6"
                      />
                    </div>
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newConfusions = [...(formData.common_confusions || [])];
                        newConfusions[index] = { ...item, answer: e.target.value };
                        onFieldChange('common_confusions', newConfusions);
                      }}
                      placeholder="Answer..."
                      className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                const newConfusions = [...(formData.common_confusions || []), { question: '', answer: '' }];
                onFieldChange('common_confusions', newConfusions);
              }}
              className="w-full py-2 border-2 border-dashed border-border rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Confusion/FAQ
            </button>
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}

export default AdvancedSection;
