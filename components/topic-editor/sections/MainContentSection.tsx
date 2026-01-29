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

interface MainContentSectionProps {
  formData: TopicFormData;
  topicId?: number;
  topicContext: TopicContext;
  editorsRef: React.MutableRefObject<Record<string, any>>;
  onEditorUpdate: (field: keyof TopicFormData, content: string) => void;
  onGenerateField?: (fieldId: string) => void;
  defaultOpen?: boolean;
}

export function MainContentSection({
  formData,
  topicId,
  topicContext,
  editorsRef,
  onEditorUpdate,
  onGenerateField,
  defaultOpen = true,
}: MainContentSectionProps) {
  const hasOverview = Boolean(formData.overview && formData.overview.length > 50);
  const hasArticle = Boolean(formData.article && formData.article.length > 100);
  const isComplete = hasOverview && hasArticle;
  const isEmpty = !hasOverview && !hasArticle;

  const aiActions = [];
  if (!hasArticle && onGenerateField) {
    aiActions.push({
      label: 'Generate Article',
      onClick: () => onGenerateField('article'),
      icon: Wand2,
    });
  }

  return (
    <AccordionSection
      id="main-content"
      title="Main Content"
      defaultOpen={defaultOpen}
      isComplete={isComplete}
      isEmpty={isEmpty}
      helpText="The core content: overview for quick understanding, article for in-depth coverage"
      aiActions={aiActions}
    >
      <div className="space-y-6">
        {/* Overview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Overview
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="overview"
                currentContent={formData.overview}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('overview', content)}
              />
              <TranslateButton
                content={formData.overview || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('overview', translation)}
                topicId={topicId}
                field="overview"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            A medium-length summary that appears on the topic page
          </p>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[150px]"
              onEditorReady={(editor) => {
                if (formData.overview && editor) {
                  editor.commands.setContent(formData.overview);
                }
                editorsRef.current['overview'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('overview', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>

        {/* Article */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Article Content
            </label>
            <div className="flex items-center gap-2">
              <GenerateSectionButton
                topicId={topicId}
                fieldName="article"
                currentContent={formData.article}
                topicContext={topicContext}
                onGenerated={(content) => onEditorUpdate('article', content)}
              />
              <TranslateButton
                content={formData.article || ''}
                targetLanguage="en"
                onTranslation={(translation) => onEditorUpdate('article', translation)}
                topicId={topicId}
                field="article"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Full in-depth article with structured content, sources, and analysis
          </p>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[300px]"
              onEditorReady={(editor) => {
                if (formData.article && editor) {
                  editor.commands.setContent(formData.article);
                }
                editorsRef.current['article'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('article', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}

export default MainContentSection;
