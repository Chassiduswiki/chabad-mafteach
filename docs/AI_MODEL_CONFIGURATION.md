# AI Model Configuration

This document explains how to configure the AI model used throughout the Chabad Research application.

## Overview

The application uses OpenRouter as the AI provider, which gives access to multiple AI models through a single API. The AI model configuration is centralized in a single location to ensure consistency across all features.

## Configuration Files

### Primary Configuration: `lib/ai/config.ts`

```typescript
export const DEFAULT_AI_MODEL = 'allenai/olmo-3.1-32b-think';

export const AI_CONFIG = {
  model: DEFAULT_AI_MODEL,
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
} as const;
```

**To change the AI model**, update the `DEFAULT_AI_MODEL` constant in this file. All dependent components will automatically use the new model.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `DIRECTUS_URL` | Directus server URL | Yes |
| `DIRECTUS_STATIC_TOKEN` | Directus static token for server-side auth | Yes (production) |

### Security Notes

- `OPENROUTER_API_KEY` is **server-side only** - never expose it to the client
- Do not prefix with `NEXT_PUBLIC_` as this would expose the key in the browser
- The API key is accessed only in `/app/api/` routes and `/lib/` server modules

## Admin Panel Configuration

Users can also configure AI settings through the admin panel at `/admin/ai-settings`. This allows:

- Selecting a primary model from a dropdown or entering a custom model ID
- Configuring a fallback model (used if primary fails)
- Setting quality thresholds for translations
- Testing the API connection

Settings configured in the admin panel are stored in Directus (in the `ai_settings` singleton collection) and take precedence over the default configuration.

## Files That Use AI Configuration

| File | Purpose |
|------|---------|
| `lib/ai/config.ts` | Central configuration constants |
| `lib/ai/ai-assistant.ts` | AI content generation class |
| `lib/ai/openrouter-client.ts` | Translation client |
| `app/api/ai/settings/route.ts` | Settings API (stores/retrieves from Directus) |
| `app/api/ai/find-citations/route.ts` | Citation finding |
| `app/api/ai/predict-relationships/route.ts` | Relationship prediction |
| `app/api/editor/paraphrase/route.ts` | Text paraphrasing |
| `app/api/editor/grammar/route.ts` | Grammar checking |
| `app/api/ai/transliterate/route.ts` | Transliteration |

## How Model Selection Works

1. **Default**: Uses `DEFAULT_AI_MODEL` from `lib/ai/config.ts`
2. **Override**: Admin panel settings stored in Directus override the default
3. **Fallback**: If primary model fails, the fallback model is used

```
Request → Check Directus settings → Use stored model OR DEFAULT_AI_MODEL → Fallback on error
```

## Changing the AI Model

### Option 1: Update Code (Permanent Change)

Edit `lib/ai/config.ts`:

```typescript
export const DEFAULT_AI_MODEL = 'your-new-model-id';
```

### Option 2: Admin Panel (Runtime Change)

1. Navigate to `/admin/ai-settings`
2. Select a model from the dropdown or choose "Custom Model..."
3. Enter the model ID (e.g., `anthropic/claude-3.5-sonnet`)
4. Click "Save Settings"

## Popular Model Options

| Model ID | Description |
|----------|-------------|
| `allenai/olmo-3.1-32b-think` | Current default - good reasoning |
| `anthropic/claude-3.5-sonnet` | High quality, good for complex tasks |
| `openai/gpt-4-turbo` | Fast GPT-4 variant |
| `google/gemini-2.0-flash-exp:free` | Free tier option |
| `qwen/qwen3-next-80b-a3b-instruct:free` | Free tier option |

See [OpenRouter Models](https://openrouter.ai/models) for a complete list.
