'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, ArrowRight, Link2, Trash2, ChevronDown } from 'lucide-react';
import { Topic, TopicRelationship } from '@/lib/types';
import { RelationType, RelationshipFormData, TopicSearchResult } from './types';

interface TopicRelationshipManagerProps {
  topicId: number;
  topicTitle: string;
  relationships: TopicRelationship[];
  onAddRelationship: (data: RelationshipFormData) => Promise<void>;
  onRemoveRelationship: (relationshipId: number) => Promise<void>;
  onUpdateRelationship?: (relationshipId: number, data: Partial<RelationshipFormData>) => Promise<void>;
}

const RELATION_TYPES: { value: RelationType; label: string; description: string }[] = [
  { value: 'subcategory', label: 'Subcategory', description: 'This topic is a subcategory of...' },
  { value: 'instance_of', label: 'Instance Of', description: 'This topic is an instance/example of...' },
  { value: 'part_of', label: 'Part Of', description: 'This topic is part of...' },
  { value: 'related_to', label: 'Related To', description: 'This topic is related to...' },
  { value: 'conceptual_parent', label: 'Conceptual Parent', description: 'This topic has a parent concept...' },
  { value: 'sefirah_hierarchy', label: 'Sefirah Hierarchy', description: 'Kabbalistic sefirah relationship' },
  { value: 'chronological', label: 'Chronological', description: 'Timeline/historical relationship' },
];

export const TopicRelationshipManager: React.FC<TopicRelationshipManagerProps> = ({
  topicId,
  topicTitle,
  relationships,
  onAddRelationship,
  onRemoveRelationship,
  onUpdateRelationship,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TopicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicSearchResult | null>(null);
  const [formData, setFormData] = useState<RelationshipFormData>({
    relatedTopicId: null,
    relationType: 'related_to',
    strength: 0.5,
    description: '',
    direction: 'child',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/topics/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current topic from results
          const filtered = (data.data || data || []).filter(
            (t: TopicSearchResult) => t.id !== topicId
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, topicId]);

  const handleSelectTopic = (topic: TopicSearchResult) => {
    setSelectedTopic(topic);
    setFormData(prev => ({ ...prev, relatedTopicId: topic.id }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedTopic) return;

    setIsSubmitting(true);
    try {
      await onAddRelationship(formData);
      // Reset form
      setSelectedTopic(null);
      setFormData({
        relatedTopicId: null,
        relationType: 'related_to',
        strength: 0.5,
        description: '',
        direction: 'child',
      });
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to add relationship:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (relationshipId: number) => {
    setDeletingId(relationshipId);
    try {
      await onRemoveRelationship(relationshipId);
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Separate relationships into parent and child
  const parentRelationships = relationships.filter(
    r => r.child_topic_id === topicId || (r as any).childTopic?.id === topicId
  );
  const childRelationships = relationships.filter(
    r => r.parent_topic_id === topicId || (r as any).parentTopic?.id === topicId
  );

  const getRelatedTopicFromRelationship = (rel: TopicRelationship, direction: 'parent' | 'child') => {
    if (direction === 'parent') {
      return (rel as any).parentTopic || { id: rel.parent_topic_id, canonical_title: `Topic #${rel.parent_topic_id}` };
    }
    return (rel as any).childTopic || { id: rel.child_topic_id, canonical_title: `Topic #${rel.child_topic_id}` };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Topic Relationships</h3>
          <p className="text-sm text-muted-foreground">
            Define how this topic connects to other topics
          </p>
        </div>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Relationship
          </button>
        )}
      </div>

      {/* Add New Relationship Form */}
      {isAddingNew && (
        <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">New Relationship</h4>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setSelectedTopic(null);
                setSearchQuery('');
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Topic Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Related Topic
            </label>
            {selectedTopic ? (
              <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-md">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedTopic.canonical_title}</span>
                {selectedTopic.topic_type && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {selectedTopic.topic_type}
                  </span>
                )}
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="ml-auto p-1 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a topic..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic)}
                        className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{topic.canonical_title}</p>
                          {topic.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {topic.description}
                            </p>
                          )}
                        </div>
                        {topic.topic_type && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">
                            {topic.topic_type}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Relationship Direction */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Direction
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  value="child"
                  checked={formData.direction === 'child'}
                  onChange={() => setFormData(prev => ({ ...prev, direction: 'child' }))}
                  className="text-primary"
                />
                <span className="text-sm">
                  <strong>{topicTitle}</strong> → {selectedTopic?.canonical_title || '...'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  value="parent"
                  checked={formData.direction === 'parent'}
                  onChange={() => setFormData(prev => ({ ...prev, direction: 'parent' }))}
                  className="text-primary"
                />
                <span className="text-sm">
                  {selectedTopic?.canonical_title || '...'} → <strong>{topicTitle}</strong>
                </span>
              </label>
            </div>
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Relationship Type
            </label>
            <select
              value={formData.relationType}
              onChange={(e) => setFormData(prev => ({ ...prev, relationType: e.target.value as RelationType }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {RELATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Strength Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Relationship Strength: {Math.round(formData.strength * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.strength}
              onChange={(e) => setFormData(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Explain how these topics are related..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedTopic || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Relationship
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setSelectedTopic(null);
              }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Relationships */}
      <div className="space-y-4">
        {/* Parent Relationships (topics this one belongs to) */}
        {parentRelationships.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Parent Topics ({parentRelationships.length})
            </h4>
            <div className="space-y-2">
              {parentRelationships.map((rel) => {
                const relatedTopic = getRelatedTopicFromRelationship(rel, 'parent');
                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <a
                          href={`/topics/${relatedTopic.slug || relatedTopic.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {relatedTopic.canonical_title}
                        </a>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{rel.relation_type}</span>
                          {rel.strength && (
                            <span>{Math.round((rel.strength || 0) * 100)}% strength</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(rel.id)}
                      disabled={deletingId === rel.id}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === rel.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Child Relationships (topics that belong to this one) */}
        {childRelationships.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Child Topics ({childRelationships.length})
            </h4>
            <div className="space-y-2">
              {childRelationships.map((rel) => {
                const relatedTopic = getRelatedTopicFromRelationship(rel, 'child');
                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <a
                          href={`/topics/${relatedTopic.slug || relatedTopic.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {relatedTopic.canonical_title}
                        </a>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{rel.relation_type}</span>
                          {rel.strength && (
                            <span>{Math.round((rel.strength || 0) * 100)}% strength</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(rel.id)}
                      disabled={deletingId === rel.id}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === rel.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {relationships.length === 0 && !isAddingNew && (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
            <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-foreground mb-2">No relationships yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Connect this topic to related concepts, parent categories, or subtopics.
            </p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add First Relationship
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicRelationshipManager;
