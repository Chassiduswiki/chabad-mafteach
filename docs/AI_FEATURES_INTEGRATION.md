# AI Features Integration Guide

**Status:** ✅ Integrated  
**Date:** January 22, 2026  
**Version:** 1.0

---

## 🎯 Overview

AI features are now fully integrated throughout the admin dashboard and all editors, making AI-powered translation and content enhancement accessible wherever you need it.

---

## 📍 Where to Find AI Features

### 1. Admin Dashboard (`/admin`)

**Quick Actions Section:**
- **AI Settings** button - Direct access to configure OpenRouter API
- Prominently displayed in the top quick actions bar

**Access Path:**
```
Admin Dashboard → Quick Actions → AI Settings
```

### 2. Editor Dashboard (`/editor`)

**AI-Powered Tools Section:**
- **AI Settings** - Configure API and models
- **AI Translation** - Information about translation features
- **Content Enhancement** - AI writing assistance info

**Access Path:**
```
Editor Dashboard → AI-Powered Tools → [Feature]
```

### 3. AI Settings Page (`/admin/ai-settings`)

**Full Configuration Interface:**
- API provider selection (OpenRouter, OpenAI, Anthropic, Google)
- API key management
- Primary and fallback model selection
- Quality threshold configuration
- Connection testing

**Features:**
- ✅ Test connection before saving
- ✅ Real-time validation
- ✅ Secure API key storage
- ✅ Dynamic model selection

---

## 🛠️ Available AI Components

### AIAssistant Component

**Location:** `@/components/ai/AIAssistant.tsx`

**Usage:**
```tsx
import { AIAssistant } from '@/components/ai/AIAssistant';

// Translation mode
<AIAssistant 
  mode="translate"
  onTranslationComplete={(translation) => {
    // Handle translated text
  }}
/>

// Enhancement mode
<AIAssistant 
  mode="enhance"
  onEnhancementComplete={(enhanced) => {
    // Handle enhanced text
  }}
/>

// Both modes
<AIAssistant 
  mode="both"
  initialText="Text to process"
/>
```

**Props:**
- `mode`: `'translate' | 'enhance' | 'both'` - Which features to show
- `onTranslationComplete`: Callback with translated text
- `onEnhancementComplete`: Callback with enhanced text
- `initialText`: Pre-populate the text field

**Features:**
- Language selection (English, Hebrew, Yiddish, Aramaic)
- Real-time translation
- Content enhancement
- Quality feedback
- Error handling

---

## 🔧 Integration Points

### Current Integrations

1. **Admin Dashboard**
   - ✅ AI Settings quick action
   - ✅ Direct link to configuration

2. **Editor Dashboard**
   - ✅ AI Tools section
   - ✅ Feature overview cards
   - ✅ Settings access

3. **AI Settings Page**
   - ✅ Full configuration UI
   - ✅ Connection testing
   - ✅ Model management

### Planned Integrations

4. **Topic Editors** (Pending)
   - AI Assistant sidebar
   - Quick translation button
   - Content enhancement suggestions

5. **Writing Tools** (Pending)
   - Inline AI assistance
   - Translation overlay
   - Smart suggestions

6. **Admin Topic Management** (Pending)
   - Bulk translation
   - Content quality scoring
   - AI-powered tagging

---

## 🔌 API Endpoints

### Settings Management

**GET `/api/ai/settings`**
- Fetch current AI configuration
- Returns: API key, models, thresholds

**POST `/api/ai/settings`**
- Save AI configuration
- Body: Settings object
- Creates or updates settings in Directus

### AI Operations

**POST `/api/ai/translate`**
- Translate text between languages
- Body: `{ text, sourceLang, targetLang, context }`
- Returns: `{ translation, quality, model, isFallback }`

**POST `/api/ai/generate`**
- Generate or enhance content
- Body: `{ prompt, context }`
- Returns: `{ content, model }`

**POST `/api/ai/test-connection`**
- Test API key and model
- Body: `{ apiKey, primaryModel }`
- Returns: `{ success, message, model }`

---

## 🎨 UI Components

### Quick Action Buttons

Located in admin and editor dashboards:
```tsx
<Link href="/admin/ai-settings">
  <Sparkles className="w-4 h-4" />
  AI Settings
</Link>
```

### AI Tools Cards

