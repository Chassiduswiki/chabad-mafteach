'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Tag, Star, ChevronDown } from 'lucide-react';
import { ConceptTag, TopicSearchResult } from './types';

interface ConceptTaggerProps {
  topicId: number;
  concepts: ConceptTag[];
  onAddConcept: (conceptId: number, type: 'primary' | 'secondary' | 'related') => Promise<void>;
  onRemoveConcept: (conceptId: number) => Promise<void>;
  onUpdateConceptType: (conceptId: number, type: 'primary' | 'secondary' | 'related') => Promise<void>;
}

const CONCEPT_TYPE_CONFIG = {
  primary: {
    label: 'Primary',
    description: 'Core concept central to this topic',
    color: 'bg-primary/10 text-primary border-primary/30',
    icon: Star,
  },
  secondary: {
    label: 'Secondary',
    description: 'Important supporting concept',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    icon: Tag,
  },
  related: {
    label: 'Related',
    description: 'Tangentially related concept',
    color: 'bg-muted text-muted-foreground border-border',
    icon: Tag,
  },
};

export const ConceptTagger: React.FC<ConceptTaggerProps> = ({
  topicId,
  concepts,
  onAddConcept,
  onRemoveConcept,
  onUpdateConceptType,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TopicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<'primary' | 'secondary' | 'related'>('secondary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingConceptId, setEditingConceptId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Debounced search for concepts (topics that can be used as concepts)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/topics/search?q=${encodeURIComponent(searchQuery)}&limit=8&type=concept`
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out already tagged concepts and current topic
          const existingIds = new Set(concepts.map(c => c.id));
          existingIds.add(topicId);
          const filtered = (data.data || data || []).filter(
            (t: TopicSearchResult) => !existingIds.has(t.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Concept search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, concepts, topicId]);

  const handleAddConcept = async (concept: TopicSearchResult) => {
    setIsSubmitting(true);
    try {
      await onAddConcept(concept.id, selectedType);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add concept:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveConcept = async (conceptId: number) => {
    try {
      await onRemoveConcept(conceptId);
    } catch (error) {
      console.error('Failed to remove concept:', error);
    }
  };

  const handleTypeChange = async (conceptId: number, newType: 'primary' | 'secondary' | 'related') => {
    try {
      await onUpdateConceptType(conceptId, newType);
      setEditingConceptId(null);
    } catch (error) {
      console.error('Failed to update concept type:', error);
    }
  };

  // Group concepts by type
  const groupedConcepts = {
    primary: concepts.filter(c => c.type === 'primary'),
    secondary: concepts.filter(c => c.type === 'secondary'),
    related: concepts.filter(c => c.type === 'related'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Concept Tags</h3>
          <p className="text-sm text-muted-foreground">
            Tag this topic with related concepts for better discoverability
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Concept
          </button>
        )}
      </div>

      {/* Add Concept Interface */}
      {isAdding && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Tag with Concept</h4>
            <button
              onClick={() => {
                setIsAdding(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Type Selection */}
          <div className="flex gap-2">
            {(Object.keys(CONCEPT_TYPE_CONFIG) as Array<keyof typeof CONCEPT_TYPE_CONFIG>).map((type) => {
              const config = CONCEPT_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                    selectedType === type
                      ? config.color + ' border-2'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => handleAddConcept(concept)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{concept.canonical_title}</p>
                      {concept.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {concept.description}
                        </p>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No matching concepts found
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Concept Display */}
      <div className="space-y-4">
        {/* Primary Concepts */}
        {groupedConcepts.primary.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Primary Concepts ({groupedConcepts.primary.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {groupedConcepts.primary.map((concept) => (
                <ConceptBadge
                  key={concept.id}
                  concept={concept}
                  onRemove={() => handleRemoveConcept(concept.id)}
                  onTypeChange={(type) => handleTypeChange(concept.id, type)}
                  isEditing={editingConceptId === concept.id}
                  onStartEditing={() => setEditingConceptId(concept.id)}
                  onStopEditing={() => setEditingConceptId(null)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Secondary Concepts */}
        {groupedConcepts.secondary.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Secondary Concepts ({groupedConcepts.secondary.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {groupedConcepts.secondary.map((concept) => (
                <ConceptBadge
                  key={concept.id}
                  concept={concept}
                  onRemove={() => handleRemoveConcept(concept.id)}
                  onTypeChange={(type) => handleTypeChange(concept.id, type)}
                  isEditing={editingConceptId === concept.id}
                  onStartEditing={() => setEditingConceptId(concept.id)}
                  onStopEditing={() => setEditingConceptId(null)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Concepts */}
        {groupedConcepts.related.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Related Concepts ({groupedConcepts.related.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {groupedConcepts.related.map((concept) => (
                <ConceptBadge
                  key={concept.id}
                  concept={concept}
                  onRemove={() => handleRemoveConcept(concept.id)}
                  onTypeChange={(type) => handleTypeChange(concept.id, type)}
                  isEditing={editingConceptId === concept.id}
                  onStartEditing={() => setEditingConceptId(concept.id)}
                  onStopEditing={() => setEditingConceptId(null)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {concepts.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
            <Tag className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <h4 className="font-medium text-foreground mb-1">No concepts tagged</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Tag with concepts to improve searchability and connections.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Plus className="h-3 w-3" />
              Add First Concept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Concept Badge Component
interface ConceptBadgeProps {
  concept: ConceptTag;
  onRemove: () => void;
  onTypeChange: (type: 'primary' | 'secondary' | 'related') => void;
  isEditing: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
}

const ConceptBadge: React.FC<ConceptBadgeProps> = ({
  concept,
  onRemove,
  onTypeChange,
  isEditing,
  onStartEditing,
  onStopEditing,
}) => {
  const config = CONCEPT_TYPE_CONFIG[concept.type];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onStopEditing();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, onStopEditing]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border ${config.color} group`}
      >
        <a
          href={`/topics/${concept.id}`}
          className="text-sm font-medium hover:underline"
        >
          {concept.name}
        </a>
        
        {/* Type indicator/dropdown trigger */}
        <button
          onClick={onStartEditing}
          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
        >
          <ChevronDown className="h-3 w-3" />
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Type Change Dropdown */}
      {isEditing && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px]">
          {(Object.keys(CONCEPT_TYPE_CONFIG) as Array<keyof typeof CONCEPT_TYPE_CONFIG>).map((type) => {
            const typeConfig = CONCEPT_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => onTypeChange(type)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                  concept.type === type ? 'bg-muted' : ''
                }`}
              >
                <typeConfig.icon className="h-4 w-4" />
                <span>{typeConfig.label}</span>
                {concept.type === type && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConceptTagger;
