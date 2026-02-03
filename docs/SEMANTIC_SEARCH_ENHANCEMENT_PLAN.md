# Semantic Search Enhancement Plan - Realistic Implementation

**Priority**: High  
**Timeline**: 4-6 weeks  
**Status**: Ready to start  
**Branch**: `feature/semantic-search-enhancement`

## 📋 Executive Summary

This plan focuses on **pragmatic improvements** to the existing semantic search implementation, working within real constraints:
- OpenRouter API: 100 requests/minute limit
- JSON vector storage (no native pgvector)
- Single developer capacity
- Budget <$30/month

## 🎯 Success Metrics

### Quantitative Targets (3 months)
- Search CTR: +10% (from current baseline)
- Zero-result rate: <8%
- Search latency: <800ms (p95)
- Cache hit rate: >40%
- Monthly cost: <$30

### Qualitative Goals
- Users can distinguish semantic vs keyword matches
- Search mode selection available
- Basic content discovery features
- Improved search relevance

## 🚀 Phase 1: Pragmatic Foundation (Week 1-2)

### Task 1.1: Fix OpenRouter Rate Limiting
**Priority**: Critical  
**File**: `lib/vector/embedding-service.ts`
**Issue**: Current rate limiting is basic, needs proper queuing

**Implementation**:
```typescript
export class EmbeddingQueue {
  private queue: EmbeddingJob[] = [];
  private processing = false;
  private readonly MAX_BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 6000; // 6 seconds between batches

  async addToQueue(job: EmbeddingJob): Promise<void> {
    this.queue.push(job);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.MAX_BATCH_SIZE);
      await this.processBatch(batch);
      await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
    }
    this.processing = false;
  }
}
```

**Acceptance Criteria**:
- [ ] No more rate limit errors from OpenRouter
- [ ] Queue processes 50 items without timeout
- [ ] Exponential backoff on failures
- [ ] Progress tracking for batch jobs

### Task 1.2: Add Semantic Indicators to UI
**Priority**: High  
**File**: `components/features/search/CommandMenu.tsx`
**Issue**: Users can't distinguish semantic vs keyword matches

**Implementation**:
```typescript
interface EnhancedSearchResult extends SearchResult {
  is_semantic_match: boolean;
  semantic_score?: number;
  hybrid_score?: number;
}

// Add visual indicators
{result.is_semantic_match && (
  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
    <Brain className="w-3 h-3" />
    <span>Semantic</span>
    {result.semantic_score && (
      <span className="text-muted-foreground">
        ({Math.round(result.semantic_score * 100)}%)
      </span>
    )}
  </div>
)}
```

**Acceptance Criteria**:
- [ ] Semantic matches show brain icon
- [ ] Similarity scores displayed
- [ ] Color-coded indicators
- [ ] Accessible labels

### Task 1.3: Add Search Mode Selector
**Priority**: High  
**File**: `components/features/search/CommandMenu.tsx`
**Issue**: Users can't choose search modes

