# Semantic Search Testing Guide

**Last Updated**: 2026-01-30  
**Status**: Ready for testing  

This guide will help you test all the semantic search features we've implemented and fixed.

---

## 🚀 **Quick Start Testing**

### **1. Start the Development Server**
```bash
npm run dev
```
The server should start on `http://localhost:3000`

### **2. Verify Directus Connection**
Ensure your `.env.local` has:
```bash
DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=your-directus-token
OPENROUTER_API_KEY=your-openrouter-key
```

### **3. Check the Search UI**
Navigate to `http://localhost:3000` and press `Cmd+K` (or `Ctrl+K`) to open the command menu.

---

## 🔍 **Phase 1: Basic Search Functionality**

### **Test 1.1: Keyword Search**
1. Open command menu (`Cmd+K`)
2. Type: `bitul`
3. **Expected**: Results should appear with keyword matches
4. **Verify**: No semantic indicators should be shown

### **Test 1.2: Semantic Search**
1. Click the "Semantic" button in the search mode selector
2. Type: `humility` (conceptual search)
3. **Expected**: Results should appear with 🧠 brain icons and similarity scores
4. **Verify**: Semantic badges show similarity percentages

### **Test 1.3: Hybrid Search**
1. Click the "Hybrid" button
2. Adjust semantic weight slider (try 30%, 60%, 80%)
3. Type: `faith`
4. **Expected**: Results should combine keyword and semantic matches
5. **Verify**: Both types of results appear

---

## 🎯 **Phase 2: Advanced Features**

### **Test 2.1: Similar Topics Widget**
1. Navigate to any topic page (e.g., `/topics/bitul`)
2. **Expected**: Similar Topics widget should appear
3. **Test**: Shows 3 related topics with similarity scores
4. **Verify**: Clicking links navigates to related topics

### **Test 2.2: Error Handling**
1. Try searching with invalid characters
2. **Expected**: Graceful error message
3. **Test**: Search continues to work for valid queries
4. **Verify**: No crashes or white screens

### **Test 2.3: Rate Limiting**
1. Perform many rapid searches (20+ in a minute)
2. **Expected**: Should still work (our rate limits are generous)
3. **Test**: No rate limit errors appear
4. **Verify**: Performance remains responsive

---

## 📊 **Phase 3: Performance & Analytics**

### **Test 3.1: Search Performance**
1. Open browser dev tools (F12)
2. Go to Network tab
3. Search for: `emunah`
4. **Expected**: Search completes within 800ms
5. **Verify**: Response time is reasonable

### **Test 3.2: Cache Performance**
1. Search for: `ratzon` twice
2. **Expected**: Second search should be faster (cached)
3. **Test**: Cache hit indicator in network tab
4. **Verify**: No unnecessary API calls

### **Test 3.3: Error Recovery**
1. Temporarily break the OpenRouter connection (disable internet)
2. Search for: `taanug`
3. **Expected**: Falls back to keyword search
4. **Verify**: User gets results despite semantic search failure

---

## 🛠️ **Phase 4: Edge Cases & Stress Testing**

### **Test 4.1: Empty Queries**
1. Press `Cmd+K` and search with empty string
2. **Expected**: No results, no errors
3. **Verify**: UI remains responsive

### **Test 4.2: Long Queries**
1. Search with very long text (200+ characters)
2. **Expected**: "Query too long" message
3. **Verify**: No crashes

### **Test 4.3: Special Characters**
1. Search with Hebrew: `ביטול`
2. Search with quotes: `"faith"`
3. Search with symbols: `@#$%`
4. **Expected**: All should work properly

### **Test 4.4: Concurrent Searches**
1. Open multiple browser tabs
2. Search different queries simultaneously
3. **Expected**: All searches complete successfully
4. **Verify**: No interference between searches

---

## 🔧 **Developer Testing Tools**

### **Test 5.1: Console Monitoring**
1. Open browser dev tools
2. Go to Console tab
3. **Expected**: No error messages in normal operation
4. **Monitor**: Look for structured logs from our logger

### **Test 5.2: Network Inspection**
1. Go to Network tab
2. Filter by `/api/search`
3. **Expected**: Proper request/response cycles
4. **Verify**: Headers, status codes, response formats

### **Test 5.3: Memory Usage**
1. Monitor browser memory tab
2. Perform 50+ searches
3. **Expected**: Memory usage remains stable
4. **Verify**: No memory leaks

---

## 📱 **API Testing**

