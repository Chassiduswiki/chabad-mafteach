'use client';

import { useState, useEffect } from 'react';
import { Languages, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';

interface Translation {
    id: number;
    statement_id?: number;
    paragraph_id?: number;
    language_code: string;
    translated_text: string;
    translator_notes?: string;
    quality_score?: number;
    translation_status: 'draft' | 'review' | 'approved' | 'published';
    reviewed_by?: string;
    reviewed_at?: string;
    statement?: { text: string };
    paragraph?: { text: string };
}

interface Language {
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
}

interface TranslationInterfaceProps {
    statementId?: number;
    paragraphId?: number;
    originalText: string;
    onTranslationUpdate?: (translation: Translation) => void;
}

export function TranslationInterface({
    statementId,
    paragraphId,
    originalText,
    onTranslationUpdate
}: TranslationInterfaceProps) {
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTranslations();
        loadLanguages();
    }, [statementId, paragraphId]);

    const loadTranslations = async () => {
        try {
            const params = new URLSearchParams();
            if (statementId) params.set('statementId', statementId.toString());
            if (paragraphId) params.set('paragraphId', paragraphId.toString());

            const response = await fetch(`/api/editor/translations?${params}`);
            const data = await response.json();
            setTranslations(data.translations || []);
        } catch (error) {
            console.error('Failed to load translations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLanguages = async () => {
        try {
            const response = await fetch('/api/editor/translations/languages');
            const data = await response.json();
            setLanguages(data.languages || []);
        } catch (error) {
            console.error('Failed to load languages:', error);
        }
    };

    const startNewTranslation = (languageCode: string) => {
        setSelectedLanguage(languageCode);
        setCurrentTranslation({
            id: 0,
            statement_id: statementId,
            paragraph_id: paragraphId,
            language_code: languageCode,
            translated_text: '',
            translation_status: 'draft'
        } as Translation);
        setIsEditing(true);
    };

    const editTranslation = (translation: Translation) => {
        setCurrentTranslation(translation);
        setSelectedLanguage(translation.language_code);
        setIsEditing(true);
    };

    const saveTranslation = async () => {
        if (!currentTranslation) return;

        setSaving(true);
        try {
            const isNew = currentTranslation.id === 0;
            const method = isNew ? 'POST' : 'PATCH';
            const url = isNew ? '/api/editor/translations' : `/api/editor/translations/${currentTranslation.id}`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTranslation)
            });

            if (response.ok) {
                const data = await response.json();
                if (isNew) {
                    setTranslations(prev => [...prev, data.translation]);
                } else {
                    setTranslations(prev => prev.map(t =>
                        t.id === currentTranslation.id ? data.translation : t
                    ));
                }
                onTranslationUpdate?.(data.translation);
                setIsEditing(false);
                setCurrentTranslation(null);
            }
        } catch (error) {
            console.error('Failed to save translation:', error);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'text-gray-500';
            case 'review': return 'text-yellow-500';
            case 'approved': return 'text-blue-500';
            case 'published': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <AlertCircle className="w-4 h-4" />;
            case 'review': return <Eye className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'published': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-muted animate-pulse rounded" />
                    <div className="h-32 bg-muted animate-pulse rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Translations</h3>
                    <span className="text-sm text-muted-foreground">
                        ({translations.length} languages)
                    </span>
                </div>

                {!isEditing && (
                    <select
                        value=""
                        onChange={(e) => e.target.value && startNewTranslation(e.target.value)}
                        className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                    >
                        <option value="">Add Translation</option>
                        {languages.map((lang) => {
                            const existing = translations.find(t => t.language_code === lang.code);
                            if (existing) return null;
                            return (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            );
                        })}
                    </select>
                )}
            </div>

            {/* Original Text */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Original Text
                    </h4>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div
                            className="prose prose-sm max-w-none text-blue-900 dark:text-blue-100"
                            dangerouslySetInnerHTML={{ __html: originalText }}
                        />
                    </div>
                </div>

                {/* Translation */}
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {isEditing ? 'Translation (Editing)' : 'Translation'}
                        {currentTranslation && (
                            <span className="text-sm text-muted-foreground">
                                ({languages.find(l => l.code === currentTranslation.language_code)?.name})
                            </span>
                        )}
                    </h4>

                    {isEditing && currentTranslation ? (
                        <div className="space-y-3">
                            <div className="border border-border rounded-md">
                                <TipTapEditor
                                    docId={null}
                                    className=""
                                    onEditorReady={(editor: any) => {
                                        if (currentTranslation.translated_text && editor) {
                                            editor.commands.setContent(currentTranslation.translated_text);
                                        }
                                        editor.on('update', ({ editor }: any) => {
                                            const content = editor.getHTML();
                                            setCurrentTranslation(prev => prev ? {
                                                ...prev,
                                                translated_text: content
                                            } : null);
                                        });
                                    }}
                                    onBreakStatements={async () => {}}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={currentTranslation.translation_status}
                                    onChange={(e) => setCurrentTranslation(prev => prev ? {
                                        ...prev,
                                        translation_status: e.target.value as any
                                    } : null)}
                                    className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="review">Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="published">Published</option>
                                </select>

                                <button
                                    onClick={saveTranslation}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border border-current border-t-transparent" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save
                                </button>

                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setCurrentTranslation(null);
                                    }}
                                    className="px-3 py-1 text-muted-foreground hover:text-foreground text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg min-h-[100px]">
                            {currentTranslation ? (
                                <div
                                    className="prose prose-sm max-w-none text-green-900 dark:text-green-100"
                                    dangerouslySetInnerHTML={{ __html: currentTranslation.translated_text }}
                                />
                            ) : (
                                <div className="text-muted-foreground italic">
                                    Select a translation to view or add a new one
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Existing Translations List */}
            {translations.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Existing Translations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {translations.map((translation) => (
                            <div
                                key={translation.id}
                                className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => editTranslation(translation)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">
                                        {languages.find(l => l.code === translation.language_code)?.name || translation.language_code}
                                    </span>
                                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(translation.translation_status)}`}>
                                        {getStatusIcon(translation.translation_status)}
                                        <span className="capitalize">{translation.translation_status}</span>
                                    </div>
                                </div>

                                <div
                                    className="text-sm text-muted-foreground line-clamp-2"
                                    dangerouslySetInnerHTML={{
                                        __html: translation.translated_text.substring(0, 100) + (translation.translated_text.length > 100 ? '...' : '')
                                    }}
                                />

                                {translation.quality_score && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Quality: {translation.quality_score}/10
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
