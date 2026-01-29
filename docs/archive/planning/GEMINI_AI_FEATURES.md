# AI-Powered Features Using Gemini 2.0 Flash (Free)

## Overview
The Chabad Mafteach project now includes comprehensive AI capabilities powered by Google's Gemini 2.0 Flash model through OpenRouter (free tier). This provides unlimited AI assistance for content generation and enhancement.

## Available Features

### 1. Translation System
- **Endpoint**: `/api/ai/translate`
- **Model**: Gemini 2.0 Flash (primary), Claude 3.5 Sonnet (fallback)
- **Features**:
  - Chassidic-specific translation prompts
  - Quality scoring (0.0 - 1.0)
  - Auto-approval for high-quality translations (>0.95)
  - Translation history tracking
  - Support for Hebrew/English translations

### 2. Content Generation
- **Endpoint**: `/api/ai/generate`
- **Available Actions**:

#### `expand_article`
Expand a brief description into a comprehensive article
```json
{
  "action": "expand_article",
  "data": {
    "topicTitle": "Bittul",
    "briefDescription": "Self-nullification in Chassidic thought"
  }
}
```

#### `generate_practical_takeaways`
Generate actionable practical applications
```json
{
  "action": "generate_practical_takeaways",
  "data": {
    "topicTitle": "Bittul",
    "content": "Full article content..."
  }
}
```

#### `generate_mashal`
Create a parable to illustrate a concept
```json
{
  "action": "generate_mashal",
  "data": {
    "concept": "Divine light",
    "nimshal": "The soul's connection to G-d"
  }
}
```

#### `enhance_content`
Improve existing content
```json
{
  "action": "enhance_content",
  "data": {
    "content": "Original content...",
    "instructions": "Make it more accessible for beginners"
  }
}
```

#### `generate_confusions`
Generate common Q&A
```json
{
  "action": "generate_confusions",
  "data": {
    "topicTitle": "Bittul",
    "content": "Article content..."
  }
}
```

#### `generate_key_concepts`
Extract key concepts from content
```json
{
  "action": "generate_key_concepts",
  "data": {
    "content": "Article content..."
  }
}
```

#### `summarize`
Summarize long content
```json
{
  "action": "summarize",
  "data": {
    "content": "Long article...",
    "maxLength": 200
  }
}
```

#### `generate_historical_context`
Generate historical background
```json
{
  "action": "generate_historical_context",
  "data": {
    "topicTitle": "Bittul",
    "era": "Alter Rebbe"
  }
}
```

## UI Components

### AI Assistant Panel
Located at: `components/editor/AIAssistantPanel.tsx`

Features:
- Tabbed interface for different AI operations
- Real-time generation with loading states
- Copy-to-clipboard functionality
- Error handling and display
- Integration with topic editor

### Admin AI Settings
Located at: `app/admin/ai-settings/page.tsx`

Features:
- API key management
- Model selection (primary/fallback)
- Quality threshold controls
- Connection testing
- Settings persistence

### Topic AI Enhancement Page
Located at: `app/admin/topics/[id]/ai-enhance/page.tsx`

Features:
- Side-by-side view of current content and AI panel
- Direct integration with topic data
- Content preview before saving

## React Hooks

### `useAIGeneration`
Located at: `hooks/useAIGeneration.ts`

```typescript
const { generate, loading, error } = useAIGeneration();

const result = await generate({
  action: 'expand_article',
  data: { topicTitle, briefDescription }
});
```

## Backend Services

### `AIAssistant` Class
Located at: `lib/ai/ai-assistant.ts`

Provides high-level methods for all AI operations:
- `expandTopicArticle()`
- `generatePracticalTakeaways()`
- `generateMashal()`
- `enhanceContent()`
- `generateCommonConfusions()`
- `generateKeyConcepts()`
- `summarize()`
- `generateHistoricalContext()`

### `TranslationHistoryService` Class
Located at: `lib/ai/translation-history.ts`

Manages translation records:
- `createRecord()`
- `getRecordsByTopic()`
- `approveTranslation()`
- `rejectTranslation()`
- `getTranslationStats()`

## Configuration

### Environment Variables
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Default Models
- **Primary**: `google/gemini-2.0-flash-exp:free`
- **Fallback**: `anthropic/claude-3.5-sonnet`

### Quality Thresholds
- **Minimum Quality**: 0.8 (translations below this are not saved)
- **Auto-Approval**: 0.95 (translations above this are auto-approved)

## Usage Examples

### Generate Content for a Topic
```typescript
import { aiAssistant } from '@/lib/ai/ai-assistant';

// Expand a brief description
const article = await aiAssistant.expandTopicArticle(
  'Bittul',
  'Self-nullification in Chassidic thought'
);

// Generate practical takeaways
const takeaways = await aiAssistant.generatePracticalTakeaways(
  'Bittul',
  article
);

// Create a mashal
const mashal = await aiAssistant.generateMashal(
  'A candle in sunlight',
  'The soul in the presence of G-d'
);
```

### Translate Content
```typescript
// POST to /api/ai/translate
const response = await fetch('/api/ai/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic_id: '123',
    source_language: 'English',
    target_language: 'Hebrew',
    field: 'article',
    context: 'Chassidic philosophical text'
  })
});
```

## Database Schema

### `translation_history` Collection
- `id` (uuid, primary key)
- `topic_id` (string)
- `source_language` (string)
- `target_language` (string)
- `field` (string)
- `translation` (text)
- `quality_score` (float)
- `quality_explanation` (text)
- `model` (string)
- `is_fallback` (boolean)
- `status` (enum: pending, approved, rejected)
- `user_created` (uuid, FK to directus_users)
- `date_created` (timestamp)

## Future Enhancements

Potential additions:
1. **Batch Processing**: Generate content for multiple topics at once
2. **Content Comparison**: Compare AI-generated vs. human-written content
3. **Style Learning**: Train on existing content to match writing style
4. **Citation Integration**: Auto-generate citations from sources
5. **Multi-language Support**: Expand beyond Hebrew/English
6. **Voice Customization**: Different tones (scholarly, accessible, etc.)
7. **Content Versioning**: Track AI-generated content iterations
8. **Quality Feedback Loop**: Learn from approved/rejected translations

## Cost Optimization

Using Gemini 2.0 Flash (free tier):
- **Cost**: $0 (free tier on OpenRouter)
- **Rate Limits**: Check OpenRouter documentation
- **Fallback**: Claude 3.5 Sonnet for critical operations
- **Caching**: Consider implementing response caching for common queries

## Best Practices

1. **Always review AI-generated content** before publishing
2. **Use specific prompts** for better results
3. **Provide context** when generating Chassidic content
4. **Test translations** with native speakers
5. **Monitor quality scores** and adjust thresholds as needed
6. **Keep the fallback model** for important operations
7. **Track usage** to stay within rate limits
