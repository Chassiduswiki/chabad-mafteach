# AI-Enhanced Editor: Technical Implementation Guide

**Status:** Ready for Development  
**Created:** January 22, 2026  
**Developer Guide:** Step-by-step implementation instructions

---

## 🎯 Phase 1: Quick Wins (Weeks 1-2)

### 1.1 Smart Field Auto-Fill

#### A. Auto-Transliteration

**File:** `@/hooks/useAutoTransliteration.ts`
```typescript
import { useState, useEffect } from 'react';

export function useAutoTransliteration(hebrewText: string, enabled: boolean = true) {
  const [transliteration, setTransliteration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !hebrewText || hebrewText.length < 2) {
      setTransliteration('');
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/transliterate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: hebrewText }),
        });

        if (!response.ok) throw new Error('Transliteration failed');

        const data = await response.json();
        setTransliteration(data.transliteration);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(debounce);
  }, [hebrewText, enabled]);

  return { transliteration, loading, error };
}
```

**File:** `@/app/api/ai/transliterate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenRouterClient from '@/lib/ai/openrouter-client';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const client = new OpenRouterClient();
    
    // Use a lightweight model for transliteration
    const prompt = `Transliterate the following Hebrew text to English using standard Chassidic transliteration conventions (e.g., "ch" for ח, "tz" for צ):

Hebrew: "${text}"

Respond with ONLY the transliteration, no explanation.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API failed');
    }

    const data = await response.json();
    const transliteration = data.choices[0].message.content.trim();

    return NextResponse.json({ transliteration });
  } catch (error) {
    console.error('Transliteration error:', error);
    return NextResponse.json(
      { error: 'Transliteration failed' },
      { status: 500 }
    );
  }
}
```

**Component:** `@/components/editor/SmartFieldInput.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { useAutoTransliteration } from '@/hooks/useAutoTransliteration';

interface SmartFieldInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sourceValue?: string; // Hebrew text to transliterate from
  placeholder?: string;
  autoTransliterate?: boolean;
}

