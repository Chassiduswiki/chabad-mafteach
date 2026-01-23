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
  Eye,
  Key,
  Users,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthStatus {
  success: boolean;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    hasStaticToken: boolean;
  }>;
  tokenBreakdown: {
    appJwt: {
      name: string;
      description: string;
      usage: string;
      expiration: string;
      mechanism: string;
      activeUsers: number;
    };
    directusStatic: {
      name: string;
      description: string;
      usage: string;
      usersWithToken: Array<{ name: string; role: string }>;
    };
    systemSecret: {
      name: string;
      description: string;
      usage: string;
      status: string;
    };
  };
}

export default function AdminSettingsPage() {
  const [authStatus, setAuthStatus] = React.useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAuthStatus() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/admin/auth-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Admin access required to view these settings.');
          }
          throw new Error('Failed to fetch authentication status.');
        }
        
        const data = await response.json();
        setAuthStatus(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuthStatus();
  }, []);

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
        <div className="space-y-24">
          {/* Authentication & Tokens Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary/60" />
              </div>
              <h2 className="text-2xl font-serif italic">Authentication & Tokens</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-light italic">Loading authentication status...</span>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-destructive uppercase tracking-widest mb-1">Access Error</h3>
                  <p className="text-sm text-destructive/80 font-light italic">{error}</p>
                </div>
              </div>
            ) : authStatus && (
              <div className="grid grid-cols-1 gap-12">
                {/* Token Types Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* App JWT */}
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Key className="w-12 h-12" />
                    </div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-4">
                      {authStatus.tokenBreakdown.appJwt.name}
                    </h3>
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {authStatus.tokenBreakdown.appJwt.description}
                      </p>
                      <div className="pt-4 border-t border-border/20 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground/60">Usage:</span>
                          <span className="font-medium">{authStatus.tokenBreakdown.appJwt.usage}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground/60">Expiration:</span>
                          <span className="font-medium text-amber-500/80">{authStatus.tokenBreakdown.appJwt.expiration}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground/60">Eligible Users:</span>
                          <span className="font-medium">{authStatus.tokenBreakdown.appJwt.activeUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Directus Static */}
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Database className="w-12 h-12" />
                    </div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-4">
                      {authStatus.tokenBreakdown.directusStatic.name}
                    </h3>
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {authStatus.tokenBreakdown.directusStatic.description}
                      </p>
                      <div className="pt-4 border-t border-border/20 space-y-2">
                        <div className="text-[11px] text-muted-foreground/60 mb-2">Users with Tokens:</div>
                        {authStatus.tokenBreakdown.directusStatic.usersWithToken.length > 0 ? (
                          authStatus.tokenBreakdown.directusStatic.usersWithToken.map(u => (
                            <div key={u.name} className="flex justify-between text-[11px]">
                              <span className="font-medium truncate max-w-[120px]">{u.name}</span>
                              <span className="text-muted-foreground/40">{u.role}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] font-light italic opacity-40">None configured</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Secret */}
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Lock className="w-12 h-12" />
                    </div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold mb-4">
                      {authStatus.tokenBreakdown.systemSecret.name}
                    </h3>
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {authStatus.tokenBreakdown.systemSecret.description}
                      </p>
                      <div className="pt-4 border-t border-border/20 space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground/60">Status:</span>
                          <span className={cn(
                            "font-bold",
                            authStatus.tokenBreakdown.systemSecret.status === 'Configured' ? "text-green-500/80" : "text-destructive"
                          )}>
                            {authStatus.tokenBreakdown.systemSecret.status}
                          </span>
                        </div>
                        <div className="flex flex-col text-[11px] gap-1 pt-2">
                          <span className="text-muted-foreground/60">Primary Usage:</span>
                          <span className="font-light italic leading-tight text-muted-foreground/80">
                            {authStatus.tokenBreakdown.systemSecret.usage}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users List Table */}
                <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/30">
                  <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground/60" />
                      <h3 className="text-sm font-medium">User Access Directory</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">
                      {authStatus.users.length} Total Users
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-light">
                      <thead>
                        <tr className="border-b border-border/20 bg-muted/10">
                          <th className="px-6 py-3 font-medium text-muted-foreground/60 text-[11px] uppercase tracking-widest">Name & Email</th>
                          <th className="px-6 py-3 font-medium text-muted-foreground/60 text-[11px] uppercase tracking-widest">Role</th>
                          <th className="px-6 py-3 font-medium text-muted-foreground/60 text-[11px] uppercase tracking-widest">Static Token</th>
                          <th className="px-6 py-3 font-medium text-muted-foreground/60 text-[11px] uppercase tracking-widest text-right">App Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {authStatus.users.map((user) => (
                          <tr key={user.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{user.name}</span>
                                <span className="text-xs text-muted-foreground/60 font-mono">{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                user.role?.toLowerCase().includes('admin') ? "bg-primary/10 text-primary/80" : "bg-muted text-muted-foreground/60"
                              )}>
                                {user.role || 'No Role'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {user.hasStaticToken ? (
                                <div className="flex items-center gap-1.5 text-green-500/70 font-medium text-xs italic">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30 italic text-xs">Not Set</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground/60 italic font-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500/40 animate-pulse" />
                                Can Sign In
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

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
                      <p className="text-xs text-muted-foreground font-light leading-relaxed mt-auto italic">
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
            Some settings require direct database intervention
          </div>
        </div>
      </div>
    </div>
  );
}

