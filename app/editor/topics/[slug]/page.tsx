'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Topic, Source } from '@/lib/types';
import {
  TopicRelationshipManager,
  SourceLinker,
  ConceptTagger,
  DisplayFormatSelector,
  TopicVersionHistory,
  useAutoSave,
  useSaveShortcut,
  TopicFormData,
  RelationshipFormData,
  SourceLinkFormData,
  ConceptTag,
  AIContentGeneratorDialog,
  AIRelationshipFinderDialog,
  AICitationSuggestorDialog,
  isRelationType,
  RelationshipPredictionsPanel,
  SmartCitationFinder,
  AIChatPanel,
} from '@/components/topic-editor';
import {
  TopicEditorHeader,
  TopicEditorTabs,
  TopicEditorSidebar,
  BasicInfoSection,
  DefinitionSection,
  MainContentSection,
  SupplementarySection,
  AdvancedSection,
  UnifiedCommandPalette,
  ScholarlyTab,
} from '@/components/topic-editor';
import { useTopicEditorState } from '@/components/topic-editor/hooks/useTopicEditorState';
import { useCommandPalette } from '@/components/topic-editor/hooks/useCommandPalette';
import { SaveStatusToast } from '@/components/ui/SaveStatusToast';
import { useSmartSlug } from '@/hooks/useSmartSlug';
import { useAIFieldAutoComplete } from '@/hooks/useAIFieldAutoComplete';
import { useTopicLock } from '@/hooks/useTopicLock';

