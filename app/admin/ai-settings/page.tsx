'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Shield, 
  Brain,
  Sliders,
  Terminal,
  Save,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function AISettingsPage() {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [primaryModel, setPrimaryModel] = useState('allenai/olmo-3.1-32b-think');
  const [fallbackModel, setFallbackModel] = useState('anthropic/claude-3.5-sonnet');
  const [customPrimaryModel, setCustomPrimaryModel] = useState('');
  const [customFallbackModel, setCustomFallbackModel] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(0.8);
  const [autoApprovalThreshold, setAutoApprovalThreshold] = useState(0.95);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/ai/settings');
        if (response.ok) {
          const data = await response.json();
          setProvider(data.provider || 'openrouter');
          setApiKey(data.api_key || '');
          setPrimaryModel(data.primary_model || 'allenai/olmo-3.1-32b-think');
          setFallbackModel(data.fallback_model || 'anthropic/claude-3.5-sonnet');
          setQualityThreshold(data.quality_threshold || 0.8);
          setAutoApprovalThreshold(data.auto_approval_threshold || 0.95);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const modelToTest = primaryModel === 'custom' ? customPrimaryModel : primaryModel;
      
      if (!modelToTest) {
        setTestResult({ success: false, message: 'Please enter a custom model ID' });
        setTesting(false);
        return;
      }

      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, primaryModel: modelToTest }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful! API is working correctly.' });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const finalPrimaryModel = primaryModel === 'custom' ? customPrimaryModel : primaryModel;
      const finalFallbackModel = fallbackModel === 'custom' ? customFallbackModel : fallbackModel;

      if (!finalPrimaryModel || !finalFallbackModel) {
        alert('Please enter custom model IDs or select from the dropdown');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          primary_model: finalPrimaryModel,
          fallback_model: finalFallbackModel,
          quality_threshold: qualityThreshold,
          auto_approval_threshold: autoApprovalThreshold,
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save settings: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/10">
      {/* Subtle Texture/Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="max-w-4xl mx-auto px-8 py-12 relative z-10">
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
            Intelligence Settings
          </h1>
          <p className="text-muted-foreground font-light text-xl mt-3">
            Configure linguistic models and cognitive parameters for the platform.
          </p>
        </div>

        <div className="space-y-12">
          {/* API Configuration */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/50">
                <Terminal className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <h2 className="text-2xl font-serif italic">Model Orchestration</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="provider" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-1">
                    Intelligence Provider
                  </Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger id="provider" className="h-12 bg-muted/30 border-border/60 rounded-xl focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="openrouter">OpenRouter (Unified)</SelectItem>
                      <SelectItem value="openai">OpenAI (Direct)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Direct)</SelectItem>
                      <SelectItem value="google">Google AI (Direct)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="apiKey" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-1">
                    API Credentials
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    placeholder="Enter sk-..."
                    className="h-12 bg-muted/30 border-border/60 rounded-xl focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <Label htmlFor="primaryModel" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-1">
                    Primary Reasoning Model
                  </Label>
                  <Select value={primaryModel} onValueChange={setPrimaryModel}>
                    <SelectTrigger id="primaryModel" className="h-12 bg-muted/30 border-border/60 rounded-xl focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="allenai/olmo-3.1-32b-think">Olmo 3.1 32B Think</SelectItem>
                      <SelectItem value="qwen/qwen3-next-80b-a3b-instruct:free">Qwen3 Next 80B (Free)</SelectItem>
                      <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</SelectItem>
                      <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="custom">Custom ID...</SelectItem>
                    </SelectContent>
                  </Select>
                  {primaryModel === 'custom' && (
                    <Input
                      placeholder="e.g. anthropic/claude-3-opus"
                      value={customPrimaryModel}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPrimaryModel(e.target.value)}
                      className="h-10 bg-muted/30 border-border/60 rounded-xl mt-2"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="fallbackModel" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-1">
                    Fallback Intelligence
                  </Label>
                  <Select value={fallbackModel} onValueChange={setFallbackModel}>
                    <SelectTrigger id="fallbackModel" className="h-12 bg-muted/30 border-border/60 rounded-xl focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="qwen/qwen3-next-80b-a3b-instruct:free">Qwen3 Next 80B (Free)</SelectItem>
                      <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</SelectItem>
                      <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="custom">Custom ID...</SelectItem>
                    </SelectContent>
                  </Select>
                  {fallbackModel === 'custom' && (
                    <Input
                      placeholder="e.g. openai/gpt-4"
                      value={customFallbackModel}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomFallbackModel(e.target.value)}
                      className="h-10 bg-muted/30 border-border/60 rounded-xl mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border/40">
                <button 
                  onClick={testConnection} 
                  disabled={!apiKey || testing}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                    testing ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                  {testing ? 'Verifying...' : 'Verify Connection'}
                </button>

                {testResult && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs font-medium",
                    testResult.success ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Cognitive Parameters */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/50">
                <Sliders className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <h2 className="text-2xl font-serif italic">Heuristic Thresholds</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Linguistic Accuracy</Label>
                    <p className="text-xs text-muted-foreground font-light">Minimum confidence required for saving.</p>
                  </div>
                  <span className="text-sm font-serif italic">{qualityThreshold.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[qualityThreshold]}
                  onValueChange={(v: number[]) => setQualityThreshold(v[0])}
                  className="py-4"
                />
              </div>

              <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Autonomous Approval</Label>
                    <p className="text-xs text-muted-foreground font-light">Score threshold for direct publishing.</p>
                  </div>
                  <span className="text-sm font-serif italic">{autoApprovalThreshold.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[autoApprovalThreshold]}
                  onValueChange={(v: number[]) => setAutoApprovalThreshold(v[0])}
                  className="py-4"
                />
              </div>
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-12 border-t border-border/40 flex justify-end gap-4">
            <button
              onClick={saveSettings}
              disabled={saving || !apiKey}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all shadow-lg",
                saving ? "bg-muted text-muted-foreground" : "bg-foreground text-background hover:opacity-90 shadow-foreground/5"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Synchronizing...' : 'Commit Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
