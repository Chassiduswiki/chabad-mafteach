'use client';

import React from 'react';
import { Wand2, Languages } from 'lucide-react';
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

interface DefinitionSectionProps {
  formData: TopicFormData;
  topicId?: number;
  topicContext: TopicContext;
  editorsRef: React.MutableRefObject<Record<string, any>>;
  onEditorUpdate: (field: keyof TopicFormData, content: string) => void;
  onGenerateField?: (fieldId: string) => void;
  defaultOpen?: boolean;
}

export function DefinitionSection({
  formData,
  topicId,
  topicContext,
  editorsRef,
  onEditorUpdate,
  onGenerateField,
  defaultOpen = false,
}: DefinitionSectionProps) {
  const hasPositive = Boolean(formData.definition_positive && formData.definition_positive.length > 10);
  const hasNegative = Boolean(formData.definition_negative && formData.definition_negative.length > 10);
  const isComplete = hasPositive && hasNegative;
  const isEmpty = !hasPositive && !hasNegative;

  const aiActions = [];
  if (!hasPositive && onGenerateField) {
    aiActions.push({
      label: 'Generate',
      onClick: () => onGenerateField('definition_positive'),
      icon: Wand2,
    });
  }

  return (
    <AccordionSection
      id="definitions"
      title="Definitions"
      defaultOpen={defaultOpen || !isEmpty}
      isComplete={isComplete}
      isEmpty={isEmpty}
      helpText="Clarify what this concept is and what it isn't - helps prevent confusion"
      aiActions={aiActions}
    >
      <div className="space-y-6">
        {/* Positive Definition */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              What It IS (Positive Definition)
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="definition_positive"
                currentContent={formData.definition_positive}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('definition_positive', content)}
              />
              <TranslateButton
                content={formData.definition_positive || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('definition_positive', translation)}
                topicId={topicId}
                field="definition_positive"
              />
            </div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[120px]"
              onEditorReady={(editor) => {
                if (formData.definition_positive && editor) {
                  editor.commands.setContent(formData.definition_positive);
                }
                editorsRef.current['definition_positive'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('definition_positive', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>

        {/* Negative Definition */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              What It's NOT (Boundaries)
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="definition_negative"
                currentContent={formData.definition_negative}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('definition_negative', content)}
              />
              <TranslateButton
                content={formData.definition_negative || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('definition_negative', translation)}
                topicId={topicId}
                field="definition_negative"
              />
            </div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[120px]"
              onEditorReady={(editor) => {
                if (formData.definition_negative && editor) {
                  editor.commands.setContent(formData.definition_negative);
                }
                editorsRef.current['definition_negative'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('definition_negative', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}

export default DefinitionSection;
