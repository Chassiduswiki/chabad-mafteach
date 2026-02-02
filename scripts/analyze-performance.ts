import { measureQueryPerformance } from '@/lib/performance/analyze-performance';

export { measureQueryPerformance };

// Usage instructions
if (require.main === module) {
  console.log('⚡ API Performance Analysis Script');
  console.log('This script will test response times for key API endpoints.');
  console.log('');
  console.log('Requirements:');
  console.log('- NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL environment variable set');
  console.log('- API endpoints accessible');
  console.log('');

  // Uncomment the line below when ready to run
  // measureQueryPerformance().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}
