'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Settings, 
  ArrowLeft, 
  Globe, 
  Lock, 
  Bell, 
  Database, 
  ShieldCheck,
  Palette,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const settingsSections = [
    {
      title: 'General',
      icon: Globe,
      items: [
        { name: 'Platform Name', value: 'Chabad Mafteach', description: 'The display name of the platform' },
        { name: 'Primary Language', value: 'Bilingual (EN/HE)', description: 'Default content language' },
        { name: 'Timezone', value: 'UTC-5 (EST)', description: 'System reporting timezone' },
      ]
    },
    {
      title: 'Security',
      icon: ShieldCheck,
      items: [
        { name: 'Authentication', value: 'OAuth 2.0 / Directus', description: 'User login provider' },
        { name: 'API Access', value: 'Restricted', description: 'Public API availability' },
        { name: 'Admin Session', value: '24 Hours', description: 'Session timeout duration' },
      ]
    },
    {
      title: 'Display',
      icon: Palette,
      items: [
        { name: 'Theme', value: 'System Adaptive', description: 'Default interface appearance' },
        { name: 'Typography', value: 'Academic / Serif', description: 'Primary font selection' },
        { name: 'Density', value: 'Comfortable', description: 'UI spacing and layout density' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/10">
      {/* Subtle Texture/Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="max-w-5xl mx-auto px-8 py-12 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-5xl font-serif italic tracking-tight text-foreground flex items-center gap-4">
            System Settings
          </h1>
          <p className="text-muted-foreground font-light text-xl mt-3">
            Configure the platform&apos;s foundational behavior and appearance.
          </p>
        </div>

        {/* Settings Grid */}
        <div className="space-y-16">
          {settingsSections.map((section) => (
            <section key={section.title} className="space-y-8">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/50">
                  <section.icon className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <h2 className="text-2xl font-serif italic">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item) => (
                  <div 
                    key={item.name}
                    className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-col h-full">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-3">
                        {item.name}
                      </span>
                      <span className="text-[15px] font-medium text-foreground mb-2">
                        {item.value}
                      </span>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed mt-auto">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-24 pt-12 border-t border-border/40 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-bold">
            <Lock className="w-3 h-3" />
            Some settings require database-level access
          </div>
        </div>
      </div>
    </div>
  );
}
