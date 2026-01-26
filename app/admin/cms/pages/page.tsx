'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  Globe, 
  Info, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Layout,
  Type,
  Search,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSiteSettings, SiteSettings } from '@/hooks/useSiteSettings';
import { TipTapEditor } from '@/components/editor/TipTapEditor';

export default function CMSPagesEditor() {
  const router = useRouter();
  const { data: settings, isLoading, refetch } = useSiteSettings();
  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/site-settings/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update settings');
      }

      setSaveStatus('success');
      refetch();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('CMS save error:', err);
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/admin')}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold font-serif italic">CMS Pages</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Edit Core Website Content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                <CheckCircle2 className="w-3 h-3" />
                Changes Saved
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-xl px-6 h-10 shadow-lg shadow-primary/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-sm font-medium">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Global Site Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-serif italic">Site Identity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Site Name</label>
              <input 
                type="text" 
                value={formData.site_name || ''} 
                onChange={(e) => setFormData({...formData, site_name: e.target.value})}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tagline</label>
              <input 
                type="text" 
                value={formData.tagline || ''} 
                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Search Placeholder</label>
              <input 
                type="text" 
                value={formData.search_placeholder || ''} 
                onChange={(e) => setFormData({...formData, search_placeholder: e.target.value})}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Homepage Hero */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Layout className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-serif italic">Homepage Hero</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Hero Title</label>
              <input 
                type="text" 
                value={formData.homepage_hero_title || ''} 
                onChange={(e) => setFormData({...formData, homepage_hero_title: e.target.value})}
                placeholder="e.g., Deepen Your Understanding"
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-serif italic text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Hero Subtitle</label>
              <textarea 
                value={formData.homepage_hero_subtitle || ''} 
                onChange={(e) => setFormData({...formData, homepage_hero_subtitle: e.target.value})}
                rows={3}
                placeholder="Briefly describe the mission of the site..."
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* About Page */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <Info className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-serif italic">About Page</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">About Title</label>
              <input 
                type="text" 
                value={formData.about_title || ''} 
                onChange={(e) => setFormData({...formData, about_title: e.target.value})}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-serif italic text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">About Content (HTML)</label>
              <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/10">
                <TipTapEditor 
                  docId={null}
                  className="min-h-[400px]"
                  onEditorReady={(editor) => {
                    if (formData.about_content) {
                      editor.commands.setContent(formData.about_content);
                    }
                  }}
                  onUpdate={(content) => setFormData({...formData, about_content: content})}
                  onBreakStatements={async () => {}}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
