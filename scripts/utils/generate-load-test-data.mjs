import { createDirectus, rest, authentication } from '@directus/sdk';

const directus = createDirectus('http://localhost:8055')
    .with(rest())
    .with(authentication());

async function generateLoadTestData() {
    try {
        await directus.login({ email: 'admin@example.com', password: 'password' });
        console.log('✓ Authenticated');

        const categories = ['avodah', 'emunah', 'theology', 'kabbalah'];
        const batchSize = 100;

        console.log(`\nGenerating ${batchSize} test topics...`);

        for (let i = 1; i <= batchSize; i++) {
            const topic = {
                name: `Test Topic ${i}`,
                name_hebrew: `נושא מבחן ${i}`,
                slug: `test-topic-${i}`,
                category: categories[i % categories.length],
                definition_short: `This is a test topic ${i} for load testing purposes.`,
                overview: `# Overview\n\nThis is test topic ${i}. `.repeat(10),
                article: `# Article\n\nLong form content for topic ${i}. `.repeat(50),
                is_published: true,
            };

            await directus.request({
                method: 'POST',
                path: '/items/topics',
                body: JSON.stringify(topic)
            });

            if (i % 10 === 0) {
                console.log(`  Created ${i}/${batchSize} topics`);
            }
        }

        console.log(`\n✅ Created ${batchSize} test topics successfully!`);

        // Get stats
        const stats = await directus.request({
            method: 'GET',
            path: '/items/topics?aggregate[count]=*&filter[slug][_starts_with]=test-topic'
        });

        console.log(`\n📊 Total test topics in DB: ${stats.data[0]?.count || 0}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Cleanup function
async function cleanupTestData() {
    try {
        await directus.login({ email: 'admin@example.com', password: 'password' });

        // Delete all test topics
        await directus.request({
            method: 'DELETE',
            path: '/items/topics',
            params: {
                filter: { slug: { _starts_with: 'test-topic' } }
            }
        });

        console.log('✅ Cleaned up test data');
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    }
}

// Run based on argument
const action = process.argv[2];

if (action === 'cleanup') {
    cleanupTestData();
} else {
    generateLoadTestData();
}

export { generateLoadTestData, cleanupTestData };
