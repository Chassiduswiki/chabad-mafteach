# AI Integration Implementation Guide

**Status:** Planning Phase  
**Priority:** High  
**Date Created:** January 22, 2026  
**Target:** Phase 1 - AI Translation System

---

## 🎯 Overview

This document outlines the technical implementation for integrating OpenRouter API into the Chabad Mafteach system for AI-powered translations and content assistance.

---

## 🔧 Technical Architecture

### 1. API Integration Layer

**File:** `lib/ai/openrouter.ts`
```typescript
interface OpenRouterConfig {
  apiKey: string;
  model: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
}

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
  topicId?: number;
  field?: string;
}

interface TranslationResponse {
  translatedText: string;
  quality: number;
  model: string;
  tokensUsed: number;
  processingTime: number;
}
```

### 2. Environment Configuration

**File:** `.env.local`
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=anthropic/claude-3-opus
OPENROUTER_BACKUP_MODEL=openai/gpt-4-turbo
OPENROUTER_MAX_TOKENS=4000
OPENROUTER_TEMPERATURE=0.3

# Translation Settings
TRANSLATION_QUALITY_THRESHOLD=0.8
AUTO_APPROVE_THRESHOLD=0.95
BATCH_SIZE=10
```

### 3. Directus Settings Integration

**Collection:** `ai_settings`
```typescript
{
  id: string,
  openrouter_api_key: string,  // Encrypted
  preferred_model: string,
  fallback_model: string,
  translation_quality_threshold: number,
  auto_approve_threshold: number,
  max_tokens_per_request: number,
  temperature: number,
  enabled_models: string[],
  custom_prompts: {
    translation: string,
    writing_assistant: string,
    content_enhancement: string
  }
}
```

---

## 🚀 Implementation Steps

### Step 1: Create OpenRouter Client

**File:** `lib/ai/openrouter-client.ts`
```typescript
import OpenAI from 'openai';

