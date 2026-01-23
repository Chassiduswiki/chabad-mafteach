#!/usr/bin/env node

/**
 * Test Translation API Integration
 * Tests both backend API and Directus integration
 */

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testDirectusAccess() {
  console.log('🔍 Testing Directus API access...\n');
  
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/topic_translations?limit=5`);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      console.log(`✅ Directus: Found ${data.data.length} translations`);
      console.log(`   Sample: ${data.data[0].title} (${data.data[0].language_code})\n`);
      return true;
    } else {
      console.log('❌ Directus: No translations found\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Directus Error: ${error.message}\n`);
    return false;
  }
}

async function testBackendAPI() {
  console.log('🔍 Testing Backend API...\n');
  
  const tests = [
    { url: `${API_URL}/api/topics/avodah?lang=he`, expected: 'עבודה' },
    { url: `${API_URL}/api/topics/avodah?lang=en`, expected: 'Avodah' },
    { url: `${API_URL}/api/topics/translations?topic_id=122`, expected: 'array' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      
      if (!response.ok) {
        console.log(`❌ ${test.url}`);
        console.log(`   Status: ${response.status}\n`);
        failed++;
        continue;
      }
      
      const data = await response.json();
      
      if (test.expected === 'array' && Array.isArray(data)) {
        console.log(`✅ ${test.url}`);
        console.log(`   Found ${data.length} translations\n`);
        passed++;
      } else if (data.topic?.title === test.expected) {
        console.log(`✅ ${test.url}`);
        console.log(`   Title: ${data.topic.title}\n`);
        passed++;
      } else {
        console.log(`⚠️  ${test.url}`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Got: ${data.topic?.title || 'N/A'}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.url}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  return { passed, failed };
}

async function main() {
  console.log('🚀 Translation API Integration Test\n');
  console.log('='.repeat(50) + '\n');
  
  const directusOk = await testDirectusAccess();
  const { passed, failed } = await testBackendAPI();
  
  console.log('='.repeat(50));
  console.log('📊 RESULTS\n');
  console.log(`Directus Access: ${directusOk ? '✅' : '❌'}`);
  console.log(`Backend Tests: ${passed} passed, ${failed} failed\n`);
  
  if (directusOk && failed === 0) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else if (!directusOk) {
    console.log('⚠️  Directus access issue - check permissions\n');
    process.exit(1);
  } else {
    console.log('⚠️  Backend needs to be running: npm run dev\n');
    process.exit(1);
  }
}

main();