Informational cards in editor dashboard:
- Gradient backgrounds (primary, purple, blue)
- Icon indicators
- Feature descriptions
- Hover effects

### Settings Interface

Full-featured configuration page:
- Provider selection dropdown
- Secure password input for API keys
- Model selection (primary + fallback)
- Quality threshold sliders
- Test connection button
- Save settings button

---

## 🔐 Security

### API Key Storage

- ✅ Stored in Directus `ai_settings` collection
- ✅ Never exposed in client-side code
- ✅ Fetched only on server-side
- ✅ Password input type in UI

### Access Control

- ✅ Admin-only settings page
- ✅ Editor access to AI features
- ✅ Respects Directus permissions

---

## 📊 Settings Flow

### Configuration Workflow

1. **Navigate to AI Settings**
   - Admin Dashboard → AI Settings
   - Editor Dashboard → AI Tools → AI Settings

2. **Configure Provider**
   - Select provider (OpenRouter recommended)
   - Enter API key
   - Choose primary model
   - Choose fallback model

3. **Set Quality Thresholds**
   - Minimum quality threshold (0.0 - 1.0)
   - Auto-approval threshold (0.0 - 1.0)

4. **Test Connection**
   - Click "Test Connection"
   - Verify API key works
   - Check model availability

5. **Save Settings**
   - Click "Save Settings"
   - Settings stored in Directus
   - Available to all AI features

### Usage Workflow

1. **Open Editor/Tool**
   - Navigate to any editor with AI features

2. **Access AI Assistant**
   - Look for AI button/panel
   - Or use AIAssistant component

3. **Enter Text**
   - Type or paste content

4. **Select Operation**
   - Translate: Choose languages
   - Enhance: Automatic

5. **Process**
   - Click Translate/Enhance
   - Wait for AI response
   - Review result

6. **Use Result**
   - Copy to clipboard
   - Insert into editor
   - Further refine

---

## 🚀 Next Steps

### Phase 1: Core Integration ✅
- [x] Create AIAssistant component
- [x] Add to admin dashboard
- [x] Add to editor dashboard
- [x] Update OpenRouterClient for dynamic settings

### Phase 2: Editor Integration (In Progress)
- [ ] Add AI panel to topic editors
- [ ] Integrate into writing tools
- [ ] Add quick translation buttons
- [ ] Implement inline suggestions

### Phase 3: Advanced Features (Planned)
- [ ] Batch translation operations
- [ ] Content quality scoring
- [ ] AI-powered tagging
- [ ] Translation history
- [ ] Usage analytics

---

## 📚 Related Documentation

- **[AI_INTEGRATION_IMPLEMENTATION.md](./AI_INTEGRATION_IMPLEMENTATION.md)** - Technical implementation details
- **[OPENROUTER_SETUP_COMPLETE.md](./OPENROUTER_SETUP_COMPLETE.md)** - API setup guide
- **[API.md](./API.md)** - API documentation

---

## 🐛 Troubleshooting

### AI Features Not Working

1. **Check Settings**
   - Navigate to `/admin/ai-settings`
   - Verify API key is configured
   - Test connection

2. **Check API Key**
   - Ensure key is valid
   - Check OpenRouter dashboard
   - Verify billing/credits

3. **Check Model Availability**
   - Some models may be unavailable
   - Try fallback model
   - Check OpenRouter status

### Translation Errors

1. **Quality Too Low**
   - Adjust quality threshold
   - Try different model
   - Provide more context

2. **API Rate Limits**
   - Wait and retry
   - Check OpenRouter limits
   - Consider upgrading plan

3. **Network Issues**
   - Check internet connection
   - Verify API endpoint accessible
   - Check browser console

---

## 💡 Best Practices

### Configuration

- **Use OpenRouter** for access to multiple models
- **Set fallback model** for reliability
- **Test before saving** to verify settings
- **Keep API key secure** - never share

### Usage

- **Provide context** for better translations
- **Review AI output** before using
- **Use appropriate models** for task
- **Monitor quality scores** for consistency

### Development

- **Use AIAssistant component** for consistency
- **Handle errors gracefully** with user feedback
- **Show loading states** during processing
- **Cache settings** to reduce API calls

---

**Last Updated:** January 22, 2026  
**Status:** Active Development  
**Next Review:** Phase 2 Completion
