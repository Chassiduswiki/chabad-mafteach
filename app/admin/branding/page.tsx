'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Save, 
  RefreshCw, 
  ArrowLeft, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Megaphone, 
  Code,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaveStatusToast } from '@/components/ui/SaveStatusToast';

export default function BrandingStudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    logo: '',
    primaryColor: '#6366f1',
    accentColor: '#f43f5e',
    fontSerif: 'Playfair Display',
    fontSans: 'Inter',
    bannerText: '',
    bannerEnabled: false,
    customCss: '',
    customJs: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/branding');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch branding settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding: settings })
      });
      if (res.ok) {
        setSaveStatus('success');
        setLastSaved(new Date());
        console.log('Settings saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save branding settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/v2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif italic">Branding Studio</h1>
            <p className="text-muted-foreground">Customize your platform's identity and appearance</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-full px-6 py-6 shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <SaveStatusToast 
        status={saveStatus} 
        lastSaved={lastSaved} 
      />

      <Tabs defaultValue="visuals" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1 rounded-2xl h-14">
          <TabsTrigger value="visuals" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Palette className="h-4 w-4" /> Visuals
          </TabsTrigger>
          <TabsTrigger value="typography" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Type className="h-4 w-4" /> Type
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Megaphone className="h-4 w-4" /> Banner
          </TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Code className="h-4 w-4" /> Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visuals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  Logo & Identity
                </CardTitle>
                <CardDescription>Upload or link your site logo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input 
                    id="logo" 
                    placeholder="https://example.com/logo.png" 
                    value={settings.logo}
                    onChange={(e) => setSettings({...settings, logo: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="p-8 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/30">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo preview" className="max-h-20" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">No logo configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-500" />
                  Color Palette
                </CardTitle>
                <CardDescription>Define your brand's core colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="primaryColor" 
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                        className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                      />
                      <Input 
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                        className="font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl shadow-inner border border-border/50" style={{ backgroundColor: settings.primaryColor }} />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="accentColor" 
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                        className="w-12 h-10 p-1 rounded-lg cursor-pointer"
                      />
                      <Input 
                        value={settings.accentColor}
                        onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                        className="font-mono rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl shadow-inner border border-border/50" style={{ backgroundColor: settings.accentColor }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="typography">
          <Card className="rounded-3xl border-border/50 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-purple-500" />
                Typography
              </CardTitle>
              <CardDescription>Select font families for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fontSerif">Display Font (Serif)</Label>
                <Input 
                  id="fontSerif" 
                  value={settings.fontSerif}
                  onChange={(e) => setSettings({...settings, fontSerif: e.target.value})}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Used for headings and emphasis. Example: 'Playfair Display'</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSans">Interface Font (Sans-Serif)</Label>
                <Input 
                  id="fontSans" 
                  value={settings.fontSans}
                  onChange={(e) => setSettings({...settings, fontSans: e.target.value})}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Used for navigation and UI elements. Example: 'Inter'</p>
              </div>
              
              <div className="mt-8 p-6 bg-muted/20 rounded-2xl border border-border/50">
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-4 opacity-50">Preview</div>
                <h2 className="text-2xl mb-2" style={{ fontFamily: settings.fontSerif }}>The quick brown fox jumps over the lazy dog</h2>
                <p className="text-sm" style={{ fontFamily: settings.fontSans }}>The quick brown fox jumps over the lazy dog</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card className="rounded-3xl border-border/50 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                Global Banner
              </CardTitle>
              <CardDescription>Display an announcement bar at the top of every page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Banner</Label>
                  <p className="text-xs text-muted-foreground">Toggle visibility for all users</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, bannerEnabled: !settings.bannerEnabled})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.bannerEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.bannerEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerText">Banner Message</Label>
                <Textarea 
                  id="bannerText" 
                  placeholder="Welcome to the new Mafteach portal..." 
                  value={settings.bannerText}
                  onChange={(e) => setSettings({...settings, bannerText: e.target.value})}
                  className="rounded-2xl min-h-[100px]"
                />
              </div>

              {settings.bannerEnabled && (
                <div className="p-3 bg-primary text-primary-foreground rounded-lg text-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  {settings.bannerText || 'Your announcement will appear here'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-slate-500" />
                Code Injection
              </CardTitle>
              <CardDescription>Inject custom styles or scripts globally. Use with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customCss" className="flex items-center gap-2">
                  <Layout className="h-3.5 w-3.5" /> Custom CSS
                </Label>
                <Textarea 
                  id="customCss" 
                  placeholder="body { background: #f0f0f0; }" 
                  value={settings.customCss}
                  onChange={(e) => setSettings({...settings, customCss: e.target.value})}
                  className="rounded-2xl min-h-[200px] font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customJs" className="flex items-center gap-2">
                  <Code className="h-3.5 w-3.5" /> Custom JavaScript
                </Label>
                <Textarea 
                  id="customJs" 
                  placeholder="console.log('Mafteach Custom Script Loaded');" 
                  value={settings.customJs}
                  onChange={(e) => setSettings({...settings, customJs: e.target.value})}
                  className="rounded-2xl min-h-[200px] font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
