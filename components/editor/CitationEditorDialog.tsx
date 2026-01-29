"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CitationAttrs } from './plugins/citations/comprehensiveCitationPlugin';

interface CitationEditorDialogProps {
  open: boolean;
  citation: CitationAttrs | null;
  onSave: (citation: Partial<CitationAttrs>) => void;
  onClose: () => void;
}

export function CitationEditorDialog({ 
  open, 
  citation, 
  onSave, 
  onClose 
}: CitationEditorDialogProps) {
  const [formData, setFormData] = useState<Partial<CitationAttrs>>({
    citation_type: "page",
    page_number: "",
    chapter_number: null,
    section_number: null,
    daf_number: "",
    halacha_number: null,
    verse_number: "",
    custom_reference: "",
    quote: "",
    note: "",
    url: "",
  });

  useEffect(() => {
    if (citation) {
      setFormData({
        citation_type: citation.citation_type || "page",
        page_number: citation.page_number || "",
        chapter_number: citation.chapter_number || null,
        section_number: citation.section_number || null,
        daf_number: citation.daf_number || "",
        halacha_number: citation.halacha_number || null,
        verse_number: citation.verse_number || "",
        custom_reference: citation.custom_reference || "",
        quote: citation.quote || "",
        note: citation.note || "",
        url: citation.url || "",
      });
    }
  }, [citation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateField = (field: keyof CitationAttrs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format preview
  const formatPreview = () => {
    if (!citation) return "";
    
    const { source_title } = citation;
    let ref = "";
    
    switch (formData.citation_type) {
      case "page":
        ref = formData.page_number ? ` ${formData.page_number}` : "";
        break;
      case "chapter":
        if (formData.chapter_number) {
          ref = ` ch. ${formData.chapter_number}`;
          if (formData.section_number) ref += `:${formData.section_number}`;
        }
        break;
      case "section":
        if (formData.section_number) {
          ref = formData.chapter_number 
            ? ` ch. ${formData.chapter_number}, §${formData.section_number}` 
            : ` §${formData.section_number}`;
        }
        break;
      case "daf":
        ref = formData.daf_number ? ` ${formData.daf_number}` : "";
        break;
      case "verse":
        ref = formData.verse_number ? ` ${formData.verse_number}` : "";
        break;
      case "halacha":
        if (formData.halacha_number) {
          ref = formData.chapter_number 
            ? ` ${formData.chapter_number}:${formData.halacha_number}` 
            : ` ${formData.halacha_number}`;
        }
        break;
      case "custom":
        ref = formData.custom_reference ? ` ${formData.custom_reference}` : "";
        break;
    }
    
    return `${source_title}${ref}`;
  };

  if (!citation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Citation</DialogTitle>
          <DialogDescription>
            Edit the citation details including source, reference, and type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Title (read-only) */}
          <div>
            <Label>Source</Label>
            <Input 
              value={citation.source_title} 
              disabled 
              className="bg-gray-50"
            />
          </div>

          {/* Citation Type Selector */}
          <div>
            <Label>Citation Type</Label>
            <Select 
              value={formData.citation_type} 
              onValueChange={(value) => updateField('citation_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page Number</SelectItem>
                <SelectItem value="chapter">Chapter</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="daf">Daf (Talmud)</SelectItem>
                <SelectItem value="verse">Verse</SelectItem>
                <SelectItem value="halacha">Halacha</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields based on citation type */}
          {formData.citation_type === 'page' && (
            <div>
              <Label>Page Number</Label>
              <Input 
                value={formData.page_number || ""} 
                onChange={(e) => updateField('page_number', e.target.value)}
                placeholder="e.g., 17a, 23b, 142"
              />
            </div>
          )}

          {formData.citation_type === 'chapter' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter Number</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Section Number (optional)</Label>
                <Input 
                  type="number"
                  value={formData.section_number || ""} 
                  onChange={(e) => updateField('section_number', parseInt(e.target.value) || null)}
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'section' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter Number (optional)</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Section Number</Label>
                <Input 
                  type="number"
                  value={formData.section_number || ""} 
                  onChange={(e) => updateField('section_number', parseInt(e.target.value) || null)}
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'daf' && (
            <div>
              <Label>Daf Number</Label>
              <Input 
                value={formData.daf_number || ""} 
                onChange={(e) => updateField('daf_number', e.target.value)}
                placeholder="e.g., 3b:6 or 31a"
              />
            </div>
          )}

          {formData.citation_type === 'verse' && (
            <div>
              <Label>Verse Reference</Label>
              <Input 
                value={formData.verse_number || ""} 
                onChange={(e) => updateField('verse_number', e.target.value)}
                placeholder="e.g., 1:5 or Genesis 1:5"
              />
            </div>
          )}

          {formData.citation_type === 'halacha' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chapter/Siman (optional)</Label>
                <Input 
                  type="number"
                  value={formData.chapter_number || ""} 
                  onChange={(e) => updateField('chapter_number', parseInt(e.target.value) || null)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Halacha Number</Label>
                <Input 
                  type="number"
                  value={formData.halacha_number || ""} 
                  onChange={(e) => updateField('halacha_number', parseInt(e.target.value) || null)}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          {formData.citation_type === 'custom' && (
            <div>
              <Label>Custom Reference</Label>
              <Input 
                value={formData.custom_reference || ""} 
                onChange={(e) => updateField('custom_reference', e.target.value)}
                placeholder="Enter custom reference format"
              />
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-border my-4 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Additional Information (Optional)</h3>
          </div>

          {/* Quote field */}
          <div>
            <Label>Quote from Source</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.quote || ""}
              onChange={(e) => updateField('quote', e.target.value)}
              placeholder="Paste the exact quote from the source..."
            />
          </div>

          {/* Note field */}
          <div>
            <Label>Note</Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.note || ""}
              onChange={(e) => updateField('note', e.target.value)}
              placeholder="Add any notes about this citation..."
            />
          </div>

          {/* URL field */}
          <div>
            <Label>Direct Link (URL)</Label>
            <Input 
              type="url"
              value={formData.url || ""} 
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://sefaria.org/... or other link"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm text-gray-600">Preview</Label>
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium border border-blue-200">
                {formatPreview()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Citation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
