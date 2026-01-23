"use client";

import React, { useState, useEffect } from "react";
import { useSefariaText } from "@/lib/hooks/useSefariaText";
import { CitationAttrs } from "./plugins/citations/comprehensiveCitationPlugin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Save, X, BookOpen, Calendar, User, Hash } from "lucide-react";

interface CitationViewerModalProps {
  open: boolean;
  citation: CitationAttrs | null;
  citationContent?: string; // HTML content of the citation
  onClose: () => void;
}

interface SourceDetails {
  id: number;
  title: string;
  citation_text?: string;
  metadata?: any;
  author?: {
    id: number;
    canonical_name: string;
    birth_year?: number;
    death_year?: number;
    era?: string;
    bio_summary?: string;
  };
  original_lang?: string;
  publication_year?: number;
  publisher?: string;
  isbn?: string;
  external_url?: string;
}

export function CitationViewerModal({ open, citation, citationContent, onClose }: CitationViewerModalProps) {
  const [sourceDetails, setSourceDetails] = useState<SourceDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SourceDetails>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (citation?.source_id && open) {
      fetchSourceDetails(citation.source_id);
    }
  }, [citation?.source_id, open]);

  const fetchSourceDetails = async (sourceId: number | string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sources/${sourceId}`);
      if (response.ok) {
        const data = await response.json();
        setSourceDetails(data);
        setEditForm(data);
      }
    } catch (error) {
      console.error('Failed to fetch source details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sourceDetails) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/sources/${sourceDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setSourceDetails(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save source:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !citation) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Citation</p>
            <p className="text-lg font-semibold text-foreground">
              {citation.source_title ?? "Citation"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sourceDetails ? (
            <>
              {/* Source Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {sourceDetails.title}
                  </h3>
                  {sourceDetails.author && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>{sourceDetails.author.canonical_name}</span>
                      {sourceDetails.author.birth_year && (
                        <span>({sourceDetails.author.birth_year}{sourceDetails.author.death_year ? `-${sourceDetails.author.death_year}` : ''})</span>
                      )}
                      {sourceDetails.author.era && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          {sourceDetails.author.era}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {/* Author Bio */}
              {sourceDetails.author?.bio_summary && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-2">About the Author</p>
                  <p className="text-sm text-muted-foreground">{sourceDetails.author.bio_summary}</p>
                </div>
              )}

              {/* Citation Text */}
              {sourceDetails.citation_text && (
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Citation Format</p>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm text-foreground italic">{sourceDetails.citation_text}</p>
                  </div>
                </div>
              )}

              {/* Publication Details */}
              <div className="grid grid-cols-2 gap-4">
                {sourceDetails.publication_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Published: {sourceDetails.publication_year}</span>
                  </div>
                )}
                {sourceDetails.publisher && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{sourceDetails.publisher}</span>
                  </div>
                )}
                {sourceDetails.isbn && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ISBN: {sourceDetails.isbn}</span>
                  </div>
                )}
              </div>

              {/* External Link */}
              {sourceDetails.external_url && (
                <div>
                  <a
                    href={sourceDetails.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View Source →
                  </a>
                </div>
              )}

              {/* Citation Content from editor */}
              {citationContent && (
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Cited Content</p>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div
                      className="text-foreground prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: citationContent }}
                    />
                  </div>
                </div>
              )}

              {/* Current Reference */}
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-sm uppercase tracking-wide text-muted-foreground mb-1">Citation Reference</p>
                <p className="text-foreground font-mono text-sm">
                  {citation.reference || "Not specified"}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Source details not available
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Source: {sourceDetails?.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="citation_text">Citation Format</Label>
                <Textarea
                  id="citation_text"
                  value={editForm.citation_text || ''}
                  onChange={(e) => setEditForm({ ...editForm, citation_text: e.target.value })}
                  placeholder="e.g., Tanya, Chapter 32, p. 45"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publication_year">Publication Year</Label>
                  <Input
                    id="publication_year"
                    type="number"
                    value={editForm.publication_year || ''}
                    onChange={(e) => setEditForm({ ...editForm, publication_year: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={editForm.publisher || ''}
                    onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={editForm.isbn || ''}
                  onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="external_url">External URL</Label>
                <Input
                  id="external_url"
                  value={editForm.external_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, external_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
