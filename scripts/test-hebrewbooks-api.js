#!/usr/bin/env node

/**
 * HebrewBooks API Test Script
 * Attempts to access HebrewBooks API endpoints with various bypass techniques
 */

const https = require('https');
const http = require('http');

const API_ENDPOINTS = [
  'https://hebrewbooks.org/api/bookinfo/15419',
  'https://hebrewbooks.org/bookinfo.aspx?id=15419&callback=setBookInfo',
  'https://hebrewbooks.org/api.aspx?bookinfo=15419',
  'https://hebrewbooks.org/api.aspx?callback=setBookInfo&id=15419',
  'https://hebrewbooks.org/search.aspx?query=derech&type=title',
  'https://hebrewbooks.org/api/subjects',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 HebrewBooks/1.0',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://hebrewbooks.org/',
  'X-Requested-With': 'XMLHttpRequest',
};

function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: HEADERS,
      timeout: 10000,
    };

    console.log(`\n🔍 Testing: ${url}`);
    
    const req = client.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Response length: ${data.length} chars`);
        
        // Check if it's Cloudflare challenge page
        if (data.includes('Just a moment') || data.includes('cf-challenge')) {
          console.log('🚫 Cloudflare challenge detected');
          resolve({ url, status: 'blocked', reason: 'Cloudflare' });
        } else if (data.includes('callback(')) {
          console.log('✅ JSONP response detected!');
          console.log(`📝 Preview: ${data.substring(0, 200)}...`);
          resolve({ url, status: 'success', type: 'jsonp', data: data.substring(0, 500) });
        } else if (data.startsWith('{') || data.startsWith('[')) {
          console.log('✅ JSON response detected!');
          console.log(`📝 Preview: ${data.substring(0, 200)}...`);
          resolve({ url, status: 'success', type: 'json', data: data.substring(0, 500) });
        } else {
          console.log('❓ Unknown response format');
          console.log(`📝 Preview: ${data.substring(0, 200)}...`);
          resolve({ url, status: 'unknown', data: data.substring(0, 500) });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve({ url, status: 'error', error: err.message });
    });

    req.on('timeout', () => {
      console.log('⏰ Request timeout');
      req.destroy();
      resolve({ url, status: 'timeout' });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🚀 Testing HebrewBooks API endpoints...\n');
  
  const results = [];
  for (const endpoint of API_ENDPOINTS) {
    try {
      const result = await testEndpoint(endpoint);
      results.push(result);
    } catch (error) {
      console.log(`💥 Failed to test ${endpoint}: ${error.message}`);
      results.push({ url: endpoint, status: 'failed', error: error.message });
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.status === 'success');
  const blocked = results.filter(r => r.status === 'blocked');
  const errors = results.filter(r => r.status === 'error' || r.status === 'failed');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`🚫 Blocked: ${blocked.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 WORKING ENDPOINTS:');
    successful.forEach(result => {
      console.log(`   ${result.url} (${result.type})`);
    });
  }
  
  if (blocked.length > 0) {
    console.log('\n🚫 BLOCKED BY CLOUDFLARE:');
    blocked.forEach(result => {
      console.log(`   ${result.url}`);
    });
  }
}

// Test some alternative endpoints that might work
const alternativeEndpoints = [
  'https://hebrewbooks.org/search.aspx?srch=derech%20mitzvosecha&stype=title',
  'https://hebrewbooks.org/advanced.aspx',
  'https://hebrewbooks.org/browse.aspx',
];

async function testAlternativeEndpoints() {
  console.log('\n🔍 Testing alternative endpoints...\n');
  
  for (const endpoint of alternativeEndpoints) {
    await testEndpoint(endpoint);
  }
}

// Run the tests
testAllEndpoints()
  .then(() => testAlternativeEndpoints())
  .then(() => {
    console.log('\n🏁 Testing complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