export class OpenRouterClient {
  private client: OpenAI;
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      dangerouslyAllowBrowser: false // Server-side only
    });
    this.config = config;
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    const prompt = this.buildTranslationPrompt(request);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.sourceLanguage, request.targetLanguage)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const translatedText = response.choices[0]?.message?.content || '';
      const quality = this.calculateQuality(translatedText, request);
      
      return {
        translatedText,
        quality,
        model: this.config.model,
        tokensUsed: response.usage?.total_tokens || 0,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      // Try fallback model
      if (this.config.fallbackModel !== this.config.model) {
        return this.translateWithFallback(request);
      }
      throw error;
    }
  }

  private buildTranslationPrompt(request: TranslationRequest): string {
    let prompt = `Translate the following text from ${request.sourceLanguage} to ${request.targetLanguage}:\n\n`;
    prompt += request.text;
    
    if (request.context) {
      prompt += `\n\nContext: ${request.context}`;
    }
    
    if (request.field) {
      prompt += `\n\nField type: ${request.field}`;
    }
    
    prompt += `\n\nThis is for a Chassidic encyclopedia. Please maintain appropriate tone and terminology.`;
    
    return prompt;
  }

  private getSystemPrompt(sourceLang: string, targetLang: string): string {
    return `You are a professional translator specializing in Chassidic literature and concepts. 
    Translate from ${sourceLang} to ${targetLang} with attention to:
    1. Accurate translation of Chassidic terminology
    2. Appropriate cultural and religious context
    3. Consistent terminology across translations
    4. Clear, accessible language for modern readers
    5. Preservation of spiritual and philosophical nuances`;
  }

  private calculateQuality(translatedText: string, request: TranslationRequest): number {
    // Simple quality scoring based on length, structure, and content
    const originalLength = request.text.length;
    const translatedLength = translatedText.length;
    const lengthRatio = translatedLength / originalLength;
    
    // Ideal ratio is between 0.8 and 1.5 for most translations
    let score = 1.0;
    
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      score -= 0.3; // Significant length difference
    } else if (lengthRatio < 0.7 || lengthRatio > 1.7) {
      score -= 0.15; // Moderate length difference
    }
    
    // Check for common quality indicators
    if (!translatedText.includes('?') && request.text.includes('?')) {
      score -= 0.1; // Missing question marks
    }
    
    return Math.max(0, Math.min(1, score));
  }
}
```

### Step 2: Create API Endpoint

**File:** `app/api/ai/translate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAISettings } from '@/lib/ai/settings';
import { OpenRouterClient } from '@/lib/ai/openrouter-client';
import { createTranslationRecord } from '@/lib/ai/translation-history';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!auth && !isDev) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic_id, target_language, source_language, field, context } = body;

    if (!topic_id || !target_language || !source_language || !field) {
      return NextResponse.json(
        { error: 'Missing required fields: topic_id, target_language, source_language, field' },
        { status: 400 }
      );
    }

    // Get AI settings from Directus
    const aiSettings = await getAISettings();
    
    if (!aiSettings.openrouter_api_key) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 400 }
      );
    }

    // Get topic content to translate
    const topic = await getTopicById(topic_id);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const sourceText = topic[field];
    if (!sourceText) {
      return NextResponse.json(
        { error: 'Source field is empty' },
        { status: 400 }
      );
    }

    // Initialize OpenRouter client
    const client = new OpenRouterClient({
      apiKey: aiSettings.openrouter_api_key,
      model: aiSettings.preferred_model || 'anthropic/claude-3-opus',
      fallbackModel: aiSettings.fallback_model || 'openai/gpt-4-turbo',
      maxTokens: aiSettings.max_tokens_per_request || 4000,
      temperature: aiSettings.temperature || 0.3
    });

    // Perform translation
    const translation = await client.translate({
      text: sourceText,
      sourceLanguage,
      targetLanguage,
      context,
      topicId,
      field
    });

    // Check quality threshold
    if (translation.quality < aiSettings.translation_quality_threshold) {
      return NextResponse.json({
        error: 'Translation quality below threshold',
        translation,
        quality: translation.quality,
        threshold: aiSettings.translation_quality_threshold
      }, { status: 422 });
    }

    // Save translation to topic_translations table
    const translationRecord = await createTranslationRecord({
      topic_id,
      language_code: target_language,
      field,
      original_text: sourceText,
      translated_text: translation.translatedText,
      quality: translation.quality,
      model: translation.model,
      tokens_used: translation.tokensUsed,
      processing_time: translation.processingTime,
      auto_approved: translation.quality >= aiSettings.auto_approve_threshold
    });

    return NextResponse.json({
      success: true,
      translation: translationRecord,
      quality: translation.quality,
      auto_approved: translation.quality >= aiSettings.auto_approve_threshold
    });

  } catch (error: any) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