export default function TopicEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Use state management hook
  const state = useTopicEditorState();

  // UI state
  const [manualSaveStatus, setManualSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [concepts, setConcepts] = useState<ConceptTag[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // AI Dialog states
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showRelationshipFinder, setShowRelationshipFinder] = useState(false);
  const [showCitationSuggestor, setShowCitationSuggestor] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Smart slug hook
  const { isAvailable, alternatives, loading: slugLoading, generateSlug } = useSmartSlug(
    state.formData.slug,
    state.originalSlug,
    state.formData.canonical_title_transliteration || state.formData.canonical_title_en || '',
    !state.formData.slug
  );

  // Auto-generate slug when transliteration/english title changes
  useEffect(() => {
    const sourceText = state.formData.canonical_title_transliteration || state.formData.canonical_title_en || '';
    if (sourceText && !state.formData.slug) {
      const generated = generateSlug(sourceText);
      if (generated) {
        state.updateFormField('slug', generated);
      }
    }
  }, [state.formData.canonical_title_transliteration, state.formData.canonical_title_en, state.formData.slug]);

  // AI Field Auto-Complete
  const {
    suggestions: aiSuggestions,
    isLoading: isAICompleting,
    applySuggestion,
    dismissSuggestion,
  } = useAIFieldAutoComplete(
    {
      canonical_title: state.formData.canonical_title,
      canonical_title_en: state.formData.canonical_title_en,
      canonical_title_transliteration: state.formData.canonical_title_transliteration,
      topic_type: state.formData.topic_type,
      description: state.formData.description,
    },
    (field, value) => state.updateFormField(field as keyof TopicFormData, value),
    {
      enabled: !!state.topic && !state.isLoading,
      autoApply: true,
      confidenceThreshold: 0.75,
      onAutoApplied: (applied) => {
        console.log('AI auto-filled fields:', applied.map(s => s.field).join(', '));
      },
    }
  );

  // Topic lock hook
  const { isLocked, lockedBy, isOwner, error: lockError } = useTopicLock({
    slug,
    enabled: !!state.topic && !state.isLoading
  });

  // --- Translation Handling (Hoisted for use in AutoSave) ---

  const handleTranslationSave = useCallback(async (field: keyof TopicFormData, content: string) => {
    if (!state.topic) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/topics/translations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          topicId: state.topic.id,
          language: 'en',
          field,
          value: content,
        }),
      });
    } catch (error) {
      console.error(`Failed to save translation for ${field}:`, error);
    }
  }, [state.topic]);

  // Helper to save translations in batch
  const saveTranslationsInBatch = async (data: TopicFormData) => {
    if (!state.topic) return;

    const translatableFields = [
      'description', 'overview', 'article', 'definition_positive',
      'definition_negative', 'practical_takeaways', 'historical_context',
      'mashal', 'global_nimshal', 'charts', 'common_confusions'
    ];

    // Process sequentially to rely on connection pooling rather than flooding
    // OPTIMIZATION: Only save fields that have actually changed
    for (const field of translatableFields) {
      const value = data[field as keyof TopicFormData];
      const initialValue = (state.topic as any)[field];

      // Only save if defined AND changed from initial/last loaded value
      // We accept loose equality for null/undefined vs empty string if needed, but strict is safer here
      if (typeof value !== 'undefined' && value !== initialValue) {
        try {
          await handleTranslationSave(field as keyof TopicFormData, value as string);
        } catch (e) {
          console.warn(`Failed to save translation field ${field}`, e);
        }
      }
    }
  };

  // Enhanced editor update handler (No longer saves on every keystroke)
  const handleEditorUpdate = (field: keyof TopicFormData, content: string) => {
    state.handleEditorUpdate(field, content);
  };

  // ---------------------------------------------------------

  // Auto-save handler
  const handleAutoSave = useCallback(async (data: TopicFormData) => {
    if (!state.topic) return;

    try {
      // const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${state.topic.slug || slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Auto-save failed');
      }

      // Also save translations in batch (debounced via auto-save)
      await saveTranslationsInBatch(data);
    } catch (error) {
      console.error('Auto-save error:', error);
      throw error;
    }
  }, [state.topic, slug]);

  const {
    isSaving: isAutoSaving,
    lastSaved,
    saveStatus: autoSaveStatus,
    hasUnsavedChanges,
    triggerSave,
    markAsSaved,
  } = useAutoSave(state.formData, {
    debounceMs: 5000,
    onSave: handleAutoSave,
    enabled: !!state.topic,
  });

  // Manual save handler
  const handleManualSave = async () => {
    if (!state.topic) return;

    setManualSaveStatus('saving');

    try {
      const displayConfig = state.displayConfigChanged ? state.buildDisplayConfigForSave() : undefined;
      const saveData = {
        ...state.formData,
        ...(displayConfig && { display_config: displayConfig })
      };

      // 1. Save standard topic data
      // const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${state.topic.slug || slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${response.status}`);
      }

      // 2. Save translations (this ensures all rich text fields are persisted to translations table)
      await saveTranslationsInBatch(state.formData);

      setManualSaveStatus('success');
      markAsSaved();

      // Reload topic data
      await loadTopic();

      setTimeout(() => setManualSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setManualSaveStatus('error');
    }
  };

  // Save shortcut
  useSaveShortcut(() => {
    handleManualSave();
  });

  // Load topic data
  const loadTopic = async () => {
    try {
      state.setIsLoading(true);
      const response = await fetch(`/api/topics/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to load topic: ${response.status}`);
      }

      const data = await response.json();
      const topicData = data.topic || data;

      state.initializeFromTopic(topicData);

      // Load relationships
      await loadRelationships(topicData.id);

      // Load linked sources
      await loadSources(topicData.slug);

    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      state.setIsLoading(false);
    }
  };

  const loadRelationships = async (topicId: number) => {
    try {
      const response = await fetch(`/api/topics/${topicId}/relationships`);
      if (response.ok) {
        const data = await response.json();
        state.setRelationships(data.data || data || []);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  const loadSources = async (topicSlug: string) => {
    try {
      const response = await fetch(`/api/topics/${topicSlug}/sources`);
      if (response.ok) {
        const data = await response.json();
        state.setLinkedSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  // Load topic on mount
  useEffect(() => {
    if (slug) {
      loadTopic();
    }
  }, [slug]);

  // AI field generation handler
  const handleGenerateField = async (fieldId: string) => {
    state.setIsLoading(true);
    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          topic_id: state.topic?.id,
          field_name: fieldId,
          topic_context: state.topicContext
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.generated_content) {
          state.handleEditorUpdate(fieldId as keyof TopicFormData, data.generated_content);
        }
      }
    } catch (err) {
      console.error(`Failed to generate ${fieldId}:`, err);
    } finally {
      state.setIsLoading(false);
    }
  };

  // Relationship handlers
  const handleAddRelationship = async (data: RelationshipFormData) => {
    if (!state.topic || !data.relatedTopicId) return;

    const payload = {
      parent_topic_id: data.direction === 'parent' ? data.relatedTopicId : state.topic.id,
      child_topic_id: data.direction === 'child' ? data.relatedTopicId : state.topic.id,
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

    await loadRelationships(state.topic.id);
  };

  const handleRemoveRelationship = async (relationshipId: number) => {
    const response = await fetch(`/api/topic-relationships/${relationshipId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to remove relationship');

    state.setRelationships(prev => prev.filter(r => r.id !== relationshipId));
  };

  // Source handlers
  const handleLinkSource = async (data: SourceLinkFormData) => {
    if (!state.topic || !data.sourceId) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${state.topic.slug}/sources`, {
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

      await loadSources(state.topic.slug);
    } catch (error) {
      console.error('Failed to link source:', error);
      throw error;
    }
  };

  const handleUnlinkSource = async (sourceId: number) => {
    if (!state.topic) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${state.topic.slug}/sources?source_id=${sourceId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unlink source');
      }

      state.setLinkedSources(prev => prev.filter(s => s.id !== sourceId));
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
    const newConcept: ConceptTag = {
      id: conceptId,
      name: `Concept ${conceptId}`,
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

  // AI Event Listeners
  useEffect(() => {
    const handleGenerateArticle = () => setShowContentGenerator(true);
    const handleFindRelationships = () => setShowRelationshipFinder(true);
    const handleSuggestCitations = () => setShowCitationSuggestor(true);

    const handleGenerateAllMissing = async () => {
      const missingFields = [
        'definition_positive', 'definition_negative', 'overview', 'article',
        'practical_takeaways', 'historical_context', 'mashal', 'global_nimshal'
      ].filter(field => !state.formData[field as keyof TopicFormData]);

      if (missingFields.length === 0) return;

      state.setIsLoading(true);
      for (const field of missingFields) {
        await handleGenerateField(field);
      }
      state.setIsLoading(false);
    };

    const handleTranslateAllToEnglish = async () => {
      const translatableFields: Array<{ source: keyof TopicFormData, target: keyof TopicFormData }> = [
        { source: 'canonical_title', target: 'canonical_title_en' },
        { source: 'description', target: 'description_en' },
        { source: 'definition_positive', target: 'definition_positive' },
        { source: 'definition_negative', target: 'definition_negative' },
        { source: 'overview', target: 'overview' },
        { source: 'article', target: 'article' },
        { source: 'practical_takeaways', target: 'practical_takeaways' },
        { source: 'historical_context', target: 'historical_context' },
        { source: 'mashal', target: 'mashal' },
        { source: 'global_nimshal', target: 'global_nimshal' },
      ];

      state.setIsLoading(true);
      for (const { source, target } of translatableFields) {
        const content = state.formData[source];
        if (!content || (typeof content === 'string' && content.length < 2)) continue;

        try {
          const response = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({
              topic_id: state.topic?.id,
              source_language: 'he',
              target_language: 'en',
              field: source,
              content: content,
              context: state.topicContext
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.translation) {
              if (target === 'canonical_title_en' || target === 'description_en') {
                state.updateFormField(target, data.translation);
              } else {
                handleEditorUpdate(target, data.translation);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to translate ${source}:`, err);
        }
      }
      state.setIsLoading(false);
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
  }, [state.topic, state.formData, state.topicContext]);

  // Command palette setup
  const commandPalette = useCommandPalette({
    topicId: state.topic?.id,
    topicTitle: state.formData.canonical_title,
    onGenerateArticle: () => setShowContentGenerator(true),
    onGenerateSection: (sectionId) => handleGenerateField(sectionId),
    onFillAllEmpty: () => window.dispatchEvent(new CustomEvent('ai-generate-all-missing')),
    onTranslateAll: () => window.dispatchEvent(new CustomEvent('ai-translate-all')),
    onFindRelatedTopics: () => setShowRelationshipFinder(true),
    onSuggestCitations: () => setShowCitationSuggestor(true),
    onOpenAIChat: () => setShowChatPanel(true),
  });

  // CMD+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPalette.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPalette.toggle]);

  // Content generated handler
  const handleContentGenerated = (content: string) => {
    const articleEditor = state.editorsRef.current['article'];
    if (articleEditor) {
      articleEditor.commands.setContent(content);
    }
  };

  // Get combined save status
  const getSaveStatus = (): 'idle' | 'saving' | 'success' | 'error' => {
    if (manualSaveStatus === 'saving' || isAutoSaving) return 'saving';
    if (manualSaveStatus === 'success' || autoSaveStatus === 'success') return 'success';
    if (manualSaveStatus === 'error' || autoSaveStatus === 'error') return 'error';
    return 'idle';
  };

  // Loading state
  if (state.isLoading) {
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
  if (!state.topic) {
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

      {/* AI Dialogs */}
      <AIContentGeneratorDialog
        open={showContentGenerator}
        onOpenChange={setShowContentGenerator}
        topicTitle={state.formData.canonical_title}
        onContentGenerated={handleContentGenerated}
      />
      <AIRelationshipFinderDialog
        open={showRelationshipFinder}
        onOpenChange={setShowRelationshipFinder}
        topicId={state.topic.id}
        content={Object.values(state.formData).join(' ')}
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
        query={state.formData.canonical_title}
        context={Object.values(state.formData).join(' ')}
        onInsertCitation={(c) => console.log('Insert citation:', c)}
      />
      <AIChatPanel
        open={showChatPanel}
        onOpenChange={setShowChatPanel}
        topicTitle={state.formData.canonical_title}
      />

      {/* Header */}
      <TopicEditorHeader
        topicId={state.topic.id}
        topicSlug={state.topic.slug}
        title={state.formData.canonical_title}
        topicType={state.formData.topic_type}
        status={state.formData.status || 'draft'}
        saveStatus={getSaveStatus()}
        lastSaved={lastSaved || undefined}
        hasUnsavedChanges={hasUnsavedChanges}
        isLocked={isLocked}
        isOwner={isOwner}
        onSave={handleManualSave}
        onStatusChange={(status) => state.updateFormField('status', status)}
        onHistoryClick={() => setShowHistory(true)}
        onTranslateAll={() => window.dispatchEvent(new CustomEvent('ai-translate-all'))}
        onFillAll={() => window.dispatchEvent(new CustomEvent('ai-generate-all-missing'))}
        onOpenCommandPalette={commandPalette.open}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${(isLocked && !isOwner) ? 'opacity-75 pointer-events-none' : ''}`}>
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-[80px]">
              <TopicEditorSidebar
                formData={state.formData}
                relationshipCount={state.relationships.length}
                sourceCount={state.linkedSources.length}
                isAICompleting={isAICompleting}
                onGenerateField={handleGenerateField}
                onFillAllEmpty={() => window.dispatchEvent(new CustomEvent('ai-generate-all-missing'))}
                onTranslateAll={() => window.dispatchEvent(new CustomEvent('ai-translate-all'))}
                onOpenCommandPalette={commandPalette.open}
                onOpenAIChat={() => setShowChatPanel(true)}
              />
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <TopicEditorTabs
              activeTab={state.activeTab}
              onTabChange={state.setActiveTab}
              editContent={
                <div className="space-y-6">
                  <BasicInfoSection
                    formData={state.formData}
                    topicId={state.topic?.id}
                    originalSlug={state.originalSlug}
                    slugLoading={slugLoading}
                    isAvailable={isAvailable}
                    alternatives={alternatives}
                    editorsRef={state.editorsRef}
                    onFieldChange={state.updateFormField}
                    onEditorUpdate={handleEditorUpdate}
                    defaultOpen={true}
                  />

                  <DefinitionSection
                    formData={state.formData}
                    topicId={state.topic?.id}
                    topicContext={state.topicContext}
                    editorsRef={state.editorsRef}
                    onEditorUpdate={handleEditorUpdate}
                    onGenerateField={handleGenerateField}
                  />

                  <MainContentSection
                    formData={state.formData}
                    topicId={state.topic?.id}
                    topicContext={state.topicContext}
                    editorsRef={state.editorsRef}
                    onEditorUpdate={handleEditorUpdate}
                    onGenerateField={handleGenerateField}
                    defaultOpen={true}
                  />

                  <SupplementarySection
                    formData={state.formData}
                    topicId={state.topic?.id}
                    topicContext={state.topicContext}
                    editorsRef={state.editorsRef}
                    onEditorUpdate={handleEditorUpdate}
                    onGenerateField={handleGenerateField}
                  />

                  <AdvancedSection
                    formData={state.formData}
                    topicId={state.topic?.id}
                    topicContext={state.topicContext}
                    editorsRef={state.editorsRef}
                    onFieldChange={state.updateFormField}
                    onEditorUpdate={handleEditorUpdate}
                    onGenerateField={handleGenerateField}
                  />
                </div>
              }
              connectionsContent={
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Relationships</h2>
                    <TopicRelationshipManager
                      topicId={state.topic.id}
                      topicTitle={state.formData.canonical_title}
                      relationships={state.relationships}
                      onAddRelationship={handleAddRelationship}
                      onRemoveRelationship={handleRemoveRelationship}
                    />
                  </div>

                  <RelationshipPredictionsPanel
                    topicId={state.topic.id}
                    content={Object.values(state.formData).join(' ')}
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

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Sources</h2>
                    <SourceLinker
                      topicId={state.topic.id}
                      linkedSources={state.linkedSources}
                      onLinkSource={handleLinkSource}
                      onUnlinkSource={handleUnlinkSource}
                      onCreateSource={handleCreateSource}
                    />
                  </div>

                  <SmartCitationFinder
                    context={Object.values(state.formData).join(' ')}
                    onInsertCitation={(c) => {
                      const articleEditor = state.editorsRef.current['article'];
                      if (articleEditor) {
                        articleEditor.chain().focus().insertCitation({
                          id: `cite_${Math.random().toString(36).substring(2, 12)}`,
                          sourceId: c.sourceId,
                          sourceTitle: c.sourceTitle,
                          citationType: 'reference',
                          reference: c.reference,
                        }).run();
                      }
                    }}
                  />
                </div>
              }
              scholarlyContent={
                <ScholarlyTab
                  formData={state.formData}
                  onUpdate={state.updateFormField}
                  availableSources={state.linkedSources}
                  onSave={handleManualSave}
                  saveStatus={getSaveStatus()}
                />
              }
              settingsContent={
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Display Configuration</h2>
                    <DisplayFormatSelector
                      sections={state.sections}
                      formData={state.formData}
                      onUpdateSection={state.handleUpdateDisplayConfig}
                    />
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Concept Tagging</h2>
                    <ConceptTagger
                      topicId={state.topic.id}
                      concepts={concepts}
                      onAddConcept={handleAddConcept}
                      onRemoveConcept={handleRemoveConcept}
                      onUpdateConceptType={handleUpdateConceptType}
                    />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <UnifiedCommandPalette
        open={commandPalette.isOpen}
        onOpenChange={commandPalette.setIsOpen}
        commands={commandPalette.commands}
        hasSelection={commandPalette.hasSelection}
        activeSection={commandPalette.activeSection}
      />

      {/* Version History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <TopicVersionHistory
            slug={slug}
            onRevert={() => {
              loadTopic();
              markAsSaved();
              setShowHistory(false);
            }}
            className="h-full"
          />
        </DialogContent>
      </Dialog>

      {/* Save Status Toast */}
      <SaveStatusToast
        status={autoSaveStatus}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}
