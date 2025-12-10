#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors bundle size, runtime performance, and key metrics
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => {
        calculateSize(path.join(itemPath, item));
      });
    } else {
      totalSize += stats.size;
    }
  }

  try {
    calculateSize(dirPath);
    return totalSize;
  } catch (error) {
    console.warn(`Could not calculate size for ${dirPath}:`, error.message);
    return 0;
  }
}

function analyzeBundleSize() {
  console.log('\n📦 Bundle Size Analysis');
  console.log('='.repeat(50));

  if (!fs.existsSync(BUILD_DIR)) {
    console.log('⚠️  Build directory not found. Run `npm run build` first.');
    return;
  }

  // Analyze main chunks
  const chunksDir = path.join(STATIC_DIR, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
    console.log(`📄 JavaScript chunks: ${chunkFiles.length} files`);

    let totalChunkSize = 0;
    chunkFiles.forEach(file => {
      const filePath = path.join(chunksDir, file);
      const size = fs.statSync(filePath).size;
      totalChunkSize += size;

      if (size > 500 * 1024) { // > 500KB
        console.log(`  ⚠️  Large chunk: ${file} (${formatBytes(size)})`);
      }
    });

    console.log(`📊 Total chunk size: ${formatBytes(totalChunkSize)}`);
    console.log(`📈 Average chunk size: ${formatBytes(totalChunkSize / chunkFiles.length)}`);
  }

  // Analyze static assets
  const staticSize = getDirectorySize(STATIC_DIR);
  console.log(`🎯 Total static assets: ${formatBytes(staticSize)}`);
}

function checkBuildArtifacts() {
  console.log('\n🔍 Build Artifacts Check');
  console.log('='.repeat(50));

  const requiredFiles = [
    'server/app-paths-manifest.json',
    'static/chunks/webpack.js',
    'static/chunks/main.js',
    'build-manifest.json'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(BUILD_DIR, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
  });
}

function performanceRecommendations() {
  console.log('\n💡 Performance Recommendations');
  console.log('='.repeat(50));

  console.log('🔄 Code Splitting:');
  console.log('  - Consider lazy loading large components');
  console.log('  - Use dynamic imports for heavy libraries');
  console.log('  - Implement route-based code splitting');

  console.log('\n📦 Bundle Optimization:');
  console.log('  - Tree shaking unused dependencies');
  console.log('  - Compress images and assets');
  console.log('  - Use CDN for static assets');

  console.log('\n⚡ Runtime Performance:');
  console.log('  - Virtual scrolling for long lists');
  console.log('  - Debounce search inputs');
  console.log('  - Implement proper caching strategies');
}

function main() {
  console.log('🚀 Chabad Mafteach Performance Monitor');
  console.log('=====================================');

  analyzeBundleSize();
  checkBuildArtifacts();
  performanceRecommendations();

  console.log('\n✨ Analysis complete!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeBundleSize, checkBuildArtifacts, performanceRecommendations };