```

### Step 3: Create Admin UI for API Key Management

**File:** `app/admin/ai-settings/page.tsx`
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Save, Key, Settings, TestTube } from 'lucide-react';

export default function AISettingsPage() {
  const [settings, setSettings] = useState({
    openrouter_api_key: '',
    preferred_model: 'anthropic/claude-3-opus',
    fallback_model: 'openai/gpt-4-turbo',
    translation_quality_threshold: 0.8,
    auto_approve_threshold: 0.95,
    max_tokens_per_request: 4000,
    temperature: 0.3
  });

  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: settings.openrouter_api_key })
      });
      
      const result = await response.json();
      if (response.ok) {
        setTestResult('✅ Connection successful!');
      } else {
        setTestResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8" />
        <h1 className="text-3xl font-bold">AI Settings</h1>
      </div>

      <div className="space-y-6">
        {/* API Key Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-semibold">OpenRouter API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={settings.openrouter_api_key}
                onChange={(e) => setSettings({...settings, openrouter_api_key: e.target.value})}
                className="w-full p-2 border border-border rounded-md"
                placeholder="sk-or-v1-..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Get your API key from <a href="https://openrouter.ai" target="_blank" className="text-primary">OpenRouter.ai</a>
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Primary Model</label>
                <select
                  value={settings.preferred_model}
                  onChange={(e) => setSettings({...settings, preferred_model: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                >
                  <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                  <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="openai/gpt-4">GPT-4</option>
                  <option value="google/gemini-pro">Gemini Pro</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Fallback Model</label>
                <select
                  value={settings.fallback_model}
                  onChange={(e) => setSettings({...settings, fallback_model: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                >
                  <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="openai/gpt-4">GPT-4</option>
                  <option value="google/gemini-pro">Gemini Pro</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleTestConnection}
                disabled={!settings.openrouter_api_key || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
                Test Connection
              </button>
              
              {testResult && (
                <span className={`text-sm ${testResult.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Translation Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Translation Settings</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quality Threshold</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.translation_quality_threshold}
                onChange={(e) => setSettings({...settings, translation_quality_threshold: parseFloat(e.target.value)})}
                className="w-full p-2 border border-border rounded-md"
              />
              <p className="text-sm text-muted-foreground mt-1">Minimum quality to accept translation</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Auto-Approve Threshold</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.auto_approve_threshold}
                onChange={(e) => setSettings({...settings, auto_approve_threshold: parseFloat(e.target.value)})}
                className="w-full p-2 border border-border rounded-md"
              />
              <p className="text-sm text-muted-foreground mt-1">Quality level for automatic approval</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Tokens</label>
              <input
                type="number"
                min="100"
                max="8000"
                value={settings.max_tokens_per_request}
                onChange={(e) => setSettings({...settings, max_tokens_per_request: parseInt(e.target.value)})}
                className="w-full p-2 border border-border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Temperature</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                className="w-full p-2 border border-border rounded-md"
              />
              <p className="text-sm text-muted-foreground mt-1">Creativity level (0 = literal, 1 = creative)</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 Security Considerations

### API Key Encryption
- Store API keys encrypted in database
- Use environment variables for development
- Implement key rotation support
- Audit trail for API key changes

### Rate Limiting
- Implement per-user rate limiting
- Monitor API usage and costs
- Set daily/monthly limits
- Alert on unusual usage patterns

### Content Filtering
- Validate input content before translation
- Filter inappropriate content
- Log translation requests for audit
- Implement content moderation

---

## 📊 Monitoring & Analytics

### Translation Metrics
- Success rate by language pair
- Average processing time
- Quality score distribution
- Model performance comparison

### Cost Tracking
- Tokens used per translation
- Cost per translation
- Monthly cost projections
- Cost optimization recommendations

### Usage Analytics
- Most translated topics
- Field translation frequency
- User translation patterns
- Peak usage times

---

## 🧪 Testing Strategy

### Unit Tests
- OpenRouter client functionality
- Translation quality scoring
- API endpoint validation
- Error handling scenarios

### Integration Tests
- End-to-end translation flow
- Database integration
- Directus settings sync
- Fallback model switching

### Performance Tests
- Concurrent translation requests
- Large content handling
- Memory usage monitoring
- Response time benchmarks

---

## 📚 Dependencies

### Required Packages
```json
{
  "openai": "^4.0.0",
  "crypto-js": "^4.2.0",
  "@types/crypto-js": "^4.2.0"
}
```

### Environment Variables
```bash
# Production
OPENROUTER_API_KEY=your_production_key
ENCRYPTION_KEY=your_encryption_key

# Development
OPENROUTER_API_KEY=your_dev_key
NODE_ENV=development
```

---

## 🚀 Deployment Checklist

- [ ] Configure OpenRouter API key
- [ ] Set up encryption for sensitive data
- [ ] Implement rate limiting
- [ ] Configure monitoring and alerts
- [ ] Test all translation endpoints
- [ ] Verify fallback model functionality
- [ ] Set up cost tracking
- [ ] Document admin procedures
- [ ] Train users on new features
- [ ] Monitor initial usage patterns

---

**Last Updated:** January 22, 2026  
**Next Review:** Implementation Phase  
**Document Version:** 1.0  
**Status:** Ready for Implementation