**Implementation**:
```typescript
export function SearchModeSelector() {
  const [mode, setMode] = useState<'keyword' | 'semantic' | 'hybrid'>('keyword');
  const [semanticWeight, setSemanticWeight] = useState(0.6);

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <ToggleGroup 
        value={mode} 
        onValueChange={(value) => setMode(value as any)}
      >
        <ToggleGroupItem value="keyword">Keyword</ToggleGroupItem>
        <ToggleGroupItem value="semantic">Semantic</ToggleGroupItem>
        <ToggleGroupItem value="hybrid">Hybrid</ToggleGroupItem>
      </ToggleGroup>
      
      {mode === 'hybrid' && (
        <div className="flex items-center gap-2 text-sm">
          <span>Semantic weight:</span>
          <Slider 
            value={[semanticWeight]} 
            onValueChange={([value]) => setSemanticWeight(value)}
            min={0} 
            max={1} 
            step={0.1}
            className="w-20"
          />
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Three search modes available
- [ ] Hybrid mode weight adjustment
- [ ] Mode persists in session
- [ ] Responsive design

## 🔧 Phase 2: Practical Enhancements (Week 2-3)

### Task 2.1: Simple "Similar Topics" Widget
**Priority**: High  
**File**: `components/topics/SimilarTopics.tsx` (new)
**Issue**: No content discovery features

**Implementation**:
```typescript
export function SimilarTopics({ topicId, limit = 3 }: { topicId: string; limit?: number }) {
  const { data: similarTopics, isLoading } = useQuery({
    queryKey: ['similar-topics', topicId],
    queryFn: async () => {
      const response = await fetch(`/api/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: topicId,
          collections: ['topics'],
          limit,
          threshold: 0.75,
          excludeIds: [topicId]
        })
      });
      return response.json();
    },
    enabled: !!topicId
  });

  if (isLoading || !similarTopics?.results?.length) return null;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Similar Topics
      </h3>
      <div className="space-y-2">
        {similarTopics.results.map((topic: any) => (
          <Link 
            key={topic.id} 
            href={topic.url}
            className="block p-2 rounded hover:bg-muted transition-colors"
          >
            <div className="font-medium">{topic.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {topic.content_preview}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows 3 similar topics
- [ ] Uses semantic search API
- [ ] Excludes current topic
- [ ] Loading states handled

### Task 2.2: Create useSemanticSearch Hook
**Priority**: Medium  
**File**: `hooks/useSemanticSearch.ts` (new)
**Issue**: No reusable semantic search logic

**Implementation**:
```typescript
export function useSemanticSearch(
  query: string, 
  options: {
    mode?: 'keyword' | 'semantic' | 'hybrid';
    semanticWeight?: number;
    enabled?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { mode = 'keyword', semanticWeight = 0.6, enabled = true, debounceMs = 300 } = options;
  
  return useQuery({
    queryKey: ['search', query, mode, semanticWeight],
    queryFn: async () => {
      if (!query.trim()) return { topics: [], statements: [], documents: [], locations: [] };
      
      const params = new URLSearchParams({
        q: query,
        mode,
        semantic_weight: semanticWeight.toString()
      });
      
      const response = await fetch(`/api/search?${params}`);
      return response.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Acceptance Criteria**:
- [ ] Reusable search hook
- [ ] Debounced queries
- [ ] Mode selection support
- [ ] Proper caching

### Task 2.3: Performance Monitoring
**Priority**: Medium  
**File**: `lib/search-analytics.ts` (new)
**Issue**: No performance tracking

**Implementation**:
```typescript
interface SearchMetrics {
  query: string;
  mode: string;
  latency: number;
  resultCount: number;
  timestamp: Date;
  userId?: string;
}

class SearchAnalytics {
  private metrics: SearchMetrics[] = [];

  logSearch(metrics: SearchMetrics) {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log to console for now (could be sent to analytics service)
    console.log('Search metrics:', {
      query: metrics.query,
      mode: metrics.mode,
      latency: `${metrics.latency}ms`,
      results: metrics.resultCount
    });
  }

  getAverageLatency(mode?: string): number {
    const filtered = mode 
      ? this.metrics.filter(m => m.mode === mode)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.latency, 0);
    return total / filtered.length;
  }
}

export const searchAnalytics = new SearchAnalytics();
```

**Acceptance Criteria**:
- [ ] Search latency tracking
- [ ] Mode-specific metrics
- [ ] Average performance calculation
- [ ] Console logging

## 📊 Phase 3: Optimization & Polish (Week 3-4)

### Task 3.1: Cache Optimization
**Priority**: Medium  
**File**: `lib/cache.ts`
**Issue**: Basic caching strategy needs improvement

**Implementation**:
```typescript
// Add semantic search specific cache keys
export const cacheKeys = {
  semanticSearch: (query: string, mode: string, weight: number) => 
    `search:semantic:${query}:${mode}:${weight}`,
  similarTopics: (topicId: string) => `similar:topics:${topicId}`,
  embedding: (text: string) => `embedding:${hash(text)}`,
};

// Add cache warming for popular queries
export async function warmSearchCache() {
  const popularQueries = ['bitul', 'emunah', 'ratzon', 'taanug'];
  
  for (const query of popularQueries) {
    await fetch(`/api/search?q=${query}&mode=hybrid`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

**Acceptance Criteria**:
- [ ] Improved cache key strategy
- [ ] Cache warming for popular queries
- [ ] Cache hit rate tracking
- [ ] Proper TTL management

### Task 3.2: Error Handling Improvements
**Priority**: Medium  
**File**: `app/api/search/route.ts`
**Issue**: Generic error responses

**Implementation**:
```typescript
interface SearchError {
  code: 'RATE_LIMIT' | 'API_ERROR' | 'INVALID_QUERY' | 'SEMANTIC_SEARCH_FAILED';
  message: string;
  retryAfter?: number;
}

function handleSearchError(error: any, query: string): SearchError {
  if (error.message?.includes('rate limit')) {
    return {
      code: 'RATE_LIMIT',
      message: 'Too many search requests. Please try again in a moment.',
      retryAfter: 60
    };
  }
  
  if (error.message?.includes('OpenRouter')) {
    return {
      code: 'SEMANTIC_SEARCH_FAILED',
      message: 'Semantic search is temporarily unavailable. Using keyword search.',
    };
  }
  
  return {
    code: 'API_ERROR',
    message: 'Search failed. Please try again.',
  };
}
```

**Acceptance Criteria**:
- [ ] Structured error responses
- [ ] Rate limit error handling
- [ ] Fallback to keyword search
- [ ] User-friendly error messages

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/useSemanticSearch.test.ts
describe('useSemanticSearch', () => {
  it('should debounce search queries', async () => {
    // Test debouncing behavior
  });
  
  it('should handle different search modes', async () => {
    // Test mode switching
  });
});
```

### Integration Tests
```typescript
// __tests__/search-integration.test.ts
describe('Search Integration', () => {
  it('should return semantic results for conceptual queries', async () => {
    const response = await fetch('/api/search?q=humility&mode=semantic');
    const data = await response.json();
    expect(data.topics.some(t => t.is_semantic_match)).toBe(true);
  });
});
```

### Performance Tests
```typescript
// __tests__/search-performance.test.ts
describe('Search Performance', () => {
  it('should complete search within 800ms', async () => {
    const start = Date.now();
    await fetch('/api/search?q=test&mode=hybrid');
    const latency = Date.now() - start;
    expect(latency).toBeLessThan(800);
  });
});
```

## 📈 Implementation Checklist

### Week 1
- [ ] Fix OpenRouter rate limiting with proper queuing
- [ ] Add semantic indicators to CommandMenu
- [ ] Implement search mode selector
- [ ] Update search API to handle mode parameter

### Week 2
- [ ] Create SimilarTopics widget
- [ ] Build useSemanticSearch hook
- [ ] Add basic performance monitoring
- [ ] Test search functionality

### Week 3
- [ ] Optimize caching strategy
- [ ] Improve error handling
- [ ] Add comprehensive tests
- [ ] Performance benchmarking

### Week 4
- [ ] Polish UI/UX
- [ ] Document new features
- [ ] Deploy to production
- [ ] Monitor performance

## 🚦 Risk Mitigation

### Technical Risks
- **OpenRouter rate limits**: Implement proper queuing and exponential backoff
- **Performance degradation**: Add performance monitoring and caching
- **UI complexity**: Keep changes minimal and incremental

### User Experience Risks
- **Confusion about modes**: Add clear labels and tooltips
- **Performance perception**: Show loading states and progress indicators
- **Feature discovery**: Add visual cues for new features

## 📚 Documentation Requirements

### Technical Documentation
- [ ] Update API documentation for search modes
- [ ] Document new hooks and components
- [ ] Add performance benchmarking guide
- [ ] Create troubleshooting guide

### User Documentation
- [ ] Update search help text
- [ ] Add semantic search explanation
- [ ] Document search mode differences
- [ ] Create feature announcement

## 🔄 Rollback Plan

If issues arise:
1. **Immediate rollback**: Disable semantic search mode via feature flag
2. **Partial rollback**: Remove new UI components, keep backend changes
3. **Full rollback**: Revert to previous commit if critical issues

## 📊 Success Measurement

### Analytics to Track
- Search mode usage distribution
- Semantic vs keyword result CTR
- Search latency by mode
- Error rates by mode

### User Feedback Channels
- In-app feedback mechanism
- Search result quality surveys
- Support ticket analysis
- User session recordings

---

**Ready to start implementation** ✅

**Next step**: Begin with Task 1.1 - Fix OpenRouter Rate Limiting
