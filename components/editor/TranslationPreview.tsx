'use client';

import { useState, useEffect } from 'react';
import { Eye, Globe, Languages } from 'lucide-react';
import { Topic } from '@/lib/types';

interface Translation {
    id: number;
    statement_id?: number;
    paragraph_id?: number;
    language_code: string;
    translated_text: string;
    translation_status: 'draft' | 'review' | 'approved' | 'published';
}

interface Language {
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
}

interface TranslationPreviewProps {
    topicId: number;
}

export function TranslationPreview({ topicId }: TranslationPreviewProps) {
    const [topic, setTopic] = useState<Topic | null>(null);
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const [previewMode, setPreviewMode] = useState<'original' | 'translated' | 'side-by-side'>('original');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTopic();
        loadTranslations();
        loadLanguages();
    }, [topicId]);

    const loadTopic = async () => {
        try {
            const response = await fetch(`/api/topics/${topicId}`);
            const data = await response.json();
            setTopic(data.topic);
        } catch (error) {
            console.error('Failed to load topic:', error);
        }
    };

    const loadTranslations = async () => {
        try {
            const response = await fetch(`/api/editor/translations`);
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

    const getTranslatedContent = (originalContent: string, contentType: 'paragraph' | 'statement', contentId: number) => {
        if (previewMode === 'original' || selectedLanguage === 'en') {
            return originalContent;
        }

        const translation = translations.find(t => {
            if (contentType === 'paragraph' && t.paragraph_id === contentId && t.language_code === selectedLanguage) {
                return true;
            }
            if (contentType === 'statement' && t.statement_id === contentId && t.language_code === selectedLanguage) {
                return true;
            }
            return false;
        });

        return translation?.translated_text || originalContent;
    };

    const getLanguageName = (code: string) => {
        return languages.find(l => l.code === code)?.name || code;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="h-96 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Topic not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Content Preview</h3>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
                    >
                        <option value="en">English (Original)</option>
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>

                    <div className="flex rounded-md border border-border overflow-hidden">
                        <button
                            onClick={() => setPreviewMode('original')}
                            className={`px-3 py-1 text-sm ${
                                previewMode === 'original'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-foreground hover:bg-muted'
                            }`}
                        >
                            Original
                        </button>
                        <button
                            onClick={() => setPreviewMode('translated')}
                            className={`px-3 py-1 text-sm ${
                                previewMode === 'translated'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-foreground hover:bg-muted'
                            }`}
                        >
                            Translated
                        </button>
                        <button
                            onClick={() => setPreviewMode('side-by-side')}
                            className={`px-3 py-1 text-sm ${
                                previewMode === 'side-by-side'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-foreground hover:bg-muted'
                            }`}
                        >
                            Side-by-Side
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Header */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {getTranslatedContent(topic.canonical_title, 'paragraph', -1)}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Languages className="w-4 h-4" />
                            <span>Previewing in {getLanguageName(selectedLanguage)}</span>
                            {previewMode !== 'original' && (
                                <span>• {previewMode === 'translated' ? 'Translated' : 'Side-by-Side'} Mode</span>
                            )}
                        </div>
                    </div>
                </div>

                {topic.description && (
                    <div className="prose prose-sm max-w-none text-foreground">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: getTranslatedContent(topic.description, 'paragraph', -2)
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Content Preview */}
            <div className="space-y-6">
                {previewMode === 'side-by-side' ? (
                    /* Side-by-Side Preview */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                English (Original)
                            </h4>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="space-y-4">
                                    {topic.paragraphs?.map((paragraph: any) => (
                                        <div key={paragraph.id} className="space-y-3">
                                            <div className="prose prose-sm max-w-none text-blue-900 dark:text-blue-100">
                                                <div dangerouslySetInnerHTML={{ __html: paragraph.text }} />
                                            </div>
                                            {paragraph.statements?.map((statement: any) => (
                                                <div key={statement.id} className="ml-4 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded border-l-4 border-blue-300 dark:border-blue-700">
                                                    <div
                                                        className="text-sm text-blue-800 dark:text-blue-200"
                                                        dangerouslySetInnerHTML={{ __html: statement.text }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {getLanguageName(selectedLanguage)} (Translation)
                            </h4>
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="space-y-4">
                                    {topic.paragraphs?.map((paragraph: any) => (
                                        <div key={paragraph.id} className="space-y-3">
                                            <div className="prose prose-sm max-w-none text-green-900 dark:text-green-100">
                                                <div dangerouslySetInnerHTML={{
                                                    __html: getTranslatedContent(paragraph.text, 'paragraph', paragraph.id)
                                                }} />
                                            </div>
                                            {paragraph.statements?.map((statement: any) => (
                                                <div key={statement.id} className="ml-4 p-3 bg-green-100/50 dark:bg-green-900/20 rounded border-l-4 border-green-300 dark:border-green-700">
                                                    <div
                                                        className="text-sm text-green-800 dark:text-green-200"
                                                        dangerouslySetInnerHTML={{
                                                            __html: getTranslatedContent(statement.text, 'statement', statement.id)
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Single Preview */
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="space-y-6">
                            {topic.paragraphs?.map((paragraph: any) => (
                                <div key={paragraph.id} className="space-y-4">
                                    <div className="prose prose-sm max-w-none text-foreground">
                                        <div dangerouslySetInnerHTML={{
                                            __html: getTranslatedContent(paragraph.text, 'paragraph', paragraph.id)
                                        }} />
                                    </div>
                                    {paragraph.statements && paragraph.statements.length > 0 && (
                                        <div className="space-y-2">
                                            {paragraph.statements.map((statement: any) => (
                                                <div key={statement.id} className="ml-6 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                                                    <div
                                                        className="text-sm text-foreground"
                                                        dangerouslySetInnerHTML={{
                                                            __html: getTranslatedContent(statement.text, 'statement', statement.id)
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Notes */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-2">Preview Notes</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• This preview shows how the content will appear on the public topic page</li>
                    <li>• Only approved and published translations are shown in the live site</li>
                    <li>• Missing translations fall back to the original English content</li>
                    <li>• Use side-by-side mode to compare original and translated content</li>
                </ul>
            </div>
        </div>
    );
}
