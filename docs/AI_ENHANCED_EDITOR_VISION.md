# AI-Enhanced Topic Editor: Vision & Implementation Plan

**Status:** Planning Phase  
**Created:** January 22, 2026  
**Priority:** High  
**Estimated Timeline:** 8-12 weeks

---

## 🎯 Executive Summary

Transform the current topic editor from a manual data entry form into an **intelligent AI-powered knowledge curation assistant** that proactively helps editors create, enhance, and connect Chassidic concepts.

### Current State
- Basic topic editor with manual field entry
- Separate AI Assistant panel (limited to content generation)
- No inline AI suggestions or contextual assistance
- Manual translation workflow
- Static relationship management
- Passive content completeness metrics

### Target State
- **Contextual AI Integration** - AI assistance woven into every field and action
- **Proactive Suggestions** - AI predicts and suggests before you ask
- **Intelligent Automation** - One-click operations for common tasks
- **Smart Relationships** - AI-powered topic graph building
- **Real-time Enhancement** - Inline content improvement as you type
- **Floating AI Chat** - Always-available conversational assistant

---

## 🏗️ Architecture Overview

### Three-Layer AI Integration

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Inline AI (Field-Level Intelligence)     │
│  - Auto-transliteration, smart slugs, field hints  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Layer 2: Contextual AI (Tab-Specific Features)    │
│  - Content generation, relationship prediction     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Layer 3: Global AI (Floating Assistant)           │
│  - Chat interface, complex workflows, Q&A          │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Phases

### **Phase 1: Quick Wins (Weeks 1-2)**
*Low-hanging fruit with immediate impact*

#### 1.1 Smart Field Auto-Fill
- **Auto-transliteration** from Hebrew → English
  - Hook into `canonical_title` onChange
  - Call `/api/ai/transliterate` endpoint
  - Auto-populate `canonical_title_transliteration`
  
- **Intelligent Slug Generation**
  - Generate from transliteration or English title
  - Check for conflicts via `/api/topics/check-slug`
  - Suggest alternatives if conflict exists

- **Topic Type Prediction**
  - Analyze title/description content
  - Suggest topic_type with confidence score
  - One-click to accept suggestion

**Components to Create:**
- `SmartFieldInput.tsx` - Wrapper with AI enhancement
- `AutoTransliterationButton.tsx` - Inline AI trigger
- `SlugConflictResolver.tsx` - Smart slug suggestions

**API Endpoints:**
```typescript
POST /api/ai/transliterate
POST /api/ai/suggest-topic-type
GET /api/topics/check-slug?slug=...
```

#### 1.2 Tiptap Toolbar AI Buttons
Add AI features to rich text editor toolbar:

```
[B] [I] [U] | [✨ Enhance] [🌐 Translate] [🔗 Suggest Links] [📚 Find Citations]
```

**Features:**
- **Enhance Selected Text** - Improve clarity, grammar, style
- **Translate Selection** - Hebrew ↔ English with context
- **Suggest Topic Links** - Detect concepts, suggest relationships
- **Find Citations** - Search library for relevant sources

**Components to Create:**
- `AIToolbarButton.tsx` - Reusable AI button component
- `EnhanceTextDialog.tsx` - Enhancement options modal
- `TranslateSelectionDialog.tsx` - Translation preview/apply
- `SuggestLinksDialog.tsx` - Relationship suggestions
- `CitationFinderDialog.tsx` - Source search integration

**Tiptap Extensions:**
- `AIEnhancementExtension.ts` - Text enhancement logic
- `SmartTranslationExtension.ts` - Inline translation
- `ConceptDetectionExtension.ts` - Auto-detect related topics

#### 1.3 Proactive Sidebar Suggestions
Replace static "Suggestions" with dynamic AI panel:

**Components to Create:**
- `ProactiveSuggestionsPanel.tsx` - Main sidebar component
- `SmartActionCard.tsx` - Actionable suggestion card
- `ContentSuggestionsList.tsx` - Content improvement ideas
- `RelationshipPredictions.tsx` - Predicted topic links

**Features:**
- Auto-analyze current content on save
- Generate 3-5 actionable suggestions
- Show confidence scores
- One-click to apply suggestions

---

### **Phase 2: Deep Integration (Weeks 3-5)**