export function SmartFieldInput({
  label,
  value,
  onChange,
  sourceValue,
  placeholder,
  autoTransliterate = false,
}: SmartFieldInputProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const { transliteration, loading } = useAutoTransliteration(
    sourceValue || '',
    autoTransliterate
  );

  useEffect(() => {
    if (transliteration && !value && autoTransliterate) {
      setShowSuggestion(true);
    }
  }, [transliteration, value, autoTransliterate]);

  const acceptSuggestion = () => {
    onChange(transliteration);
    setShowSuggestion(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        {/* AI Suggestion Overlay */}
        {showSuggestion && transliteration && (
          <div className="absolute inset-0 flex items-center justify-between px-3 bg-primary/5 border-2 border-primary/30 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI suggests:</span>
              <span className="font-medium text-foreground">{transliteration}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptSuggestion}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/80"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Integration in Topic Editor:**
```typescript
// In app/editor/topics/[slug]/page.tsx
import { SmartFieldInput } from '@/components/editor/SmartFieldInput';

// Replace transliteration input with:
<SmartFieldInput
  label="Transliteration"
  value={formData.canonical_title_transliteration || ''}
  onChange={(value) => updateFormField('canonical_title_transliteration', value)}
  sourceValue={formData.canonical_title}
  placeholder="e.g., Ahavas Yisroel"
  autoTransliterate={true}
/>
```

---

#### B. Intelligent Slug Generation

**File:** `@/hooks/useSmartSlug.ts`
```typescript
import { useState, useEffect } from 'react';

export function useSmartSlug(sourceText: string, enabled: boolean = true) {
  const [suggestedSlug, setSuggestedSlug] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !sourceText) {
      setSuggestedSlug('');
      return;
    }

    const debounce = setTimeout(async () => {
      // Generate slug from source text
      const slug = sourceText
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      setSuggestedSlug(slug);

      // Check availability
      if (slug) {
        setLoading(true);
        try {
          const response = await fetch(`/api/topics/check-slug?slug=${slug}`);
          const data = await response.json();
          setIsAvailable(data.available);
        } catch (err) {
          console.error('Slug check failed:', err);
        } finally {
          setLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [sourceText, enabled]);

  return { suggestedSlug, isAvailable, loading };
}
```

**File:** `@/app/api/topics/check-slug/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check if slug exists in database
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/items/topics?filter[slug][_eq]=${slug}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIRECTUS_ADMIN_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    const available = !data.data || data.data.length === 0;

    // If not available, suggest alternatives
    let alternatives: string[] = [];
    if (!available) {
      alternatives = [
        `${slug}-2`,
        `${slug}-new`,
        `${slug}-concept`,
      ];
    }

    return NextResponse.json({ available, alternatives });
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: 'Slug check failed' }, { status: 500 });
  }
}
```

---

### 1.2 Tiptap Toolbar AI Buttons

**File:** `@/components/editor/extensions/AIEnhancementExtension.ts`
```typescript
import { Extension } from '@tiptap/core';

export const AIEnhancementExtension = Extension.create({
  name: 'aiEnhancement',

  addCommands() {
    return {
      enhanceSelection: () => ({ state, dispatch, view }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);

        if (!selectedText) return false;

        // Trigger enhancement dialog
        window.dispatchEvent(
          new CustomEvent('ai-enhance-text', {
            detail: { text: selectedText, from, to },
          })
        );

        return true;
      },

      translateSelection: (targetLang: string) => ({ state }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);

        if (!selectedText) return false;

        window.dispatchEvent(
          new CustomEvent('ai-translate-text', {
            detail: { text: selectedText, targetLang, from, to },
          })
        );

        return true;
      },

      suggestLinks: () => ({ state }) => {
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to);

        if (!selectedText) return false;

        window.dispatchEvent(
          new CustomEvent('ai-suggest-links', {
            detail: { text: selectedText },
          })
        );

        return true;
      },
    };
  },
});
```

**Component:** `@/components/editor/AIToolbar.tsx`
```typescript
'use client';

import { Editor } from '@tiptap/react';
import { Sparkles, Languages, Link2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIToolbarProps {
  editor: Editor | null;
}

export function AIToolbar({ editor }: AIToolbarProps) {
  if (!editor) return null;

  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.enhanceSelection()}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Enhance selected text"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.translateSelection('en')}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Translate selection"
      >
        <Languages className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.commands.suggestLinks()}
        disabled={!hasSelection}
        className="h-8 px-2"
        title="Suggest topic links"
      >
        <Link2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('ai-find-citations'));
        }}
        className="h-8 px-2"
        title="Find citations"
      >
        <BookOpen className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Integration:** Add to TipTapToolbar component
```typescript
// In components/editor/TipTapToolbar.tsx
import { AIToolbar } from './AIToolbar';

// Add after existing toolbar buttons:
<AIToolbar editor={editor} />
```

---

### 1.3 Proactive Sidebar Suggestions

**Component:** `@/components/editor/ProactiveSuggestionsPanel.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'action' | 'content' | 'relationship';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
}

interface ProactiveSuggestionsPanelProps {
  topicId: number;
  content: string;
  onSuggestionApplied?: () => void;
}

export function ProactiveSuggestionsPanel({
  topicId,
  content,
  onSuggestionApplied,
}: ProactiveSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (content && content.length > 50) {
      generateSuggestions();
    }
  }, [content, topicId]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, content }),
      });

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    suggestion.action();
    setAppliedSuggestions((prev) => new Set(prev).add(suggestion.id));
    onSuggestionApplied?.();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions yet. Add more content to get AI recommendations.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-foreground">
                  {suggestion.title}
                </h4>
                <span
                  className={`text-xs font-medium ${getConfidenceColor(
                    suggestion.confidence
                  )}`}
                >
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {suggestion.description}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applySuggestion(suggestion)}
                disabled={appliedSuggestions.has(suggestion.id)}
                className="w-full"
              >
                {appliedSuggestions.has(suggestion.id) ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Applied
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Apply
                  </>
                )}
              </Button>
            </div>
          ))
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
          className="w-full"
        >
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}
```

**API Route:** `@/app/api/ai/suggest-improvements/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topicId, content } = await req.json();

    // Analyze content and generate suggestions
    const prompt = `Analyze this Chassidic topic content and suggest 3-5 specific improvements:

Content: "${content}"

For each suggestion, provide:
1. A clear action title
2. Brief description of why it would help
3. Confidence score (0.0-1.0)

Respond in JSON format:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "action|content|relationship",
      "title": "Suggestion title",
      "description": "Why this helps",
      "confidence": 0.85
    }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
```

