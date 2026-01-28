'use client';

import React from 'react';
import { AccordionSection } from './AccordionSection';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { TranslateButton } from '@/components/editor/TranslateButton';
import { SmartFieldInput } from '@/components/editor/SmartFieldInput';
import { AlertCircle } from 'lucide-react';
import { TopicFormData } from '../types';

interface BasicInfoSectionProps {
  formData: TopicFormData;
  topicId?: number;
  originalSlug: string;
  slugLoading?: boolean;
  isAvailable?: boolean | null;
  alternatives?: string[];
  editorsRef: React.MutableRefObject<Record<string, any>>;
  onFieldChange: (field: keyof TopicFormData, value: string) => void;
  onEditorUpdate: (field: keyof TopicFormData, content: string) => void;
  defaultOpen?: boolean;
}

export function BasicInfoSection({
  formData,
  topicId,
  originalSlug,
  slugLoading = false,
  isAvailable = null,
  alternatives = [],
  editorsRef,
  onFieldChange,
  onEditorUpdate,
  defaultOpen = true,
}: BasicInfoSectionProps) {
  const isComplete = Boolean(
    formData.canonical_title &&
    formData.slug &&
    formData.topic_type &&
    formData.description
  );

  const isEmpty = !formData.canonical_title && !formData.slug && !formData.topic_type;

  return (
    <AccordionSection
      id="basic-info"
      title="Basic Information"
      defaultOpen={defaultOpen}
      isComplete={isComplete}
      isEmpty={isEmpty}
      helpText="Core identification: titles, slug, type, and short description"
      badge="Required"
    >
      <div className="space-y-4">
        {/* Titles Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">
                Title (Hebrew) *
              </label>
              <TranslateButton
                content={formData.canonical_title || ''}
                targetLanguage="en"
                onTranslation={(translation) => onFieldChange('canonical_title_en', translation)}
                topicId={topicId}
                field="canonical_title"
              />
            </div>
            <input
              type="text"
              value={formData.canonical_title}
              onChange={(e) => onFieldChange('canonical_title', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title (English)
            </label>
            <input
              type="text"
              value={formData.canonical_title_en || ''}
              onChange={(e) => onFieldChange('canonical_title_en', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Transliteration & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SmartFieldInput
            label="Transliteration"
            value={formData.canonical_title_transliteration || ''}
            onChange={(value) => onFieldChange('canonical_title_transliteration', value)}
            sourceValue={formData.canonical_title}
            placeholder="e.g., Ahavas Yisroel"
            autoTransliterate={true}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Topic Type *
            </label>
            <select
              value={formData.topic_type}
              onChange={(e) => onFieldChange('topic_type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type...</option>
              <option value="concept">Concept</option>
              <option value="person">Person</option>
              <option value="place">Place</option>
              <option value="event">Event</option>
              <option value="mitzvah">Mitzvah</option>
              <option value="sefirah">Sefirah</option>
            </select>
          </div>
        </div>

        {/* Slug Field */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            URL Slug *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => {
              const sanitized = e.target.value
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
              onFieldChange('slug', sanitized);
            }}
            placeholder="e.g., ahavas-yisroel"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {slugLoading && <span>Checking availability...</span>}
            {isAvailable === true && <span className="text-green-600">Slug is available!</span>}
            {isAvailable === false && (
              <div className="text-red-600">
                Slug is taken. Suggestions:{' '}
                {alternatives.map((alt, i) => (
                  <button key={i} onClick={() => onFieldChange('slug', alt)} className="underline mx-1">{alt}</button>
                ))}
              </div>
            )}
            {!slugLoading && isAvailable === null && (
              <span>URL: <span className="font-mono">/topics/{formData.slug || 'slug'}</span></span>
            )}
          </div>
          {formData.slug && formData.slug !== originalSlug && (
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Warning: Changing the slug will break existing URLs</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              Short Description *
            </label>
            <TranslateButton
              content={formData.description}
              targetLanguage="en"
              onTranslation={(translation) => onEditorUpdate('description_en', translation)}
              topicId={topicId}
              field="description"
            />
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <TipTapEditor
              docId={null}
              className="min-h-[100px]"
              onEditorReady={(editor) => {
                if (formData.description && editor) {
                  editor.commands.setContent(formData.description);
                }
                editorsRef.current['description'] = editor;
              }}
              onUpdate={(newContent) => onEditorUpdate('description', newContent)}
              onBreakStatements={async () => {}}
            />
          </div>
        </div>
      </div>
    </AccordionSection>
  );
}

export default BasicInfoSection;
