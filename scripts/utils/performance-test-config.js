/**
 * Comprehensive Performance Test Suite
 * 
 * Tests various scenarios to find breaking points
 */

const tests = {
    edgeCases: [
        {
            name: 'Empty Topic',
            data: {
                name: 'Empty Test',
                slug: 'empty-test',
                // All content fields empty
            }
        },
        {
            name: 'Hebrew Only',
            data: {
                name_hebrew: 'רק עברית',
                slug: 'hebrew-only',
                definition_short: 'רק עברית בלבד'
            }
        },
        {
            name: 'Very Long Content',
            data: {
                name: 'Long Content Test',
                slug: 'long-content',
                article: 'x'.repeat(50000) // 50,000 characters
            }
        },
        {
            name: 'Special Characters',
            data: {
                name: 'Test <script>alert("xss")</script>',
                slug: 'special-chars-test',
                definition_short: ''; DROP TABLE topics; --'
      }
    },
    {
        name: 'Malformed Markdown',
        data: {
            name: 'Bad Markdown',
            slug: 'bad-markdown',
            article: '### Unclosed header\n```\nUnclosed code block\n**Unclosed bold'
      }
    }
  ],

performanceThresholds: {
    pageLoad: 3000, // 3 seconds max
        apiResponse: 200, // 200ms max
            fcp: 1800, // First Contentful Paint
                lcp: 2500, // Largest Contentful Paint
                    cls: 0.1, // Cumulative Layout Shift
  },

loadLevels: [
    { topics: 10, expected: 'fast' },
    { topics: 50, expected: 'good' },
    { topics: 100, expected: 'acceptable' },
    { topics: 500, expected: 'slow but works' },
    { topics: 1000, expected: 'breaking point?' }
]
};

console.log('Performance Test Configuration');
console.log('==============================\n');
console.log('Edge Cases:', tests.edgeCases.length);
console.log('Performance Thresholds:', tests.performanceThresholds);
console.log('Load Levels:', tests.loadLevels.length);

export default tests;
