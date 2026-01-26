'use client';

import React, { useState, useEffect } from 'react';
import { Code, Type, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Palette to avoid HMR issues
const Palette = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Palette })), { 
  ssr: false,
  loading: () => <div className="w-4 h-4 animate-pulse bg-muted rounded" />
});
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BrandingSettings {
  primaryColor: string;
  fontSans: string;
  fontHebrew: string;
  customCSS: string;
  customJS: string;
  siteBanner: string;
  bannerActive: boolean;
}

export const BrandingCustomizer: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: '#18222f',
    fontSans: 'Inter',
    fontHebrew: 'Frank Ruhl Libre',
    customCSS: '',
    customJS: '',
    siteBanner: '',
    bannerActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/branding', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
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
    try {
      setIsSaving(true);
      setStatus('idle');
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ branding: settings }),
      });

      if (!response.ok) throw new Error('Save failed');
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save branding:', error);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Site Branding & Theme
        </CardTitle>
        <CardDescription>
          Customize the visual identity and inject custom code site-wide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visuals">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="visuals" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Visuals
            </TabsTrigger>
            <TabsTrigger value="injection" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Injection
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Banners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visuals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Theme Color</Label>
                <div className="flex gap-2">
                  <Input 
                    id="primaryColor" 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    type="text" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSans">Sans Font Family</Label>
                <Input 
                  id="fontSans" 
                  value={settings.fontSans}
                  onChange={(e) => setSettings(s => ({ ...s, fontSans: e.target.value }))}
                  placeholder="Inter, system-ui..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontHebrew">Hebrew Font Family</Label>
                <Input 
                  id="fontHebrew" 
                  value={settings.fontHebrew}
                  onChange={(e) => setSettings(s => ({ ...s, fontHebrew: e.target.value }))}
                  placeholder="Frank Ruhl Libre..."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="injection" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customCSS">Custom CSS (Injected in Head)</Label>
              <Textarea 
                id="customCSS" 
                value={settings.customCSS}
                onChange={(e) => setSettings(s => ({ ...s, customCSS: e.target.value }))}
                placeholder=":root { --custom-radius: 8px; }"
                className="font-mono text-xs h-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customJS">Custom JS (Injected Before Body End)</Label>
              <Textarea 
                id="customJS" 
                value={settings.customJS}
                onChange={(e) => setSettings(s => ({ ...s, customJS: e.target.value }))}
                placeholder="console.log('Site branding active');"
                className="font-mono text-xs h-32"
              />
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label>Active Banner</Label>
                <p className="text-xs text-muted-foreground">Show a notification bar at the top of every page.</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.bannerActive}
                onChange={(e) => setSettings(s => ({ ...s, bannerActive: e.target.checked }))}
                className="h-5 w-5 accent-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteBanner">Banner Content (Markdown/HTML supported)</Label>
              <Textarea 
                id="siteBanner" 
                value={settings.siteBanner}
                onChange={(e) => setSettings(s => ({ ...s, siteBanner: e.target.value }))}
                placeholder="Welcome to the new Digital Chassidus Encyclopedia!"
                className="h-24"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'success' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Settings saved and applied.
              </span>
            )}
            {status === 'error' && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Failed to save settings.
              </span>
            )}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
