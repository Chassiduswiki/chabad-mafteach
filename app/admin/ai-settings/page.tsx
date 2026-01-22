'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AISettingsPage() {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [primaryModel, setPrimaryModel] = useState('qwen/qwen3-next-80b-a3b-instruct:free');
  const [fallbackModel, setFallbackModel] = useState('anthropic/claude-3.5-sonnet');
  const [customPrimaryModel, setCustomPrimaryModel] = useState('');
  const [customFallbackModel, setCustomFallbackModel] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(0.8);
  const [autoApprovalThreshold, setAutoApprovalThreshold] = useState(0.95);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/ai/settings');
        if (response.ok) {
          const data = await response.json();
          setProvider(data.provider || 'openrouter');
          setApiKey(data.api_key || '');
          setPrimaryModel(data.primary_model || 'google/gemini-2.0-flash-exp:free');
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Translation Settings</h1>
        <p className="text-muted-foreground">
          Configure OpenRouter API settings for AI-powered translations
        </p>
      </div>

      <div className="space-y-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your OpenRouter API credentials and model preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openrouter">OpenRouter (Recommended)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google AI</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your AI provider. OpenRouter gives access to multiple models with one API key.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'openrouter' ? 'sk-or-v1-...' :
                  provider === 'openai' ? 'sk-...' :
                  provider === 'anthropic' ? 'sk-ant-...' :
                  'API key...'
                }
              />
              <p className="text-sm text-muted-foreground">
                {provider === 'openrouter' && (
                  <>Get your API key at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai</a></>
                )}
                {provider === 'openai' && (
                  <>Get your API key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a></>
                )}
                {provider === 'anthropic' && (
                  <>Get your API key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a></>
                )}
                {provider === 'google' && (
                  <>Get your API key at <a href="https://makersuite.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">makersuite.google.com</a></>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryModel">Primary Model</Label>
                <Select value={primaryModel} onValueChange={setPrimaryModel}>
                  <SelectTrigger id="primaryModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qwen/qwen3-next-80b-a3b-instruct:free">Qwen3 Next 80B (Free)</SelectItem>
                    <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</SelectItem>
                    <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="openai/gpt-4">GPT-4</SelectItem>
                    <SelectItem value="custom">Custom Model...</SelectItem>
                  </SelectContent>
                </Select>
                {primaryModel === 'custom' && (
                  <Input
                    placeholder="Enter custom model ID (e.g., provider/model-name)"
                    value={customPrimaryModel}
                    onChange={(e) => setCustomPrimaryModel(e.target.value)}
                    className="mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {primaryModel === 'custom' 
                    ? 'Enter the full model ID from OpenRouter (e.g., qwen/qwen3-next-80b-a3b-instruct:free)'
                    : 'Select a model or choose "Custom Model..." to enter your own'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackModel">Fallback Model</Label>
                <Select value={fallbackModel} onValueChange={setFallbackModel}>
                  <SelectTrigger id="fallbackModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="qwen/qwen3-next-80b-a3b-instruct:free">Qwen3 Next 80B (Free)</SelectItem>
                    <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</SelectItem>
                    <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="openai/gpt-4">GPT-4</SelectItem>
                    <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="custom">Custom Model...</SelectItem>
                  </SelectContent>
                </Select>
                {fallbackModel === 'custom' && (
                  <Input
                    placeholder="Enter custom model ID (e.g., provider/model-name)"
                    value={customFallbackModel}
                    onChange={(e) => setCustomFallbackModel(e.target.value)}
                    className="mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {fallbackModel === 'custom' 
                    ? 'Enter the full model ID from OpenRouter (e.g., anthropic/claude-3.5-sonnet)'
                    : 'Fallback model used if primary model fails'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={!apiKey || testing}>
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>

            {testResult && (
              <Alert>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quality Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Thresholds</CardTitle>
            <CardDescription>
              Configure quality scoring thresholds for translations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="qualityThreshold">Minimum Quality Threshold</Label>
                <span className="text-sm text-muted-foreground">{qualityThreshold.toFixed(2)}</span>
              </div>
              <Slider
                id="qualityThreshold"
                min={0}
                max={1}
                step={0.05}
                value={[qualityThreshold]}
                onValueChange={(value: number[]) => setQualityThreshold(value[0])}
              />
              <p className="text-sm text-muted-foreground">
                Translations below this score will not be saved
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="autoApprovalThreshold">Auto-Approval Threshold</Label>
                <span className="text-sm text-muted-foreground">{autoApprovalThreshold.toFixed(2)}</span>
              </div>
              <Slider
                id="autoApprovalThreshold"
                min={0}
                max={1}
                step={0.05}
                value={[autoApprovalThreshold]}
                onValueChange={(value: number[]) => setAutoApprovalThreshold(value[0])}
              />
              <p className="text-sm text-muted-foreground">
                Translations above this score will be automatically approved
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} size="lg" disabled={saving || !apiKey}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
