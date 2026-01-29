'use client';

import { useState, useCallback, useRef } from 'react';
import { TopicFormData, TopicEditorTab, SectionConfig, DisplayConfig } from '../types';
import { Topic, TopicRelationship, Source } from '@/lib/types';

// Content sections configuration
export const CONTENT_SECTIONS: SectionConfig[] = [
  { id: 'description', label: 'Short Description', field: 'description', required: true, displayConfig: { format: 'prose', visible: true }, helpText: 'Brief overview (appears in search results and hero section)' },
  { id: 'definition_positive', label: 'What It Is', field: 'definition_positive', displayConfig: { format: 'prose', visible: true }, helpText: 'Define what this concept encompasses' },
  { id: 'definition_negative', label: 'What It\'s Not', field: 'definition_negative', displayConfig: { format: 'prose', visible: true }, helpText: 'Clarify boundaries and common confusions' },
  { id: 'common_confusions', label: 'Common Confusions', field: 'common_confusions', displayConfig: { format: 'prose', visible: true }, helpText: 'Address frequent misunderstandings or misapplications' },
  { id: 'overview', label: 'Overview', field: 'overview', displayConfig: { format: 'prose', visible: true }, helpText: 'Detailed overview for the main page' },
  { id: 'article', label: 'Article', field: 'article', displayConfig: { format: 'prose', visible: true }, helpText: 'In-depth article content' },
  { id: 'mashal', label: 'Mashal (Parable)', field: 'mashal', displayConfig: { format: 'prose', visible: true }, helpText: 'Illustrative parable or analogy' },
  { id: 'global_nimshal', label: 'Nimshal (Application)', field: 'global_nimshal', displayConfig: { format: 'prose', visible: true }, helpText: 'Application of the parable to real life' },
  { id: 'practical_takeaways', label: 'Practical Takeaways', field: 'practical_takeaways', displayConfig: { format: 'list', visible: true }, helpText: 'Actionable applications and key points' },
  { id: 'historical_context', label: 'Historical Context', field: 'historical_context', displayConfig: { format: 'prose', visible: true }, helpText: 'Historical background and development' },
  { id: 'charts', label: 'Charts & Tables', field: 'charts', displayConfig: { format: 'table', visible: true }, helpText: 'Structured data displays and comparisons' },
];

const INITIAL_FORM_DATA: TopicFormData = {
  canonical_title: '',
  canonical_title_en: '',
  canonical_title_transliteration: '',
  name_hebrew: '',
  slug: '',
  topic_type: '',
  description: '',
  description_en: '',
  definition_positive: '',
  definition_negative: '',
  overview: '',
  article: '',
  practical_takeaways: '',
  historical_context: '',
  mashal: '',
  global_nimshal: '',
  charts: '',
  content_status: 'minimal',
  status_label: '',
  badge_color: '',
  status: 'draft',
  common_confusions: [],
  conceptual_variants: [],
  terminology_notes: '',
};

export type NewTopicEditorTab = 'edit' | 'connections' | 'scholarly' | 'settings';

export function useTopicEditorState() {
  // Core state
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NewTopicEditorTab>('edit');
  const [originalSlug, setOriginalSlug] = useState('');

  // Form data
  const [formData, setFormData] = useState<TopicFormData>(INITIAL_FORM_DATA);

  // Related data
  const [relationships, setRelationships] = useState<TopicRelationship[]>([]);
  const [linkedSources, setLinkedSources] = useState<Source[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>(CONTENT_SECTIONS);
  const [displayConfigChanged, setDisplayConfigChanged] = useState(false);

  // Editor references
  const editorsRef = useRef<Record<string, any>>({});

  // Topic context for AI
  const topicContext = {
    title: formData.canonical_title,
    title_en: formData.canonical_title_en,
    type: formData.topic_type,
    description: formData.description,
    slug: formData.slug,
  };

  // Form field update handler
  const updateFormField = useCallback((field: keyof TopicFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Editor content update handler
  const handleEditorUpdate = useCallback((field: keyof TopicFormData, content: string) => {
    setFormData(prev => ({ ...prev, [field]: content }));
  }, []);

  // Display config handler
  const handleUpdateDisplayConfig = useCallback((sectionId: string, config: Partial<DisplayConfig>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, displayConfig: { ...s.displayConfig, ...config } }
        : s
    ));
    setDisplayConfigChanged(true);
  }, []);

  // Build display_config object for saving
  const buildDisplayConfigForSave = useCallback(() => {
    const config: Record<string, Partial<DisplayConfig>> = {};
    sections.forEach(section => {
      config[section.id] = section.displayConfig;
    });
    return config;
  }, [sections]);

  // Initialize form data from topic
  const initializeFromTopic = useCallback((topicData: Topic) => {
    setTopic(topicData);
    setOriginalSlug(topicData.slug || '');

    // Initialize sections from stored display_config
    if ((topicData as any).display_config) {
      const storedConfig = (topicData as any).display_config;
      setSections(prev => prev.map(section => {
        const sectionConfig = storedConfig[section.id];
        if (sectionConfig) {
          return {
            ...section,
            displayConfig: { ...section.displayConfig, ...(sectionConfig as Partial<DisplayConfig>) }
          };
        }
        return section;
      }));
    }

    // Use 'as any' to access extended fields not in base Topic type
    const data = topicData as any;
    setFormData({
      canonical_title: data.canonical_title || '',
      canonical_title_en: data.canonical_title_en || '',
      canonical_title_transliteration: data.canonical_title_transliteration || '',
      name_hebrew: data.name_hebrew || '',
      slug: data.slug || '',
      topic_type: data.topic_type || '',
      description: data.description || '',
      description_en: data.description_en || '',
      definition_positive: data.definition_positive || '',
      definition_negative: data.definition_negative || '',
      overview: data.overview || '',
      article: data.article || '',
      practical_takeaways: data.practical_takeaways || '',
      historical_context: data.historical_context || '',
      mashal: data.mashal || '',
      global_nimshal: data.global_nimshal || '',
      charts: data.charts || '',
      content_status: data.content_status || 'minimal',
      status_label: data.status_label || '',
      badge_color: data.badge_color || '',
      status: data.status || 'draft',
      common_confusions: data.common_confusions || [],
      conceptual_variants: data.conceptual_variants || [],
      terminology_notes: data.terminology_notes || '',
    });
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setTopic(null);
    setFormData(INITIAL_FORM_DATA);
    setRelationships([]);
    setLinkedSources([]);
    setSections(CONTENT_SECTIONS);
    setDisplayConfigChanged(false);
    setOriginalSlug('');
  }, []);

  return {
    // State
    topic,
    setTopic,
    isLoading,
    setIsLoading,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    originalSlug,
    relationships,
    setRelationships,
    linkedSources,
    setLinkedSources,
    sections,
    setSections,
    displayConfigChanged,
    editorsRef,
    topicContext,

    // Actions
    updateFormField,
    handleEditorUpdate,
    handleUpdateDisplayConfig,
    buildDisplayConfigForSave,
    initializeFromTopic,
    reset,
  };
}

export default useTopicEditorState;