#### 2.1 Content Completeness → AI Actions
Transform passive metrics into actionable AI workflows:

```typescript
// Before: Static percentage
Content Completeness: 50%

// After: Actionable AI triggers
Content Completeness: 50%
├─ ✅ Basic Info: 100%
├─ ⚠️ Content: 38% → [AI: Generate Article]
├─ ⚠️ Relationships: 50% → [AI: Find Related]
└─ ❌ Sources: 0% → [AI: Suggest Citations]
```

**Components to Create:**
- `ActionableCompletenessCard.tsx` - Enhanced completeness widget
- `AIContentGeneratorDialog.tsx` - Multi-step content generation
- `AIRelationshipFinderDialog.tsx` - Relationship discovery
- `AICitationSuggestorDialog.tsx` - Source recommendations

**Workflows:**
1. Click "AI: Generate Article" → Opens wizard
2. AI analyzes existing content + title
3. Generates outline → User reviews/edits
4. AI expands outline → Full article draft
5. User reviews, edits, accepts

#### 2.2 Relationship Predictions (Tab-Specific)
AI-powered relationship discovery in Relationships tab:

**Features:**
- **Predictive Linking** - Analyze content, suggest related topics
- **Confidence Scores** - Show AI certainty (90%, 85%, 80%)
- **Relationship Type Detection** - Parent/child, opposite, related
- **Bulk Operations** - "Add all suggested relationships"
- **Explanation** - Why AI thinks topics are related

**Components to Create:**
- `RelationshipPredictionsPanel.tsx` - Main predictions UI
- `PredictedRelationshipCard.tsx` - Individual suggestion
- `RelationshipExplanation.tsx` - AI reasoning display
- `BulkRelationshipActions.tsx` - Batch operations

**API Endpoints:**
```typescript
POST /api/ai/predict-relationships
{
  topic_id: 122,
  content: "...",
  existing_relationships: [...]
}

Response:
{
  predictions: [
    {
      topic_id: 45,
      topic_title: "Pnimiyus",
      relationship_type: "opposite",
      confidence: 0.92,
      explanation: "Chitzoniuys and Pnimiyus are fundamental opposites..."
    }
  ]
}
```

#### 2.3 Citation Assistant with Sefaria
Intelligent source finding and citation creation:

**Features:**
- **Smart Search** - Natural language query → Relevant sources
- **Auto-Citation** - Extract quote, create proper citation
- **Sefaria Integration** - Pull from Sefaria API
- **Source Validation** - Check citation accuracy
- **Context Display** - Show surrounding text

**Components to Create:**
- `SmartCitationFinder.tsx` - Main citation search UI
- `SefariaIntegration.tsx` - Sefaria API wrapper
- `CitationPreview.tsx` - Preview before inserting
- `SourceValidation.tsx` - Accuracy checker

**API Endpoints:**
```typescript
POST /api/ai/find-citations
{
  query: "sources about chitzoniuys in Tanya",
  context: "current topic content"
}

GET /api/sefaria/search?q=...
POST /api/citations/validate
```

---

### **Phase 3: Advanced Features (Weeks 6-8)**

#### 3.1 Floating AI Chat Assistant
Always-accessible conversational AI helper:

**Features:**
- **Contextual Awareness** - Knows current topic, tab, content
- **Natural Language Commands** - "Translate this paragraph"
- **Multi-turn Conversations** - Follow-up questions
- **Action Execution** - Can trigger editor actions
- **History Tracking** - Remember conversation context

**Components to Create:**
- `FloatingAIChatButton.tsx` - Bottom-right floating button
- `AIChatPanel.tsx` - Expandable chat interface
- `ChatMessage.tsx` - Individual message component
- `ChatActionButtons.tsx` - Quick action buttons
- `ChatHistory.tsx` - Conversation history

**Example Interactions:**
```
User: "Explain this concept to me"
AI: "Chitzoniuys refers to externality or superficiality..."

User: "Find sources about this"
AI: "I found 3 relevant sources: [list with links]"

User: "What topics should I link to?"
AI: "Based on your content, I suggest linking to:
     1. Pnimiyus (opposite concept)
     2. Gashmiyus (related concept)
     3. Ruchniyus (contrasting concept)"

User: "Add them all"
AI: "✓ Added 3 relationships. Would you like me to generate 
     descriptions for each?"
```

