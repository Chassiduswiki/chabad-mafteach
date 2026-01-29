'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';
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

interface SupplementarySectionProps {
  formData: TopicFormData;
  topicId?: number;
  topicContext: TopicContext;
  editorsRef: React.MutableRefObject<Record<string, any>>;
  onEditorUpdate: (field: keyof TopicFormData, content: string) => void;
  onGenerateField?: (fieldId: string) => void;
  defaultOpen?: boolean;
}

export function SupplementarySection({
  formData,
  topicId,
  topicContext,
  editorsRef,
  onEditorUpdate,
  onGenerateField,
  defaultOpen = false,
}: SupplementarySectionProps) {
  const hasTakeaways = Boolean(formData.practical_takeaways && formData.practical_takeaways.length > 10);
  const hasHistory = Boolean(formData.historical_context && formData.historical_context.length > 10);
  const hasMashal = Boolean(formData.mashal && formData.mashal.length > 10);
  const hasNimshal = Boolean(formData.global_nimshal && formData.global_nimshal.length > 10);

  const filledCount = [hasTakeaways, hasHistory, hasMashal, hasNimshal].filter(Boolean).length;
  const isComplete = filledCount >= 3;
  const isEmpty = filledCount === 0;

  const aiActions = [];
  if (!hasTakeaways && onGenerateField) {
    aiActions.push({
      label: 'Generate Takeaways',
      onClick: () => onGenerateField('practical_takeaways'),
      icon: Wand2,
    });
  }

  return (
    <AccordionSection
      id="supplementary"
      title="Supplementary Content"
      defaultOpen={defaultOpen}
      isComplete={isComplete}
      isEmpty={isEmpty}
      helpText="Additional content: practical applications, historical context, and illustrative parables"
      badge={`${filledCount}/4`}
      aiActions={aiActions}
    >
      <div className="space-y-6">
        {/* Practical Takeaways */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Practical Takeaways
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="practical_takeaways"
                currentContent={formData.practical_takeaways}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('practical_takeaways', content)}
              />
              <TranslateButton
                content={formData.practical_takeaways || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('practical_takeaways', translation)}
                topicId={topicId}
                field="practical_takeaways"
              />
            </div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[120px]"
              onEditorReady={(editor) => {
                if (formData.practical_takeaways && editor) {
                  editor.commands.setContent(formData.practical_takeaways);
                }
                editorsRef.current['practical_takeaways'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('practical_takeaways', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>

        {/* Historical Context */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Historical Context
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="historical_context"
                currentContent={formData.historical_context}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('historical_context', content)}
              />
              <TranslateButton
                content={formData.historical_context || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('historical_context', translation)}
                topicId={topicId}
                field="historical_context"
              />
            </div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[120px]"
              onEditorReady={(editor) => {
                if (formData.historical_context && editor) {
                  editor.commands.setContent(formData.historical_context);
                }
                editorsRef.current['historical_context'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('historical_context', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>

        {/* Mashal & Nimshal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">
                Mashal (Parable)
              </label>
              <div className="flex items-center gap-2">
                <GenerateSectionButton
                  topicId={topicId}
                  fieldName="mashal"
                  currentContent={formData.mashal}
                  topicContext={topicContext}
                  onGenerated={(content) => onEditorUpdate('mashal', content)}
                />
                <TranslateButton
                  content={formData.mashal || ''}
                  targetLanguage="en"
                  onTranslation={(translation) => onEditorUpdate('mashal', translation)}
                  topicId={topicId}
                  field="mashal"
                />
              </div>
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <TipTapEditor
                docId={null}
                className="min-h-[100px]"
                onEditorReady={(editor) => {
                  if (formData.mashal && editor) {
                    editor.commands.setContent(formData.mashal);
                  }
                  editorsRef.current['mashal'] = editor;
                }}
                onUpdate={(newContent) => onEditorUpdate('mashal', newContent)}
                onBreakStatements={async () => {}}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">
                Nimshal (Application)
              </label>
              <div className="flex items-center gap-2">
                <GenerateSectionButton
                  topicId={topicId}
                  fieldName="global_nimshal"
                  currentContent={formData.global_nimshal}
                  topicContext={topicContext}
                  onGenerated={(content) => onEditorUpdate('global_nimshal', content)}
                />
                <TranslateButton
                  content={formData.global_nimshal || ''}
                  targetLanguage="en"
                  onTranslation={(translation) => onEditorUpdate('global_nimshal', translation)}
                  topicId={topicId}
                  field="global_nimshal"
                />
              </div>
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <TipTapEditor
                docId={null}
                className="min-h-[100px]"
                onEditorReady={(editor) => {
                  if (formData.global_nimshal && editor) {
                    editor.commands.setContent(formData.global_nimshal);
                  }
                  editorsRef.current['global_nimshal'] = editor;
                }}
                onUpdate={(newContent) => onEditorUpdate('global_nimshal', newContent)}
                onBreakStatements={async () => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}

export default SupplementarySection;
