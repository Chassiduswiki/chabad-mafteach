import React, { useState } from 'react';
import { ConceptualVariant, TopicFormData } from './types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Plus, Trash2, BookOpen, Save } from 'lucide-react';
import { Source } from '@/lib/types';

interface ScholarlyTabProps {
    formData: TopicFormData;
    onUpdate: (field: keyof TopicFormData, value: any) => void;
    availableSources: Source[];
    onSave?: () => Promise<void>;
    saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

export function ScholarlyTab({ formData, onUpdate, availableSources, onSave, saveStatus = 'idle' }: ScholarlyTabProps) {
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

    // Helper function to get variant ID (handle both new variants with id and old variants with composite key)
    const getVariantId = (variant: any) => {
        if (variant.id) return variant.id;
        // For database variants without id, create a composite key
        return `${variant.type}-${variant.title || variant.order || Math.random()}`;
    };

    const handleAddVariant = () => {
        const newVariant: ConceptualVariant = {
            id: crypto.randomUUID(),
            type: 'halachic',
            content: '',
            sources: []
        };
        const currentVariants = formData.conceptual_variants || [];
        onUpdate('conceptual_variants', [...currentVariants, newVariant]);
        setActiveVariantId(newVariant.id);
    };

    const handleUpdateVariant = (id: string, updates: Partial<ConceptualVariant>) => {
        const currentVariants = formData.conceptual_variants || [];
        onUpdate(
            'conceptual_variants',
            currentVariants.map(v => (getVariantId(v) === id ? { ...v, ...updates } : v))
        );
    };

    const handleRemoveVariant = (id: string) => {
        const currentVariants = formData.conceptual_variants || [];
        const updatedVariants = currentVariants.filter(v => getVariantId(v) !== id);
        
        onUpdate('conceptual_variants', updatedVariants);
        
        if (activeVariantId === id) setActiveVariantId(null);
    };

    const handleAddSourceToVariant = (variantId: string, sourceId: number) => {
        const currentVariants = formData.conceptual_variants || [];
        const variant = currentVariants.find(v => getVariantId(v) === variantId);
        if (!variant || variant.sources.some(s => s.source_id === sourceId)) return;

        handleUpdateVariant(variantId, {
            sources: [...variant.sources, { source_id: sourceId, authority_level: 'secondary' }]
        });
    };

    const handleUpdateSourceAuthority = (variantId: string, sourceId: number, level: 'primary' | 'secondary' | 'supporting') => {
        const currentVariants = formData.conceptual_variants || [];
        const variant = currentVariants.find(v => getVariantId(v) === variantId);
        if (!variant) return;

        handleUpdateVariant(variantId, {
            sources: variant.sources.map(s =>
                s.source_id === sourceId ? { ...s, authority_level: level } : s
            )
        });
    };

    const handleRemoveSourceFromVariant = (variantId: string, sourceId: number) => {
        const currentVariants = formData.conceptual_variants || [];
        const variant = currentVariants.find(v => getVariantId(v) === variantId);
        if (!variant) return;

        handleUpdateVariant(variantId, {
            sources: variant.sources.filter(s => s.source_id !== sourceId)
        });
    };

    const getSourceTitle = (id: number) => {
        const source = availableSources.find(s => s.id === id);
        return source?.title || `Source #${id}`;
    };

    return (
        <div className="space-y-8">
            {/* Save Button Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Scholarly Content</h1>
                    <p className="text-sm text-muted-foreground">Manage terminology notes, conceptual variants, and advanced scholarly content.</p>
                </div>
                {onSave && (
                    <Button 
                        onClick={onSave} 
                        disabled={saveStatus === 'saving'}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </div>

            {/* Save Status Indicator */}
            {saveStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md">
                    Changes saved successfully!
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-md">
                    Failed to save changes. Please try again.
                </div>
            )}
            {/* Terminology Notes Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Terminology Notes</h2>
                        <p className="text-sm text-muted-foreground">Internal notes for translators and editors regarding terminology usage.</p>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Textarea
                            value={formData.terminology_notes || ''}
                            onChange={(e) => onUpdate('terminology_notes', e.target.value)}
                            placeholder="Enter terminology guidelines (Markdown supported)..."
                            className="min-h-[150px] font-mono text-sm"
                        />
                    </CardContent>
                </Card>
            </section>

            {/* Conceptual Variants Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Conceptual Variants</h2>
                        <p className="text-sm text-muted-foreground">Manage different perspectives and variations of this concept.</p>
                    </div>
                    <Button onClick={handleAddVariant}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Perspective
                    </Button>
                </div>

                <div className="space-y-4">
                    {(formData.conceptual_variants || []).length === 0 ? (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium text-muted-foreground">No variants added yet</p>
                                <p className="text-sm text-muted-foreground mb-4">Add different perspectives to enrich this topic.</p>
                                <Button onClick={handleAddVariant} variant="outline">
                                    Add First Perspective
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        (formData.conceptual_variants || []).map((variant: any) => (
                            <Card key={getVariantId(variant)} className="relative group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-2 cursor-move text-muted-foreground hover:text-foreground">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <Select
                                                    value={variant.type}
                                                    onValueChange={(v: any) => handleUpdateVariant(getVariantId(variant), { type: v })}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem key="halachic" value="halachic">Halachic</SelectItem>
                                                        <SelectItem key="kabbalistic" value="kabbalistic">Kabbalistic</SelectItem>
                                                        <SelectItem key="chassidic" value="chassidic">Chassidic</SelectItem>
                                                        <SelectItem key="historical" value="historical">Historical</SelectItem>
                                                        <SelectItem key="linguistic" value="linguistic">Linguistic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveVariant(getVariantId(variant))}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="pl-9">
                                        <TipTapEditor
                                            docId={`variant-${variant.id}`}
                                            initialContent={variant.content}
                                            onUpdate={(content) => handleUpdateVariant(variant.id, { content })}
                                            placeholder="Describe the variant relative to the core concept..."
                                            className="min-h-[150px] border rounded-md"
                                        />
                                    </div>

                                    {/* Sources Manager */}
                                    <div className="pl-9 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-muted-foreground">Variant Sources</h4>
                                            <Select onValueChange={(id) => handleAddSourceToVariant(variant.id, parseInt(id))}>
                                                <SelectTrigger className="w-[250px] h-8 text-xs">
                                                    <SelectValue placeholder="Add existing source..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSources.map(source => (
                                                        <SelectItem key={source.id} value={source.id.toString()}>
                                                            {source.title || `Source ${source.id}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            {variant.sources.map((sourceLink: any) => (
                                                <div key={sourceLink.source_id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border text-sm">
                                                    <span className="truncate flex-1 font-medium">{getSourceTitle(sourceLink.source_id)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={sourceLink.authority_level}
                                                            onValueChange={(v: any) => handleUpdateSourceAuthority(getVariantId(variant), sourceLink.source_id, v)}
                                                        >
                                                            <SelectTrigger className="h-7 w-[110px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem key="primary" value="primary">Primary</SelectItem>
                                                                <SelectItem key="secondary" value="secondary">Secondary</SelectItem>
                                                                <SelectItem key="supporting" value="supporting">Supporting</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleRemoveSourceFromVariant(getVariantId(variant), sourceLink.source_id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {variant.sources.length === 0 && (
                                                <div className="text-xs text-muted-foreground italic">No sources linked to this variant.</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
