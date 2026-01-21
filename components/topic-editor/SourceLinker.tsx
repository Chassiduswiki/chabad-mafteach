'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, BookOpen, ExternalLink, Trash2, Link, User } from 'lucide-react';
import { Source } from '@/lib/types';
import { SourceLinkFormData, SourceSearchResult } from './types';

interface SourceLinkerProps {
  topicId: number;
  linkedSources: Source[];
  onLinkSource: (data: SourceLinkFormData) => Promise<void>;
  onUnlinkSource: (sourceId: number) => Promise<void>;
  onCreateSource?: (data: Partial<Source>) => Promise<Source>;
}

const RELATIONSHIP_TYPES = [
  { value: 'quotes', label: 'Quotes', description: 'Direct quotation from source' },
  { value: 'paraphrases', label: 'Paraphrases', description: 'Paraphrased from source' },
  { value: 'references', label: 'References', description: 'General reference to source' },
  { value: 'supports', label: 'Supports', description: 'Source supports this concept' },
  { value: 'contradicts', label: 'Contradicts', description: 'Source presents opposing view' },
  { value: 'discusses', label: 'Discusses', description: 'Source discusses this topic' },
];

export const SourceLinker: React.FC<SourceLinkerProps> = ({
  topicId,
  linkedSources,
  onLinkSource,
  onUnlinkSource,
  onCreateSource,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SourceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceSearchResult | null>(null);
  const [formData, setFormData] = useState<SourceLinkFormData>({
    sourceId: null,
    relationshipType: 'references',
    pageNumber: '',
    verseReference: '',
    notes: '',
  });
  const [newSourceData, setNewSourceData] = useState({
    title: '',
    author: '',
    publication_year: '',
    external_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/sources/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || data || []);
        }
      } catch (error) {
        console.error('Source search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSource = (source: SourceSearchResult) => {
    setSelectedSource(source);
    setFormData(prev => ({ ...prev, sourceId: source.id }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedSource) return;

    setIsSubmitting(true);
    try {
      await onLinkSource(formData);
      resetForm();
    } catch (error) {
      console.error('Failed to link source:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newSourceData.title.trim() || !onCreateSource) return;

    setIsSubmitting(true);
    try {
      const newSource = await onCreateSource({
        title: newSourceData.title,
        author_id: undefined, // Would need author lookup
        publication_year: newSourceData.publication_year ? parseInt(newSourceData.publication_year) : undefined,
        external_url: newSourceData.external_url || undefined,
      });

      await onLinkSource({
        sourceId: newSource.id,
        relationshipType: formData.relationshipType,
        pageNumber: formData.pageNumber,
        verseReference: formData.verseReference,
        notes: formData.notes,
      });

      resetForm();
    } catch (error) {
      console.error('Failed to create and link source:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (sourceId: number) => {
    setUnlinkingId(sourceId);
    try {
      await onUnlinkSource(sourceId);
    } catch (error) {
      console.error('Failed to unlink source:', error);
    } finally {
      setUnlinkingId(null);
    }
  };

  const resetForm = () => {
    setSelectedSource(null);
    setFormData({
      sourceId: null,
      relationshipType: 'references',
      pageNumber: '',
      verseReference: '',
      notes: '',
    });
    setNewSourceData({
      title: '',
      author: '',
      publication_year: '',
      external_url: '',
    });
    setIsAddingNew(false);
    setIsCreatingNew(false);
  };

  const getExternalBadge = (source: Source) => {
    if (!source.external_system) return null;
    const colors: Record<string, string> = {
      sefaria: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      hebrewbooks: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      wikisource: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${colors[source.external_system] || 'bg-muted'}`}>
        {source.external_system}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sources</h3>
          <p className="text-sm text-muted-foreground">
            Link primary sources and references for this topic
          </p>
        </div>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Link Source
          </button>
        )}
      </div>

      {/* Add Source Form */}
      {isAddingNew && (
        <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              {isCreatingNew ? 'Create New Source' : 'Link Existing Source'}
            </h4>
            <div className="flex items-center gap-2">
              {onCreateSource && (
                <button
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="text-sm text-primary hover:underline"
                >
                  {isCreatingNew ? 'Search existing' : 'Create new'}
                </button>
              )}
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {isCreatingNew ? (
            /* Create New Source Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newSourceData.title}
                    onChange={(e) => setNewSourceData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Tanya, Likutei Amarim"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={newSourceData.author}
                    onChange={(e) => setNewSourceData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="e.g., Alter Rebbe"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Year Published
                  </label>
                  <input
                    type="number"
                    value={newSourceData.publication_year}
                    onChange={(e) => setNewSourceData(prev => ({ ...prev, publication_year: e.target.value }))}
                    placeholder="e.g., 1796"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    External URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newSourceData.external_url}
                    onChange={(e) => setNewSourceData(prev => ({ ...prev, external_url: e.target.value }))}
                    placeholder="https://www.sefaria.org/..."
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Search Existing Source */
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Search Source
              </label>
              {selectedSource ? (
                <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-md">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedSource.title}</span>
                  {selectedSource.author && (
                    <span className="text-sm text-muted-foreground">by {selectedSource.author}</span>
                  )}
                  <button
                    onClick={() => setSelectedSource(null)}
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
                    placeholder="Search by title, author..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => handleSelectSource(source)}
                          className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-3"
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{source.title}</p>
                            {source.author && (
                              <p className="text-xs text-muted-foreground truncate">
                                {source.author}
                                {source.publication_year && ` (${source.publication_year})`}
                              </p>
                            )}
                          </div>
                          {source.external_system && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded flex-shrink-0">
                              {source.external_system}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Relationship Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Relationship Type
              </label>
              <select
                value={formData.relationshipType}
                onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Page/Chapter Reference
              </label>
              <input
                type="text"
                value={formData.pageNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, pageNumber: e.target.value }))}
                placeholder="e.g., Chapter 1, p.45"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional context about this source..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={isCreatingNew ? handleCreateAndLink : handleSubmit}
              disabled={(isCreatingNew ? !newSourceData.title.trim() : !selectedSource) || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  {isCreatingNew ? 'Creating...' : 'Linking...'}
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  {isCreatingNew ? 'Create & Link' : 'Link Source'}
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Linked Sources List */}
      <div className="space-y-3">
        {linkedSources.map((source) => (
          <div
            key={source.id}
            className="flex items-start justify-between p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{source.title}</h4>
                  {getExternalBadge(source)}
                </div>
                {source.author && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {source.author}
                    {source.publication_year && ` (${source.publication_year})`}
                  </p>
                )}
                {source.citation_text && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {source.citation_text}
                  </p>
                )}
                {source.external_url && (
                  <a
                    href={source.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View external source
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => handleUnlink(source.id)}
              disabled={unlinkingId === source.id}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
            >
              {unlinkingId === source.id ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}

        {/* Empty State */}
        {linkedSources.length === 0 && !isAddingNew && (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-foreground mb-2">No sources linked</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Link primary sources, seforim, and references for this topic.
            </p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Link First Source
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceLinker;
