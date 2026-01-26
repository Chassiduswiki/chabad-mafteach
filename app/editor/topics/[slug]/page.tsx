'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Eye, CheckCircle, AlertCircle,
  Settings, Link2, BookOpen, Tag, LayoutGrid, FileText,
  Clock, Keyboard, Trash2, Plus, Languages, Wand2
} from 'lucide-react';
import { Topic, TopicRelationship, Source } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { cn } from '@/lib/utils';
import {
  TopicRelationshipManager,
  SourceLinker,
  ConceptTagger,
  DisplayFormatSelector,
  TopicCompleteness,
  TopicVersionHistory,
  TopicHierarchyTree,
  useAutoSave,
  useSaveShortcut,
  TopicFormData,
  TopicEditorTab,
  RelationshipFormData,
  SourceLinkFormData,
  ConceptTag,
  SectionConfig,
  DisplayConfig,
  SmartFieldInput,
  ProactiveSuggestionsPanel,
  AIContentGeneratorDialog,
  AIRelationshipFinderDialog,
  AICitationSuggestorDialog,
  isRelationType,
  RelationshipPredictionsPanel,
  SmartCitationFinder,
  FloatingAIChatButton,
  AIChatPanel,
} from '@/components/topic-editor';
import { SaveStatusToast } from '@/components/ui/SaveStatusToast';
import { useSmartSlug } from '@/hooks/useSmartSlug';
import { useAIFieldAutoComplete } from '@/hooks/useAIFieldAutoComplete';
import { useTopicLock } from '@/hooks/useTopicLock';
import { TranslateButton } from '@/components/editor/TranslateButton';
import { GenerateSectionButton } from '@/components/editor/GenerateSectionButton';

// Content sections configuration
const CONTENT_SECTIONS: SectionConfig[] = [
  // Core Content (Most Used)
  { id: 'description', label: 'Short Description', field: 'description', required: true, displayConfig: { format: 'prose', visible: true }, helpText: 'Brief overview (appears in search results and hero section)' },
  { id: 'definition_positive', label: 'What It Is', field: 'definition_positive', displayConfig: { format: 'prose', visible: true }, helpText: 'Define what this concept encompasses' },
  { id: 'definition_negative', label: 'What It\'s Not', field: 'definition_negative', displayConfig: { format: 'prose', visible: true }, helpText: 'Clarify boundaries and common confusions' },
  { id: 'common_confusions', label: 'Common Confusions', field: 'common_confusions', displayConfig: { format: 'prose', visible: true }, helpText: 'Address frequent misunderstandings or misapplications' },
  
  // Main Content
  { id: 'overview', label: 'Overview', field: 'overview', displayConfig: { format: 'prose', visible: true }, helpText: 'Detailed overview for the main page' },
  { id: 'article', label: 'Article', field: 'article', displayConfig: { format: 'prose', visible: true }, helpText: 'In-depth article content' },
  
  // Supplementary Content
  { id: 'mashal', label: 'Mashal (Parable)', field: 'mashal', displayConfig: { format: 'prose', visible: true }, helpText: 'Illustrative parable or analogy' },
  { id: 'global_nimshal', label: 'Nimshal (Application)', field: 'global_nimshal', displayConfig: { format: 'prose', visible: true }, helpText: 'Application of the parable to real life' },
  { id: 'practical_takeaways', label: 'Practical Takeaways', field: 'practical_takeaways', displayConfig: { format: 'list', visible: true }, helpText: 'Actionable applications and key points' },
  { id: 'historical_context', label: 'Historical Context', field: 'historical_context', displayConfig: { format: 'prose', visible: true }, helpText: 'Historical background and development' },
  
  // Advanced Content
  { id: 'charts', label: 'Charts & Tables', field: 'charts', displayConfig: { format: 'table', visible: true }, helpText: 'Structured data displays and comparisons' },
];