---

## 📝 Integration Checklist

### Phase 1 Implementation Steps

- [ ] **Week 1, Day 1-2:** Auto-transliteration
  - [ ] Create `useAutoTransliteration` hook
  - [ ] Create `/api/ai/transliterate` endpoint
  - [ ] Create `SmartFieldInput` component
  - [ ] Integrate into topic editor
  - [ ] Test with Hebrew inputs

- [ ] **Week 1, Day 3-4:** Smart slug generation
  - [ ] Create `useSmartSlug` hook
  - [ ] Create `/api/topics/check-slug` endpoint
  - [ ] Add slug conflict detection
  - [ ] Add alternative suggestions
  - [ ] Test slug validation

- [ ] **Week 1, Day 5:** Tiptap AI toolbar
  - [ ] Create `AIEnhancementExtension`
  - [ ] Create `AIToolbar` component
  - [ ] Integrate into TipTapToolbar
  - [ ] Add event listeners
  - [ ] Test toolbar buttons

- [ ] **Week 2, Day 1-3:** Enhancement dialogs
  - [ ] Create `EnhanceTextDialog`
  - [ ] Create `TranslateSelectionDialog`
  - [ ] Create `SuggestLinksDialog`
  - [ ] Wire up to toolbar buttons
  - [ ] Test enhancement workflows

- [ ] **Week 2, Day 4-5:** Proactive suggestions
  - [ ] Create `ProactiveSuggestionsPanel`
  - [ ] Create `/api/ai/suggest-improvements`
  - [ ] Integrate into sidebar
  - [ ] Test suggestion generation
  - [ ] Polish UI/UX

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/hooks/useAutoTransliteration.test.ts
describe('useAutoTransliteration', () => {
  it('should transliterate Hebrew text', async () => {
    // Test implementation
  });

  it('should debounce API calls', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// __tests__/components/SmartFieldInput.test.tsx
describe('SmartFieldInput', () => {
  it('should show AI suggestion when transliteration is ready', () => {
    // Test implementation
  });

  it('should accept suggestion on button click', () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
// e2e/ai-features.spec.ts
test('AI transliteration workflow', async ({ page }) => {
  await page.goto('/editor/topics/new');
  await page.fill('[name="canonical_title"]', 'חיצוניות');
  await page.waitForSelector('[data-ai-suggestion]');
  await page.click('[data-accept-suggestion]');
  // Assert transliteration was applied
});
```

---

## 📊 Performance Considerations

### Caching Strategy
```typescript
// lib/ai/cache.ts
const aiCache = new Map<string, { result: any; timestamp: number }>();

export function getCachedAIResult(key: string, maxAge: number = 3600000) {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.result;
  }
  return null;
}

export function setCachedAIResult(key: string, result: any) {
  aiCache.set(key, { result, timestamp: Date.now() });
}
```

### Rate Limiting
```typescript
// lib/ai/rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}
```

---

## 🚀 Deployment

### Environment Variables
```bash
# .env.local
OPENROUTER_API_KEY=your_key_here
OPENROUTER_PRIMARY_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_FALLBACK_MODEL=anthropic/claude-3.5-sonnet
```

### Feature Flags
```typescript
// lib/feature-flags.ts
export const AI_FEATURES = {
  autoTransliteration: process.env.NEXT_PUBLIC_ENABLE_AUTO_TRANSLITERATION === 'true',
  smartSlug: process.env.NEXT_PUBLIC_ENABLE_SMART_SLUG === 'true',
  aiToolbar: process.env.NEXT_PUBLIC_ENABLE_AI_TOOLBAR === 'true',
  proactiveSuggestions: process.env.NEXT_PUBLIC_ENABLE_PROACTIVE_SUGGESTIONS === 'true',
};
```

---

**Next:** [Phase 2 Implementation Guide](./AI_EDITOR_PHASE_2.md)
