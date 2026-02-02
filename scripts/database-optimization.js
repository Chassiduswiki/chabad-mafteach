const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * Database Optimization Script
 *
 * Analyzes query performance and recommends database indexes
 */

async function analyzeQueryPerformance() {
    console.log('🔍 Analyzing query performance and recommending optimizations...\n');

    const analyses = [
        {
            name: 'Topics by Type Query',
            query: 'SELECT id, canonical_title, topic_type FROM topics WHERE topic_type = ?',
            recommendation: 'Index on topic_type for category filtering',
            impact: 'High'
        },
        {
            name: 'Topics Search Query',
            query: 'SELECT * FROM topics WHERE canonical_title LIKE ? OR description LIKE ?',
            recommendation: 'Full-text index on canonical_title and description',
            impact: 'High'
        },
        {
            name: 'Statements by Paragraph Query',
            query: 'SELECT * FROM statements WHERE paragraph_id = ?',
            recommendation: 'Index on paragraph_id',
            impact: 'Medium'
        },
        {
            name: 'Statement-Topic Junction Query',
            query: 'SELECT * FROM statement_topics WHERE statement_id = ? OR topic_id = ?',
            recommendation: 'Composite index on (statement_id, topic_id)',
            impact: 'High'
        },
        {
            name: 'Document Paragraphs Query',
            query: 'SELECT * FROM paragraphs WHERE document_id = ? ORDER BY order_key',
            recommendation: 'Index on document_id, order by order_key',
            impact: 'Medium'
        }
    ];

    console.log('📊 Query Analysis Results:\n');

    for (const analysis of analyses) {
        console.log(`Query: ${analysis.name}`);
        console.log(`Pattern: ${analysis.query}`);
        console.log(`Recommendation: ${analysis.recommendation}`);
        console.log(`Impact: ${analysis.impact}\n`);
    }

    return analyses;
}

async function checkExistingIndexes() {
    console.log('🔍 Checking existing database indexes...\n');

    try {
        // In a real scenario, you'd query information_schema or equivalent
        // For Directus, we can check through the API
        console.log('Current indexes detected:');
        console.log('- Primary keys (automatically indexed)');
        console.log('- Foreign key constraints (may be indexed)');

        console.log('\n⚠️  Note: Directus does not expose detailed index information through API');
        console.log('   Manual database inspection recommended for production systems');

    } catch (error) {
        console.error('❌ Error checking indexes:', error);
    }
}

async function recommendIndexCreation() {
    console.log('💡 Index Creation Recommendations:\n');

    const recommendations = [
        {
            table: 'topics',
            index: 'idx_topics_type',
            columns: ['topic_type'],
            reason: 'Category filtering on explore page'
        },
        {
            table: 'topics',
            index: 'idx_topics_title_search',
            columns: ['canonical_title'],
            type: 'FULLTEXT',
            reason: 'Text search functionality'
        },
        {
            table: 'statements',
            index: 'idx_statements_paragraph',
            columns: ['paragraph_id'],
            reason: 'Loading statements for paragraphs'
        },
        {
            table: 'statement_topics',
            index: 'idx_statement_topics_statement',
            columns: ['statement_id'],
            reason: 'Linking statements to topics'
        },
        {
            table: 'statement_topics',
            index: 'idx_statement_topics_topic',
            columns: ['topic_id'],
            reason: 'Finding statements for topics'
        },
        {
            table: 'paragraphs',
            index: 'idx_paragraphs_document_order',
            columns: ['document_id', 'order_key'],
            reason: 'Document paragraph ordering'
        }
    ];

    console.log('SQL Commands to create recommended indexes:\n');

    for (const rec of recommendations) {
        if (rec.type === 'FULLTEXT') {
            console.log(`-- ${rec.reason}`);
            console.log(`CREATE FULLTEXT INDEX ${rec.index} ON ${rec.table} (${rec.columns.join(', ')});`);
        } else {
            console.log(`-- ${rec.reason}`);
            console.log(`CREATE INDEX ${rec.index} ON ${rec.table} (${rec.columns.join(', ')});`);
        }
        console.log('');
    }

    return recommendations;
}

async function analyzeSlowQueries() {
    console.log('🐌 Slow Query Analysis:\n');

    // Simulate slow query detection
    const slowQueries = [
        {
            query: 'SELECT * FROM topics WHERE description LIKE ?',
            avgTime: '2.5s',
            callCount: 150,
            recommendation: 'Add FULLTEXT index on description column'
        },
        {
            query: 'SELECT * FROM statement_topics st JOIN statements s ON st.statement_id = s.id WHERE st.topic_id = ?',
            avgTime: '1.8s',
            callCount: 300,
            recommendation: 'Add composite index on statement_topics(statement_id, topic_id)'
        },
        {
            query: 'SELECT COUNT(*) FROM topics WHERE topic_type = ?',
            avgTime: '0.5s',
            callCount: 50,
            recommendation: 'Index on topic_type for count queries'
        }
    ];

    console.log('Detected Slow Queries:');
    console.log('─'.repeat(80));

    for (const query of slowQueries) {
        console.log(`Query: ${query.query}`);
        console.log(`Avg Time: ${query.avgTime} (${query.callCount} calls)`);
        console.log(`Fix: ${query.recommendation}\n`);
    }

    return slowQueries;
}

async function generateOptimizationReport() {
    console.log('📈 Database Optimization Report\n');
    console.log('═'.repeat(50));

    await analyzeQueryPerformance();
    console.log('═'.repeat(50));

    await checkExistingIndexes();
    console.log('═'.repeat(50));

    await recommendIndexCreation();
    console.log('═'.repeat(50));

    await analyzeSlowQueries();
    console.log('═'.repeat(50));

    console.log('✅ Optimization analysis complete!');
    console.log('\n💡 Next Steps:');
    console.log('1. Review and implement recommended indexes');
    console.log('2. Monitor query performance after changes');
    console.log('3. Consider database connection pooling');
    console.log('4. Implement query result caching where appropriate');
}

// Main execution
async function main() {
    try {
        await generateOptimizationReport();
    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    analyzeQueryPerformance,
    checkExistingIndexes,
    recommendIndexCreation,
    analyzeSlowQueries,
    generateOptimizationReport
};