export default function TopicEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Core state
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TopicEditorTab>('overview');
  const [manualSaveStatus, setManualSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [originalSlug, setOriginalSlug] = useState('');

  // Form data
  const [formData, setFormData] = useState<TopicFormData>({
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
  });

  const topicContext = {
    title: formData.canonical_title,
    title_en: formData.canonical_title_en,
    type: formData.topic_type,
    description: formData.description,
    slug: formData.slug,
  };

  // Related data
  const [relationships, setRelationships] = useState<TopicRelationship[]>([]);
  const [linkedSources, setLinkedSources] = useState<Source[]>([]);
  const [concepts, setConcepts] = useState<ConceptTag[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>(CONTENT_SECTIONS);
  const [displayConfigChanged, setDisplayConfigChanged] = useState(false);

  // AI Dialog states
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showRelationshipFinder, setShowRelationshipFinder] = useState(false);
  const [showCitationSuggestor, setShowCitationSuggestor] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Editor references - use ref to avoid re-render loops
  const editorsRef = useRef<Record<string, any>>({});

  // Auto-save hook
  const handleAutoSave = useCallback(async (data: TopicFormData) => {
    if (!topic) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${topic.slug || slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Auto-save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      throw error;
    }
  }, [topic, slug]);

  const {
    isSaving: isAutoSaving,
    lastSaved,
    saveStatus: autoSaveStatus,
    hasUnsavedChanges,
    triggerSave,
    markAsSaved,
  } = useAutoSave(formData, {
    debounceMs: 5000,
    onSave: handleAutoSave,
    enabled: !!topic,
  });

  const { isAvailable, alternatives, loading: slugLoading, generateSlug } = useSmartSlug(
    formData.slug,
    originalSlug,
    formData.canonical_title_transliteration || formData.canonical_title_en || '',
    !formData.slug // auto-generate only if slug is empty
  );

  useEffect(() => {
    const sourceText = formData.canonical_title_transliteration || formData.canonical_title_en || '';
    if (sourceText && !formData.slug) {
      const generated = generateSlug(sourceText);
      if (generated) {
        updateFormField('slug', generated);
      }
    }
  }, [formData.canonical_title_transliteration, formData.canonical_title_en, formData.slug]);

  // AI Field Auto-Complete - invisible AI assistance
  const { 
    suggestions: aiSuggestions, 
    isLoading: isAICompleting,
    applySuggestion,
    dismissSuggestion,
  } = useAIFieldAutoComplete(
    {
      canonical_title: formData.canonical_title,
      canonical_title_en: formData.canonical_title_en,
      canonical_title_transliteration: formData.canonical_title_transliteration,
      topic_type: formData.topic_type,
      description: formData.description,
    },
    (field, value) => updateFormField(field as keyof TopicFormData, value),
    {
      enabled: !!topic && !isLoading,
      autoApply: true,
      confidenceThreshold: 0.75,
      onAutoApplied: (applied) => {
        console.log('AI auto-filled fields:', applied.map(s => s.field).join(', '));
      },
    }
  );

  // Keyboard shortcut for save
  useSaveShortcut(() => {
    handleManualSave();
  });

  // AI Event Listeners
  useEffect(() => {
    const handleGenerateArticle = () => setShowContentGenerator(true);
    const handleFindRelationships = () => setShowRelationshipFinder(true);
    const handleSuggestCitations = () => setShowCitationSuggestor(true);
    const handleGenerateAllMissing = async () => {
      const missingFields = [
        'definition_positive',
        'definition_negative',
        'overview',
        'article',
        'practical_takeaways',
        'historical_context',
        'mashal',
        'global_nimshal'
      ].filter(field => !formData[field as keyof TopicFormData]);

      if (missingFields.length === 0) return;

      setIsLoading(true);
      for (const field of missingFields) {
        await handleGenerateField(field);
      }
      setIsLoading(false);
    };

    const handleTranslateAllToEnglish = async () => {
      const translatableFields: Array<{source: keyof TopicFormData, target: keyof TopicFormData}> = [
        { source: 'canonical_title', target: 'canonical_title_en' },
        { source: 'description', target: 'description_en' },
        { source: 'definition_positive', target: 'definition_positive' }, // These update the same field but target language is different in API
        { source: 'definition_negative', target: 'definition_negative' },
        { source: 'overview', target: 'overview' },
        { source: 'article', target: 'article' },
        { source: 'practical_takeaways', target: 'practical_takeaways' },
        { source: 'historical_context', target: 'historical_context' },
        { source: 'mashal', target: 'mashal' },
        { source: 'global_nimshal', target: 'global_nimshal' },
      ];

      setIsLoading(true);
      for (const { source, target } of translatableFields) {
        const content = formData[source];
        if (!content || (typeof content === 'string' && content.length < 2)) continue;

        try {
          const response = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({
              topic_id: topic?.id,
              source_language: 'he',
              target_language: 'en',
              field: source,
              content: content,
              context: topicContext
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.translation) {
              if (target === 'canonical_title_en' || target === 'description_en') {
                updateFormField(target, data.translation);
              } else {
                handleEditorUpdate(target, data.translation);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to translate ${source}:`, err);
        }
      }
      setIsLoading(false);
    };

    window.addEventListener('ai-generate-article', handleGenerateArticle);
    window.addEventListener('ai-find-relationships', handleFindRelationships);
    window.addEventListener('ai-suggest-citations', handleSuggestCitations);
    window.addEventListener('ai-generate-all-missing', handleGenerateAllMissing);
    window.addEventListener('ai-translate-all', handleTranslateAllToEnglish);

    return () => {
      window.removeEventListener('ai-generate-article', handleGenerateArticle);
      window.removeEventListener('ai-find-relationships', handleFindRelationships);
      window.removeEventListener('ai-suggest-citations', handleSuggestCitations);
      window.removeEventListener('ai-generate-all-missing', handleGenerateAllMissing);
      window.removeEventListener('ai-translate-all', handleTranslateAllToEnglish);
    };
  }, [topic, formData, topicContext]);

  const handleGenerateField = async (fieldId: string) => {
    // This is called from the sidebar
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          topic_id: topic?.id,
          field_name: fieldId,
          topic_context: topicContext
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.generated_content) {
          handleEditorUpdate(fieldId as keyof TopicFormData, data.generated_content);
        }
      }
    } catch (err) {
      console.error(`Failed to generate ${fieldId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load topic data
  useEffect(() => {
    if (slug) {
      loadTopic();
    }
  }, [slug]);

  const loadTopic = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/topics/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to load topic: ${response.status}`);
      }

      const data = await response.json();
      const topicData = data.topic || data;

      setTopic(topicData);
      setOriginalSlug(topicData.slug || '');

      // Initialize sections from stored display_config if available
      if (topicData.display_config) {
        const storedConfig = topicData.display_config;
        setSections(prev => prev.map(section => {
          const sectionConfig = storedConfig[section.id];
          if (sectionConfig) {
            return {
              ...section,
              displayConfig: { ...section.displayConfig, ...sectionConfig }
            };
          }
          return section;
        }));
      }

      setFormData({
        canonical_title: topicData.canonical_title || '',
        canonical_title_en: topicData.canonical_title_en || '',
        canonical_title_transliteration: topicData.canonical_title_transliteration || '',
        name_hebrew: topicData.name_hebrew || '',
        slug: topicData.slug || '',
        topic_type: topicData.topic_type || '',
        description: topicData.description || '',
        description_en: topicData.description_en || '',
        definition_positive: topicData.definition_positive || '',
        definition_negative: topicData.definition_negative || '',
        overview: topicData.overview || '',
        article: topicData.article || '',
        practical_takeaways: topicData.practical_takeaways || '',
        historical_context: topicData.historical_context || '',
        mashal: topicData.mashal || '',
        global_nimshal: topicData.global_nimshal || '',
        charts: topicData.charts || '',
        content_status: topicData.content_status || 'minimal',
        status_label: topicData.status_label || '',
        badge_color: topicData.badge_color || '',
        status: topicData.status || 'draft',
        common_confusions: topicData.common_confusions || [],
      });

      // Load relationships
      await loadRelationships(topicData.id);

      // Load linked sources
      await loadSources(topicData.slug);

    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelationships = async (topicId: number) => {
    try {
      const response = await fetch(`/api/topics/${topicId}/relationships`);
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.data || data || []);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  // Manual save handler
  const handleManualSave = async () => {
    setFormData(currentFormData => {
      // Perform the save operation within the functional update to ensure latest state
      (async () => {
    if (!topic) return;

    setManualSaveStatus('saving');

    try {
      // Include display_config if it was changed
      const displayConfig = displayConfigChanged ? buildDisplayConfigForSave() : undefined;
      const saveData = {
        ...currentFormData,
        ...(displayConfig && { display_config: displayConfig })
      };


      // Use slug for API call, not ID
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${topic.slug || slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save failed:', response.status, errorData);
        throw new Error(errorData.error || `Save failed: ${response.status}`);
      }

      setManualSaveStatus('success');
      markAsSaved();

      // Reload topic data to reflect saved changes
      await loadTopic();

      setTimeout(() => setManualSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setManualSaveStatus('error');
    }
  })();
  return currentFormData; // Return the state for the updater
  });
  };

  // Relationship handlers
  const handleAddRelationship = async (data: RelationshipFormData) => {
    if (!topic || !data.relatedTopicId) return;

    const payload = {
      parent_topic_id: data.direction === 'parent' ? data.relatedTopicId : topic.id,
      child_topic_id: data.direction === 'child' ? data.relatedTopicId : topic.id,
      relation_type: data.relationType,
      strength: data.strength,
      description: data.description,
    };

    const response = await fetch('/api/topic-relationships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to add relationship');

    await loadRelationships(topic.id);
  };

  const handleRemoveRelationship = async (relationshipId: number) => {
    const response = await fetch(`/api/topic-relationships/${relationshipId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to remove relationship');

    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
  };

  // Load linked sources from API
  const loadSources = async (topicSlug: string) => {
    try {
      const response = await fetch(`/api/topics/${topicSlug}/sources`);
      if (response.ok) {
        const data = await response.json();
        setLinkedSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  // Source handlers
  const handleLinkSource = async (data: SourceLinkFormData) => {
    if (!topic || !data.sourceId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${topic.slug}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          source_id: data.sourceId,
          relationship_type: data.relationshipType,
          page_number: data.pageNumber,
          verse_reference: data.verseReference,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to link source');
      }

      // Reload sources to get the full data
      await loadSources(topic.slug);
    } catch (error) {
      console.error('Failed to link source:', error);
      throw error;
    }
  };

  const handleUnlinkSource = async (sourceId: number) => {
    if (!topic) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${topic.slug}/sources?source_id=${sourceId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unlink source');
      }

      setLinkedSources(prev => prev.filter(s => s.id !== sourceId));
    } catch (error) {
      console.error('Failed to unlink source:', error);
      throw error;
    }
  };

  const handleCreateSource = async (sourceData: Partial<Source>): Promise<Source> => {
    const response = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create source');
    }

    const data = await response.json();
    return data.data;
  };

  // Concept handlers
  const handleAddConcept = async (conceptId: number, type: 'primary' | 'secondary' | 'related') => {
    // This would typically call an API
    const newConcept: ConceptTag = {
      id: conceptId,
      name: `Concept ${conceptId}`, // Would come from API
      type,
      relevanceScore: type === 'primary' ? 1 : type === 'secondary' ? 0.7 : 0.4,
    };
    setConcepts(prev => [...prev, newConcept]);
  };

  const handleRemoveConcept = async (conceptId: number) => {
    setConcepts(prev => prev.filter(c => c.id !== conceptId));
  };

  const handleUpdateConceptType = async (conceptId: number, type: 'primary' | 'secondary' | 'related') => {
    setConcepts(prev => prev.map(c =>
      c.id === conceptId ? { ...c, type } : c
    ));
  };

  // Display config handler
  const handleUpdateDisplayConfig = (sectionId: string, config: Partial<DisplayConfig>) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, displayConfig: { ...s.displayConfig, ...config } }
        : s
    ));
    setDisplayConfigChanged(true);
  };

  // Build display_config object for saving to database
  const buildDisplayConfigForSave = () => {
    const config: Record<string, Partial<DisplayConfig>> = {};
    sections.forEach(section => {
      config[section.id] = section.displayConfig;
    });
    return config;
  };

  // Form field update handler
  const handleTranslationSave = useCallback(async (field: keyof TopicFormData, content: string) => {
    if (!topic) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/topics/translations`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({
            topicId: topic.id,
            language: 'en', // Or the current language
            field,
            value: content,
          }),
        }
      );
    } catch (error) {
      console.error(`Failed to save translation for ${field}:`, error);
    }
  }, [topic]);

  const handleEditorUpdate = (field: keyof TopicFormData, content: string) => {
    setFormData(prev => ({ ...prev, [field]: content }));
    if (['description', 'overview', 'article', 'definition_positive', 'definition_negative', 'practical_takeaways', 'historical_context', 'mashal', 'global_nimshal', 'charts', 'common_confusions'].includes(field)) {
      handleTranslationSave(field, content);
    }
  };

  const updateFormField = (field: keyof TopicFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { isLocked, lockedBy, isOwner, error: lockError } = useTopicLock({ slug, enabled: !!topic && !isLoading });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading topic...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Topic Not Found</h1>
          <p className="text-muted-foreground mb-6">The topic "{slug}" doesn't exist.</p>
          <button
            onClick={() => router.push('/editor/topics')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  const getSaveStatusDisplay = () => {
    if (manualSaveStatus === 'saving' || isAutoSaving) {
      return { text: 'Saving...', color: 'text-muted-foreground' };
    }
    if (manualSaveStatus === 'success' || autoSaveStatus === 'success') {
      return { text: 'Saved', color: 'text-green-600' };
    }
    if (manualSaveStatus === 'error' || autoSaveStatus === 'error') {
      return { text: 'Save failed', color: 'text-red-600' };
    }
    if (hasUnsavedChanges) {
      return { text: 'Unsaved changes', color: 'text-yellow-600' };
    }
    if (lastSaved) {
      return { text: `Last saved ${lastSaved.toLocaleTimeString()}`, color: 'text-muted-foreground' };
    }
    return null;
  };

  const handleContentGenerated = (content: string) => {
    // For now, let's just log it. In a real implementation, we'd update the editor.
    console.log('Generated content:', content);
    // A more robust solution would be to find the 'article' editor instance and set its content.
    const articleEditor = editorsRef.current['article'];
    if (articleEditor) {
      articleEditor.commands.setContent(content);
    }
  };

  const saveStatusDisplay = getSaveStatusDisplay();

  return (
    <div className="min-h-screen bg-background">
      {/* Lock Banner */}
      {isLocked && !isOwner && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          <span>Read Only: This topic is currently being edited by another user ({lockedBy}).</span>
        </div>
      )}
      {lockError && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          <span>{lockError}</span>
        </div>
      )}

      <AIContentGeneratorDialog 
        open={showContentGenerator}
        onOpenChange={setShowContentGenerator}
        topicTitle={formData.canonical_title}
        onContentGenerated={handleContentGenerated}
      />
      <AIRelationshipFinderDialog 
        open={showRelationshipFinder}
        onOpenChange={setShowRelationshipFinder}
        topicId={topic.id}
        content={Object.values(formData).join(' ')}
        onAddRelationship={(p) => {
          const relationType = isRelationType(p.relationship_type) ? p.relationship_type : 'related_to';
          handleAddRelationship({ 
            relatedTopicId: p.topic_id, 
            relationType: relationType, 
            direction: 'child', 
            strength: p.confidence, 
            description: p.explanation 
          });
        }}
      />
      <AICitationSuggestorDialog
        open={showCitationSuggestor}
        onOpenChange={setShowCitationSuggestor}
        query={formData.canonical_title}
        context={Object.values(formData).join(' ')}
        onInsertCitation={(c) => console.log('Insert citation:', c) /* Placeholder */}
      />
      <AIChatPanel 
        open={showChatPanel}
        onOpenChange={setShowChatPanel}
        topicTitle={formData.canonical_title}
      />
      <FloatingAIChatButton onClick={() => setShowChatPanel(true)} />
      {/* Header */}
      <header className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/editor/topics')}
                className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Topics</span>
              </button>

              <div className="border-l border-border pl-4">
                <h1 className="text-lg font-semibold text-foreground line-clamp-1">
                  {formData.canonical_title || 'Untitled Topic'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID: {topic.id}</span>
                  <span>•</span>
                  <span>{formData.topic_type || 'No type'}</span>
                  {saveStatusDisplay && (
                    <>
                      <span>•</span>
                      <span className={saveStatusDisplay.color}>{saveStatusDisplay.text}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-primary/5 rounded-lg border border-primary/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('ai-translate-all'))}
                  disabled={isLoading || manualSaveStatus === 'saving'}
                  className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                  title="Translate all Hebrew fields to English"
                >
                  <Languages className="w-3.5 h-3.5 mr-1.5" />
                  Translate All
                </Button>
                <div className="w-px h-4 bg-primary/20 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent('ai-generate-all-missing'))}
                  disabled={isLoading || manualSaveStatus === 'saving'}
                  className="h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                  title="Generate content for all empty fields"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  Fill All
                </Button>
              </div>

              <div className="flex items-center gap-2 mr-4 bg-muted/50 px-3 py-1 rounded-lg border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Status:</span>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => updateFormField('status', e.target.value)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider bg-transparent outline-none cursor-pointer",
                    formData.status === 'published' ? "text-emerald-600" :
                    formData.status === 'draft' ? "text-amber-600" :
                    formData.status === 'reviewed' ? "text-blue-600" :
                    "text-rose-600"
                  )}
                >
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <button
                onClick={() => router.push(`/topics/${slug}`)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>

              <button
                onClick={handleManualSave}
                disabled={manualSaveStatus === 'saving' || (isLocked && !isOwner)}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {manualSaveStatus === 'saving' ? (
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : manualSaveStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {manualSaveStatus === 'saving' ? 'Saving...' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${(isLocked && !isOwner) ? 'opacity-75 pointer-events-none' : ''}`}>
          {/* Sidebar - Completeness */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-[120px] space-y-4">
              <TopicCompleteness
                formData={formData}
                relationshipCount={relationships.length}
                sourceCount={linkedSources.length}
                onGenerateField={handleGenerateField}
                isAICompleting={isAICompleting}
              />

              <div className="bg-card border border-border rounded-lg p-4">
                <TopicVersionHistory 
                  slug={slug} 
                  onRevert={() => {
                    loadTopic();
                    markAsSaved();
                  }} 
                />
              </div>

              <ProactiveSuggestionsPanel 
                topicId={topic.id} 
                content={Object.values(formData).join(' ')} 
              />

              {/* Keyboard shortcuts hint */}
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="h-4 w-4" />
                  <span className="font-medium">Shortcuts</span>
                </div>
                <div className="space-y-1">
                  <div>⌘/Ctrl + S — Save</div>
                  <div>/ — Slash commands</div>
                  <div>? — All shortcuts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TopicEditorTab)}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="relationships" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Relationships
                </TabsTrigger>
                <TabsTrigger value="sources" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Sources
                </TabsTrigger>
                <TabsTrigger value="display" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Display
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                    {isAICompleting && (
                      <span className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <span className="h-2 w-2 bg-primary rounded-full animate-ping" />
                        AI completing fields...
                      </span>
                    )}
                  </div>

                  {/* AI Suggestions Banner */}
                  {aiSuggestions.length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-primary mb-2">
                        <span className="font-medium">AI Suggestions Available</span>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion) => (
                          <div key={suggestion.field} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              <span className="font-medium">{suggestion.field.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-foreground">{suggestion.value}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({Math.round(suggestion.confidence * 100)}% confident)
                              </span>
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => applySuggestion(suggestion.field as any)}
                                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => dismissSuggestion(suggestion.field as any)}
                                className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-foreground">
                          Title (Hebrew) *
                        </label>
                        <TranslateButton
                          content={formData.canonical_title || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => updateFormField('canonical_title_en', translation)}
                          topicId={topic?.id}
                          field="canonical_title"
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.canonical_title}
                        onChange={(e) => updateFormField('canonical_title', e.target.value)}
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
                        onChange={(e) => updateFormField('canonical_title_en', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <SmartFieldInput
                      label="Transliteration"
                      value={formData.canonical_title_transliteration || ''}
                      onChange={(value) => updateFormField('canonical_title_transliteration', value)}
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
                        onChange={(e) => updateFormField('topic_type', e.target.value)}
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

                  {/* Slug Field with Warning */}
                  <div className="col-span-full">
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
                        updateFormField('slug', sanitized);
                      }}
                      placeholder="e.g., ahavas-yisroel"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {slugLoading && <span>Checking availability...</span>}
                      {isAvailable === true && <span className='text-green-600'>Slug is available!</span>}
                      {isAvailable === false && (
                        <div className='text-red-600'>
                          Slug is taken. Suggestions:{' '}
                          {alternatives.map((alt, i) => (
                            <button key={i} onClick={() => updateFormField('slug', alt)} className='underline mx-1'>{alt}</button>
                          ))}
                        </div>
                      )}
                      {!slugLoading && isAvailable === null && <span>This will be the URL: <span className="font-mono">/topics/{formData.slug || 'slug'}</span></span>}
                    </div>
                    {formData.slug && formData.slug !== originalSlug && (
                      <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-yellow-800 dark:text-yellow-200">
                            <p className="font-medium mb-1">⚠️ Warning: Changing the slug will break existing URLs</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Short Description *
                      </label>
                      <TranslateButton
                        content={formData.description}
                        targetLanguage="en"
                        onTranslation={(translation) => handleEditorUpdate('description_en', translation)}
                        topicId={topic?.id}
                        field="description"
                      />
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[120px]"
                        onEditorReady={(editor) => {
                          if (formData.description && editor) {
                            editor.commands.setContent(formData.description);
                          }
                          editorsRef.current['description'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('description', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Content Status
                      </label>
                      <select
                        value={formData.content_status}
                        onChange={(e) => updateFormField('content_status', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="minimal">Minimal</option>
                        <option value="partial">Partial</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Status Label
                      </label>
                      <input
                        type="text"
                        value={formData.status_label || ''}
                        onChange={(e) => updateFormField('status_label', e.target.value)}
                        placeholder="e.g., In Progress"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Badge Color
                      </label>
                      <select
                        value={formData.badge_color || ''}
                        onChange={(e) => updateFormField('badge_color', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Default</option>
                        <option value="gray">Gray</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="purple">Purple</option>
                        <option value="orange">Orange</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Concept Tagging in Overview */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <ConceptTagger
                    topicId={topic.id}
                    concepts={concepts}
                    onAddConcept={handleAddConcept}
                    onRemoveConcept={handleRemoveConcept}
                    onUpdateConceptType={handleUpdateConceptType}
                  />
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6 mt-6">
                {/* Definition Section */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">Definitions & Boundaries</h2>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        What It IS (Positive Definition)
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="definition_positive"
                          currentContent={formData.definition_positive}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('definition_positive', content)}
                        />
                        <TranslateButton
                          content={formData.definition_positive || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('definition_positive', translation)}
                          topicId={topic?.id}
                          field="definition_positive"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[150px]"
                        onEditorReady={(editor) => {
                          if (formData.definition_positive && editor) {
                            editor.commands.setContent(formData.definition_positive);
                          }
                          editorsRef.current['definition_positive'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('definition_positive', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        What It's NOT (Boundaries)
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="definition_negative"
                          currentContent={formData.definition_negative}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('definition_negative', content)}
                        />
                        <TranslateButton
                          content={formData.definition_negative || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('definition_negative', translation)}
                          topicId={topic?.id}
                          field="definition_negative"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[150px]"
                        onEditorReady={(editor) => {
                          if (formData.definition_negative && editor) {
                            editor.commands.setContent(formData.definition_negative);
                          }
                          editorsRef.current['definition_negative'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('definition_negative', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>
                </div>

                {/* Main Content Section */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">Main Content</h2>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Overview
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="overview"
                          currentContent={formData.overview}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('overview', content)}
                        />
                        <TranslateButton
                          content={formData.overview || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('overview', translation)}
                          topicId={topic?.id}
                          field="overview"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[200px]"
                        onEditorReady={(editor) => {
                          if (formData.overview && editor) {
                            editor.commands.setContent(formData.overview);
                          }
                          editorsRef.current['overview'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('overview', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Article Content
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="article"
                          currentContent={formData.article}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('article', content)}
                        />
                        <TranslateButton
                          content={formData.article || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('article', translation)}
                          topicId={topic?.id}
                          field="article"
                        />
                      </div>
                    </div>
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
                        onUpdate={(newContent) => handleEditorUpdate('article', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Content Section */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">Additional Content</h2>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Practical Takeaways
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="practical_takeaways"
                          currentContent={formData.practical_takeaways}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('practical_takeaways', content)}
                        />
                        <TranslateButton
                          content={formData.practical_takeaways || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('practical_takeaways', translation)}
                          topicId={topic?.id}
                          field="practical_takeaways"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[150px]"
                        onEditorReady={(editor) => {
                          if (formData.practical_takeaways && editor) {
                            editor.commands.setContent(formData.practical_takeaways);
                          }
                          editorsRef.current['practical_takeaways'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('practical_takeaways', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Historical Context
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="historical_context"
                          currentContent={formData.historical_context}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('historical_context', content)}
                        />
                        <TranslateButton
                          content={formData.historical_context || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('historical_context', translation)}
                          topicId={topic?.id}
                          field="historical_context"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[150px]"
                        onEditorReady={(editor) => {
                          if (formData.historical_context && editor) {
                            editor.commands.setContent(formData.historical_context);
                          }
                          editorsRef.current['historical_context'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('historical_context', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-foreground">
                          Mashal (Parable)
                        </label>
                        <div className="flex items-center gap-2">
                          <GenerateSectionButton
                            topicId={topic?.id}
                            fieldName="mashal"
                            currentContent={formData.mashal}
                            topicContext={topicContext}
                            onGenerated={(content) => handleEditorUpdate('mashal', content)}
                          />
                          <TranslateButton
                            content={formData.mashal || ''}
                            targetLanguage="en"
                            onTranslation={(translation) => handleEditorUpdate('mashal', translation)}
                            topicId={topic?.id}
                            field="mashal"
                          />
                        </div>
                      </div>
                      <div className="border border-border rounded-md overflow-hidden">
                        <TipTapEditor
                          docId={null}
                          className="min-h-[120px]"
                          onEditorReady={(editor) => {
                            if (formData.mashal && editor) {
                              editor.commands.setContent(formData.mashal);
                            }
                            editorsRef.current['mashal'] = editor;
                          }}
                          onUpdate={(newContent) => handleEditorUpdate('mashal', newContent)}
                          onBreakStatements={async () => { }}
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
                            topicId={topic?.id}
                            fieldName="global_nimshal"
                            currentContent={formData.global_nimshal}
                            topicContext={topicContext}
                            onGenerated={(content) => handleEditorUpdate('global_nimshal', content)}
                          />
                          <TranslateButton
                            content={formData.global_nimshal || ''}
                            targetLanguage="en"
                            onTranslation={(translation) => handleEditorUpdate('global_nimshal', translation)}
                            topicId={topic?.id}
                            field="global_nimshal"
                          />
                        </div>
                      </div>
                      <div className="border border-border rounded-md overflow-hidden">
                        <TipTapEditor
                          docId={null}
                          className="min-h-[120px]"
                          onEditorReady={(editor) => {
                            if (formData.global_nimshal && editor) {
                              editor.commands.setContent(formData.global_nimshal);
                            }
                            editorsRef.current['global_nimshal'] = editor;
                          }}
                          onUpdate={(newContent) => handleEditorUpdate('global_nimshal', newContent)}
                          onBreakStatements={async () => { }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-foreground">
                        Charts & Tables
                      </label>
                      <div className="flex items-center gap-2">
                        <GenerateSectionButton
                          topicId={topic?.id}
                          fieldName="charts"
                          currentContent={formData.charts}
                          topicContext={topicContext}
                          onGenerated={(content) => handleEditorUpdate('charts', content)}
                        />
                        <TranslateButton
                          content={formData.charts || ''}
                          targetLanguage="en"
                          onTranslation={(translation) => handleEditorUpdate('charts', translation)}
                          topicId={topic?.id}
                          field="charts"
                        />
                      </div>
                    </div>
                    <div className="border border-border rounded-md overflow-hidden">
                      <TipTapEditor
                        docId={null}
                        className="min-h-[150px]"
                        onEditorReady={(editor) => {
                          if (formData.charts && editor) {
                            editor.commands.setContent(formData.charts);
                          }
                          editorsRef.current['charts'] = editor;
                        }}
                        onUpdate={(newContent) => handleEditorUpdate('charts', newContent)}
                        onBreakStatements={async () => { }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">
                      Tip: Use the "Table" tool in the editor or start with "Reference Chart" keyword for advanced rendering.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Common Confusions
                    </label>
                    <div className="space-y-4">
                      {(formData.common_confusions || []).map((item, index) => (
                        <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50 relative group">
                          <button 
                            onClick={() => {
                              const newConfusions = [...(formData.common_confusions || [])];
                              newConfusions.splice(index, 1);
                              updateFormField('common_confusions', newConfusions as any);
                            }}
                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Question</label>
                                <TranslateButton 
                                  content={item.question} 
                                  targetLanguage="en" 
                                  onTranslation={(translation) => {
                                    const newConfusions = [...(formData.common_confusions || [])];
                                    newConfusions[index] = { ...item, question: translation };
                                    updateFormField('common_confusions', newConfusions as any);
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
                                  updateFormField('common_confusions', newConfusions as any);
                                }}
                                placeholder="Question (e.g., Is this the same as... ?)"
                                className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Answer</label>
                                <TranslateButton 
                                  content={item.answer} 
                                  targetLanguage="en" 
                                  onTranslation={(translation) => {
                                    const newConfusions = [...(formData.common_confusions || [])];
                                    newConfusions[index] = { ...item, answer: translation };
                                    updateFormField('common_confusions', newConfusions as any);
                                  }}
                                  className="h-6"
                                />
                              </div>
                              <textarea 
                                value={item.answer}
                                onChange={(e) => {
                                  const newConfusions = [...(formData.common_confusions || [])];
                                  newConfusions[index] = { ...item, answer: e.target.value };
                                  updateFormField('common_confusions', newConfusions as any);
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
                          updateFormField('common_confusions', newConfusions as any);
                        }}
                        className="w-full py-2 border-2 border-dashed border-border rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add Confusion/FAQ
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-6 mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <TopicRelationshipManager
                    topicId={topic.id}
                    topicTitle={formData.canonical_title}
                    relationships={relationships}
                    onAddRelationship={handleAddRelationship}
                    onRemoveRelationship={handleRemoveRelationship}
                  />
                </div>
                <RelationshipPredictionsPanel 
                  topicId={topic.id} 
                  content={Object.values(formData).join(' ')} 
                  onAddRelationship={(p) => {
                    const relationType = isRelationType(p.relationship_type) ? p.relationship_type : 'related_to';
                    handleAddRelationship({ 
                      relatedTopicId: p.topic_id, 
                      relationType: relationType, 
                      direction: 'child', 
                      strength: p.confidence, 
                      description: p.explanation 
                    });
                  }}
                />
              </TabsContent>

              {/* Sources Tab */}
              <TabsContent value="sources" className="space-y-6 mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <SourceLinker
                    topicId={topic.id}
                    linkedSources={linkedSources}
                    onLinkSource={handleLinkSource}
                    onUnlinkSource={handleUnlinkSource}
                    onCreateSource={handleCreateSource}
                  />
                </div>
                <SmartCitationFinder 
                  context={Object.values(formData).join(' ')} 
                  onInsertCitation={(c) => {
                    const articleEditor = editorsRef.current['article'];
                    if (articleEditor) {
                      articleEditor.chain().focus().insertContent(
                        `<citation sourceId="${c.sourceId}" sourceTitle="${c.sourceTitle}" reference="${c.reference}"></citation> `
                      ).run();
                    }
                  }}
                />
              </TabsContent>

              {/* Display Tab */}
              <TabsContent value="display" className="mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <DisplayFormatSelector
                    sections={sections}
                    formData={formData}
                    onUpdateSection={handleUpdateDisplayConfig}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Save Status Toast */}
      <SaveStatusToast
        status={autoSaveStatus}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}
