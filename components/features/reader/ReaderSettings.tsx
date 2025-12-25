'use client';

import React from 'react';
import { Settings, X, Minus, Plus, Type, Palette, Layout, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

export type ReaderSettings = {
    fontSize: number;
    fontFamily: 'serif' | 'sans';
    lineHeight: number;
    theme: string;
};

interface ReaderSettingsProps {
    settings: ReaderSettings;
    onUpdate: (settings: Partial<ReaderSettings>) => void;
    onClose: () => void;
}

export function ReaderSettingsModal({ settings, onUpdate, onClose }: ReaderSettingsProps) {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light', name: 'Vellum', class: 'bg-[#F5F5F7] text-[#111111]' },
        { id: 'theme-sepia', name: 'Sepia', class: 'bg-[#E1D7C1] text-[#2C241B]' },
        { id: 'dark', name: 'Indigo', class: 'bg-[#1C1C1E] text-[#F5F5F7]' },
        { id: 'theme-charcoal', name: 'Pitch', class: 'bg-black text-[#E5E5E5]' },
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div
                className="w-full max-w-sm rounded-2xl bg-background border border-border shadow-2xl overflow-hidden glass"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider">Reader Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-8">
                    {/* Font Size */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Type className="h-3 w-3" /> Font Size
                            </label>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{settings.fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onUpdate({ fontSize: Math.max(12, settings.fontSize - 1) })}
                                className="flex-1 flex items-center justify-center h-10 rounded-lg bg-muted hover:bg-accent transition-colors border border-border"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onUpdate({ fontSize: Math.min(32, settings.fontSize + 1) })}
                                className="flex-1 flex items-center justify-center h-10 rounded-lg bg-muted hover:bg-accent transition-colors border border-border"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Palette className="h-3 w-3" /> Color Theme
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`
                                        relative group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                                        ${t.class}
                                        ${theme === t.id ? 'border-primary ring-2 ring-primary/20 scale-95' : 'border-border hover:border-primary/50'}
                                    `}
                                >
                                    <span className="text-xs font-medium">{t.name}</span>
                                    {theme === t.id && (
                                        <div className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-2 w-2" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Layout className="h-3 w-3" /> Typography
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onUpdate({ fontFamily: 'serif' })}
                                className={`
                                    flex-1 py-3 rounded-xl border text-sm font-serif transition-colors
                                    ${settings.fontFamily === 'serif' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-accent text-foreground border-border'}
                                `}
                            >
                                Serif
                            </button>
                            <button
                                onClick={() => onUpdate({ fontFamily: 'sans' })}
                                className={`
                                    flex-1 py-3 rounded-xl border text-sm font-sans transition-colors
                                    ${settings.fontFamily === 'sans' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-accent text-foreground border-border'}
                                `}
                            >
                                Sans
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-muted/20 border-t border-border mt-2">
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.15em]">
                        Settings are saved for this session
                    </p>
                </div>
            </div>
        </div>
    );
}