### **Test 6.1: Direct API Calls**
```bash
# Test keyword search
curl "http://localhost:3000/api/search?q=bitul&mode=keyword"

# Test semantic search
curl "http://localhost:3000/api/search?q=humility&mode=semantic"

# Test hybrid search
curl "http://localhost:3000/api/search?q=faith&mode=hybrid&semantic_weight=0.6"
```

### **Test 6.2: Error Responses**
```bash
# Test empty query
curl "http://localhost:3000/api/search?q=&mode=keyword"

# Test too long query
curl "http://localhost:3000/api/search?q=$(python -c 'print("x" * 250)&mode=keyword"
```

### **Test 6.3: Semantic Search API**
```bash
curl -X POST "http://localhost:3000/api/search/semantic" \
  -H "Content-Type: application/json" \
  -d '{"query":"humility","collections":["topics"],"limit":5,"threshold":0.75}'
```

---

## 🧪 **Integration Testing**

### **Test 7.1: Component Integration**
1. **SimilarTopics Component**:
   ```tsx
   // Test in browser console
   import { SimilarTopics } from '@/components/topics/SimilarTopics';
   // Verify component renders without errors
   ```

2. **useSemanticSearch Hook**:
   ```tsx
   // Test in browser console
   import { useSemanticSearch } from '@/hooks/useSemanticSearch';
   // Verify hook returns proper data structure
   ```

### **Test 7.2: Error Boundary Testing**
1. Force an error in SimilarTopics component
2. **Expected**: Error boundary catches and shows fallback UI
3. **Verify**: App continues to function normally

---

## 📋 **Performance Benchmarks**

### **Expected Performance Metrics:**
- **Search Latency**: < 800ms (p95)
- **Cache Hit Rate**: >40% for popular queries
- **Memory Usage**: < 50MB for cache
- **Error Rate**: <1% for normal operations

### **How to Measure:**
```javascript
// In browser console
performance.mark('search-start');
// Perform search
performance.mark('search-end');
performance.measure('search-duration', 'search-start', 'search-end');
```

---

## 🐛 **Troubleshooting Common Issues**

### **Issue: No Semantic Results**
**Symptoms**: Semantic search returns no results or errors
**Solutions**:
1. Check OpenRouter API key in `.env.local`
2. Verify OpenRouter service is accessible
3. Check browser console for API errors
4. Test fallback to keyword search

### **Issue: Similar Topics Not Showing**
**Symptoms**: Similar Topics widget doesn't appear or shows no results
**Solutions**:
1. Verify topic has searchable content (name, canonical_title)
2. Check topic exists in Directus
3. Verify `/api/topics/{id}` endpoint works
4. Check browser console for errors

### **Issue: Search Mode Selector Missing**
**Symptoms**: No mode selector buttons in command menu
**Solutions**:
1. Verify CommandMenu component updated
2. Check for import errors
3. Refresh browser cache
4. Check React Query dev tools

### **Issue: Performance Issues**
**Symptoms**: Search is slow or unresponsive
**Solutions**:
1. Check embedding queue status
2. Monitor cache hit rates
3. Verify OpenRouter rate limits
4. Check for memory leaks

---

## ✅ **Testing Checklist**

### **Before Testing:**
- [ ] Development server running
- [ ] Directus connection verified
- [ ] Environment variables configured
- [ ] No TypeScript errors

### **Basic Functionality:**
- [ ] Keyword search works
- [ ] Semantic search works
- [ ] Hybrid search works
- [ ] Search mode selector functions
- [ ] Similar topics widget appears

### **Advanced Features:**
- [ ] Error handling works
- [ ] Fallback strategies work
- [ ] Rate limiting works
- [ ] Cache performance is good

### **Performance:**
- [ ] Search latency < 800ms
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Cache hit rate >40%

### **Integration:**
- [ ] All components render without errors
- [ ] Error boundaries catch failures
- [ ] API responses are correct
- [ ] No console errors

---

## 🎯 **Success Indicators**

### **✅ Working Correctly:**
- Search returns relevant results quickly
- Semantic indicators appear for conceptual matches
- Similar topics show related content
- Error handling is graceful
- Performance is responsive

### **⚠️ Needs Attention:**
- Search takes > 2 seconds consistently
- Memory usage grows over time
- Console shows errors
- Components crash or fail to render

### **❌ Critical Issues:**
- No search results appear
- App crashes on search
- Rate limit errors block usage
- Semantic search always fails

---

## 📞 **Getting Help**

If you encounter issues:

1. **Check console** - Look for error messages
2. **Check network tab** - Verify API calls
3. **Check .env.local** - Verify configuration
4. **Restart dev server** - Clear cache issues
5. **Review this guide** - Follow troubleshooting steps

---

**Happy Testing! 🚀**
