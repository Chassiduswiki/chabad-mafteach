'use client';

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sun,
  Moon,
  Check,
  ChevronLeft,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  Square,
  Circle,
  Hexagon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StyleSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  darkModeDefault: boolean;
}

const defaultSettings: StyleSettings = {
  primaryColor: '#2563eb',
  accentColor: '#8b5cf6',
  fontFamily: 'system',
  borderRadius: 'lg',
  darkModeDefault: false,
};

const colorPresets = [
  { name: 'Blue', primary: '#2563eb', accent: '#3b82f6' },
  { name: 'Purple', primary: '#7c3aed', accent: '#8b5cf6' },
  { name: 'Emerald', primary: '#059669', accent: '#10b981' },
  { name: 'Rose', primary: '#e11d48', accent: '#f43f5e' },
  { name: 'Amber', primary: '#d97706', accent: '#f59e0b' },
  { name: 'Slate', primary: '#475569', accent: '#64748b' },
];

const fontOptions = [
  { value: 'system', label: 'System Default', sample: 'font-sans' },
  { value: 'serif', label: 'Serif', sample: 'font-serif' },
  { value: 'mono', label: 'Monospace', sample: 'font-mono' },
];

const radiusOptions = [
  { value: 'none', label: 'Sharp', icon: Square },
  { value: 'sm', label: 'Subtle', icon: Square },
  { value: 'md', label: 'Rounded', icon: Square },
  { value: 'lg', label: 'Smooth', icon: Circle },
  { value: 'full', label: 'Pill', icon: Hexagon },
];

export default function BrandingStylePage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<StyleSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ type: null, message: '' });

  const { isLoading } = useQuery({
    queryKey: ['branding-style'],
    queryFn: async () => {
      const res = await fetch('/api/admin/branding/style');
      if (!res.ok) {
        // Return defaults if API doesn't exist yet
        return defaultSettings;
      }
      const data = await res.json();
      setSettings(data.settings || defaultSettings);
      return data.settings || defaultSettings;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: StyleSettings) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/admin/branding/style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: (data) => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['branding-style'] });

      // Show success with persistence info
      const layers = data.persistedTo || ['unknown'];
      if (data.warning) {
        setSaveStatus({ type: 'warning', message: data.warning });
      } else {
        setSaveStatus({ type: 'success', message: `Saved to: ${layers.join(', ')}` });
      }

      // Clear status after 4 seconds
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 4000);
    },
    onError: (error) => {
      setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 4000);
    },
  });

  const updateSetting = <K extends keyof StyleSettings>(key: K, value: StyleSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="space-y-10 p-10 max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/branding" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-4xl font-serif italic text-foreground">Design Tokens</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Customize the visual appearance of your site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="rounded-xl"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </header>

      {/* Save Status Feedback */}
      {saveStatus.type && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl text-sm transition-all",
          saveStatus.type === 'success' && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
          saveStatus.type === 'warning' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
          saveStatus.type === 'error' && "bg-red-500/10 text-red-600 border border-red-500/20"
        )}>
          {saveStatus.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {saveStatus.type === 'warning' && <AlertCircle className="w-4 h-4" />}
          {saveStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {saveStatus.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Color Settings */}
          <div className="bg-card/50 border border-border/50 rounded-3xl p-8 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Palette className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif italic">Colors</h2>
                <p className="text-xs text-muted-foreground">Brand color palette</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-3">
                  Color Presets
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateSetting('primaryColor', preset.primary);
                        updateSetting('accentColor', preset.accent);
                      }}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all flex items-center gap-2",
                        settings.primaryColor === preset.primary
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30 hover:bg-muted/50"
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-sm"
                        style={{ background: preset.primary }}
                      />
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="bg-card/50 border border-border/50 rounded-3xl p-8 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Type className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif italic">Typography</h2>
                <p className="text-xs text-muted-foreground">Font settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                Font Family
              </label>
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => updateSetting('fontFamily', font.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all text-left",
                    settings.fontFamily === font.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={cn("text-lg", font.sample)}>{font.label}</div>
                      <div className={cn("text-xs text-muted-foreground", font.sample)}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                    {settings.fontFamily === font.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="bg-card/50 border border-border/50 rounded-3xl p-8 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif italic">Border Radius</h2>
                <p className="text-xs text-muted-foreground">Corner styling</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('borderRadius', option.value as StyleSettings['borderRadius'])}
                  className={cn(
                    "p-4 border-2 transition-all flex flex-col items-center gap-2",
                    option.value === 'none' && "rounded-none",
                    option.value === 'sm' && "rounded-sm",
                    option.value === 'md' && "rounded-md",
                    option.value === 'lg' && "rounded-lg",
                    option.value === 'full' && "rounded-2xl",
                    settings.borderRadius === option.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 bg-foreground/20",
                    option.value === 'none' && "rounded-none",
                    option.value === 'sm' && "rounded-sm",
                    option.value === 'md' && "rounded-md",
                    option.value === 'lg' && "rounded-lg",
                    option.value === 'full' && "rounded-full",
                  )} />
                  <span className="text-[10px] font-bold uppercase">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-card/50 border border-border/50 rounded-3xl p-8 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif italic">Theme</h2>
                <p className="text-xs text-muted-foreground">Default appearance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateSetting('darkModeDefault', false)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                  !settings.darkModeDefault
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="w-16 h-12 rounded-lg bg-white border border-border shadow-sm" />
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light Mode</span>
                </div>
              </button>

              <button
                onClick={() => updateSetting('darkModeDefault', true)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                  settings.darkModeDefault
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-700 shadow-sm" />
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