**API Endpoints:**
```typescript
POST /api/ai/chat
{
  message: "user message",
  context: {
    topic_id: 122,
    current_tab: "content",
    editor_content: "..."
  },
  conversation_history: [...]
}
```

#### 3.2 Bulk AI Operations
Batch processing for multiple topics:

**Features:**
- **Translate All** - Batch translate Hebrew → English
- **Generate Summaries** - Auto-create descriptions
- **Find Relationships** - Build topic graph automatically
- **Quality Check** - AI review for completeness

**Components to Create:**
- `BulkAIOperationsPanel.tsx` - Batch operations UI
- `BatchProgressTracker.tsx` - Progress visualization
- `BatchResultsReview.tsx` - Review/approve results

#### 3.3 Smart Workflows
Pre-defined AI-powered workflows:

**Workflows to Implement:**

1. **Quick Start: Create Topic from Source**
   - Upload source text/PDF
   - AI extracts: title, type, key concepts
   - Generates: description, outline
   - Suggests: related topics, citations

2. **Quality Enhancement Workflow**
   - AI analyzes topic completeness
   - Identifies missing sections
   - Generates suggestions for each gap
   - One-click to apply improvements

3. **Relationship Mapping Workflow**
   - Analyze all topics in collection
   - Build relationship graph
   - Suggest missing connections
   - Visualize topic network

**Components to Create:**
- `WorkflowWizard.tsx` - Multi-step workflow UI
- `WorkflowStep.tsx` - Individual step component
- `WorkflowProgress.tsx` - Progress tracker
- `WorkflowResults.tsx` - Results review

---

### **Phase 4: Polish & Optimization (Weeks 9-12)**

#### 4.1 Performance Optimization
- **Caching** - Cache AI responses for common queries
- **Debouncing** - Prevent excessive API calls
- **Background Processing** - Long operations in background
- **Progressive Enhancement** - Load AI features progressively

#### 4.2 UX Refinements
- **Loading States** - Beautiful loading animations
- **Error Handling** - Graceful fallbacks
- **Keyboard Shortcuts** - Power user efficiency
- **Undo/Redo** - Full history for AI actions
- **Dark Mode** - Optimize AI UI for dark mode

#### 4.3 Analytics & Monitoring
- **Usage Tracking** - Which AI features are used most
- **Quality Metrics** - AI suggestion acceptance rate
- **Performance Metrics** - Response times, error rates
- **Cost Tracking** - API usage and costs

---

## 🎨 UI/UX Design Principles

### 1. **Contextual, Not Intrusive**
- AI suggestions appear when relevant
- Don't interrupt user flow
- Easy to dismiss or ignore

### 2. **Transparent & Explainable**
- Show confidence scores
- Explain AI reasoning
- Allow user override

### 3. **Actionable, Not Passive**
- Every suggestion has a clear action
- One-click to apply
- Preview before committing

### 4. **Progressive Disclosure**
- Basic features visible by default
- Advanced features in menus
- Power users can access everything

### 5. **Consistent Patterns**
- Reusable AI button styles
- Consistent loading states
- Standard error handling

---

## 🔧 Technical Implementation

### AI Service Architecture

```typescript
// lib/ai/ai-service.ts
class AIService {
  // Core AI operations
  async transliterate(hebrew: string): Promise<string>
  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>
  async enhanceText(text: string, instructions?: string): Promise<string>
  async suggestTopicType(title: string, description?: string): Promise<TopicTypeSuggestion>
  
  // Relationship operations
  async predictRelationships(topicId: number, content: string): Promise<RelationshipPrediction[]>
  async explainRelationship(topic1: string, topic2: string): Promise<string>
  
  // Content generation
  async generateArticle(outline: string, context: string): Promise<string>
  async generateSection(sectionType: string, context: string): Promise<string>
  async extractKeyConcepts(content: string): Promise<string[]>
  
  // Citation operations
  async findCitations(query: string, context: string): Promise<Citation[]>
  async validateCitation(citation: Citation): Promise<ValidationResult>
  
  // Chat operations
  async chat(message: string, context: EditorContext, history: ChatMessage[]): Promise<ChatResponse>
}
```

### React Hooks

