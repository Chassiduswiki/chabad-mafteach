import { getBaseUrl } from '@/lib/utils/base-url';

export async function measureQueryPerformance(options?: { baseUrl?: string; timeoutMs?: number }) {
  const baseUrl = options?.baseUrl || getBaseUrl();
  const timeoutMs = options?.timeoutMs ?? 8000;

  console.log('📊 Analyzing API query performance...');

  try {
    // 1. Test search endpoint performance
    console.log('\n1. Testing search endpoint performance...');

    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), timeoutMs);
    const searchStart = Date.now();
    const searchResponse = await fetch(`${baseUrl}/api/search?q=tanya`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: searchController.signal
    });
    clearTimeout(searchTimeout);
    const searchTime = Date.now() - searchStart;

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Search query completed in ${searchTime}ms`);
      console.log(`   - Documents found: ${searchData.documents?.length || 0}`);
      console.log(`   - Topics found: ${searchData.topics?.length || 0}`);
      console.log(`   - Statements found: ${searchData.statements?.length || 0}`);
    } else {
      console.log(`❌ Search query failed: ${searchResponse.status}`);
    }

    // 2. Test topics endpoint performance
    console.log('\n2. Testing topics endpoint performance...');

    const topicsController = new AbortController();
    const topicsTimeout = setTimeout(() => topicsController.abort(), timeoutMs);
    const topicsStart = Date.now();
    const topicsResponse = await fetch(`${baseUrl}/api/topics?limit=10`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: topicsController.signal
    });
    clearTimeout(topicsTimeout);
    const topicsTime = Date.now() - topicsStart;

    if (topicsResponse.ok) {
      const topicsData = await topicsResponse.json();
      console.log(`✅ Topics query completed in ${topicsTime}ms`);
      console.log(`   - Topics returned: ${topicsData.topics?.length || 0}`);
    } else {
      console.log(`❌ Topics query failed: ${topicsResponse.status}`);
    }

    // 3. Test documents endpoint performance
    console.log('\n3. Testing documents endpoint performance...');

    const docsController = new AbortController();
    const docsTimeout = setTimeout(() => docsController.abort(), timeoutMs);
    const docsStart = Date.now();
    const docsResponse = await fetch(`${baseUrl}/api/documents?doc_type=sefer`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: docsController.signal
    });
    clearTimeout(docsTimeout);
    const docsTime = Date.now() - docsStart;

    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log(`✅ Documents query completed in ${docsTime}ms`);
      console.log(`   - Documents returned: ${Array.isArray(docsData) ? docsData.length : 0}`);
    } else {
      console.log(`❌ Documents query failed: ${docsResponse.status}`);
    }

    // 4. Performance recommendations
    console.log('\n📈 Performance Analysis Summary:');
    console.log(`   - Search endpoint: ${searchTime}ms`);
    console.log(`   - Topics endpoint: ${topicsTime}ms`);
    console.log(`   - Documents endpoint: ${docsTime}ms`);

    const avgTime = (searchTime + topicsTime + docsTime) / 3;
    console.log(`   - Average response time: ${avgTime.toFixed(1)}ms`);

    if (avgTime > 1000) {
      console.log('⚠️ WARNING: Average response time > 1s - consider optimization');
    } else if (avgTime > 500) {
      console.log('⚡ NOTICE: Response times could be improved with caching/indexing');
    } else {
      console.log('✅ Good performance - response times under 500ms');
    }

    console.log('\n🔧 Recommended Optimizations:');
    console.log('   1. Add database indexes on frequently queried fields');
    console.log('   2. Implement Redis caching for topics/documents');
    console.log('   3. Consider query result caching');
    console.log('   4. Optimize complex search queries');

    return {
      searchTime,
      topicsTime,
      docsTime,
      averageTime: avgTime,
      recommendations: [
        'Add database indexes on frequently queried fields',
        'Implement Redis caching for topics/documents',
        'Consider query result caching',
        'Optimize complex search queries'
      ]
    };

  } catch (error) {
    console.error('❌ Error during performance analysis:', error);
    throw error;
  }
}