```typescript
// hooks/useAIEnhancement.ts
export function useAIEnhancement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const enhance = async (text: string, options?: EnhanceOptions) => {
    // Implementation
  };
  
  return { enhance, loading, error };
}

// hooks/useAITranslation.ts
export function useAITranslation() {
  // Translation-specific logic
}

// hooks/useAIRelationships.ts
export function useAIRelationships(topicId: number) {
  // Relationship prediction logic
}

// hooks/useAIChat.ts
export function useAIChat(context: EditorContext) {
  // Chat interface logic
}
```

### API Routes Structure

```
/app/api/ai/
├── transliterate/route.ts
├── translate/route.ts
├── enhance/route.ts
├── suggest-topic-type/route.ts
├── predict-relationships/route.ts
├── generate-article/route.ts
├── generate-section/route.ts
├── find-citations/route.ts
├── validate-citation/route.ts
└── chat/route.ts
```

---

## 📊 Success Metrics

### User Adoption
- **AI Feature Usage Rate** - % of editors using AI features
- **Feature Engagement** - Which AI features are most popular
- **Time Savings** - Reduction in time to create topics

### Content Quality
- **Completeness Improvement** - Average completeness score increase
- **Relationship Density** - More interconnected topics
- **Citation Coverage** - More topics with proper citations

### AI Performance
- **Suggestion Acceptance Rate** - % of AI suggestions accepted
- **Translation Quality** - Human review scores
- **Response Time** - AI feature latency
- **Error Rate** - Failed AI operations

### Business Impact
- **Content Creation Velocity** - Topics created per week
- **Editor Satisfaction** - User feedback scores
- **Cost Efficiency** - AI cost vs. value created

---

## 🚀 Rollout Strategy

### Week 1-2: Internal Alpha
- Deploy to staging environment
- Test with 2-3 core editors
- Gather feedback, fix critical bugs

### Week 3-4: Limited Beta
- Deploy to production (feature flag)
- Enable for 10-15 editors
- Monitor usage, performance, costs

### Week 5-6: Expanded Beta
- Enable for all editors
- Collect comprehensive feedback
- Optimize based on usage patterns

### Week 7-8: General Availability
- Full rollout to all users
- Documentation and training
- Ongoing monitoring and improvement

---

## 💰 Cost Considerations

### AI API Costs
- **OpenRouter API** - Pay-per-use pricing
- **Estimated Monthly Cost** - $200-500 (based on usage)
- **Cost Optimization** - Caching, rate limiting, model selection

### Development Costs
- **Phase 1-2** - 4-6 weeks (1 developer)
- **Phase 3-4** - 4-6 weeks (1 developer)
- **Total Estimate** - 8-12 weeks development time

### Infrastructure
- **No additional servers** - Serverless API routes
- **Database** - Minimal additional storage
- **Monitoring** - Standard observability tools

---

## 🎯 Key Differentiators

What makes this AI editor unique:

1. **Chassidic-Aware AI** - Trained/prompted for Jewish concepts
2. **Contextual Intelligence** - Knows topic relationships, sources
3. **Proactive, Not Reactive** - Suggests before you ask
4. **Integrated, Not Separate** - AI woven into workflow
5. **Explainable** - Shows reasoning, confidence scores
6. **Actionable** - One-click to apply suggestions

---

## 📚 Related Documentation

- **[LONGTERM_TASKS.md](../Documentation/Longterm-tasks.md)** - Strategic roadmap
- **[AI_INTEGRATION_IMPLEMENTATION.md](./AI_INTEGRATION_IMPLEMENTATION.md)** - Current AI features
- **[CITATION_SYSTEM_TODO.md](./CITATION_SYSTEM_TODO.md)** - Citation enhancements
- **[EDITOR_UNIFICATION.md](./EDITOR_UNIFICATION.md)** - Editor architecture

---

## 🔄 Next Steps

1. **Review & Approve** - Stakeholder review of vision
2. **Prioritize Features** - Confirm Phase 1 scope
3. **Design Mockups** - UI/UX designs for key features
4. **Spike & Prototype** - Technical feasibility testing
5. **Begin Phase 1** - Start implementation

---

**Document Version:** 1.0  
**Status:** Draft for Review  
**Next Review:** January 29, 2026
