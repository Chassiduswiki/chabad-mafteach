import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Demo script showing the complete v1.md ingestion workflow
 * This demonstrates parsing, conversion, and API integration without requiring Directus
 */

interface DirectusTopic {
  canonical_title: string;
  canonical_title_transliteration: string;
  canonical_title_en: string;
  slug: string;
  description: string;
  overview: string;
  historical_context: string;
  practical_takeaways: string;
  topic_type: string;
  metadata: Record<string, any>;
}

class IngestionDemo {
  /**
   * Display parsed entry in readable format
   */
  static displayTopic(topic: DirectusTopic, index: number): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📖 Entry ${index + 1}: ${topic.canonical_title}`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\n📌 Metadata:`);
    console.log(`   Title (EN): ${topic.canonical_title_en}`);
    console.log(`   Transliteration: ${topic.canonical_title_transliteration}`);
    console.log(`   Slug: ${topic.slug}`);
    console.log(`   Type: ${topic.topic_type}`);
    console.log(`   Category: ${topic.metadata.category}`);

    console.log(`\n📝 Description:`);
    console.log(`   ${topic.description.substring(0, 150)}...`);

    console.log(`\n🔗 Cross-References:`);
    if (topic.metadata.crossReferences.length > 0) {
      topic.metadata.crossReferences.forEach((ref: string) => {
        console.log(`   • ${ref}`);
      });
    } else {
      console.log(`   (none)`);
    }

    console.log(`\n📚 Content Sections:`);
    console.log(`   Overview: ${topic.overview.length} chars`);
    console.log(`   Historical Context: ${topic.historical_context.length} chars`);
    console.log(`   Practical Takeaways: ${topic.practical_takeaways.length} chars`);
  }

  /**
   * Generate relationship map visualization
   */
  static displayRelationshipMap(topics: DirectusTopic[]): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔗 Relationship Map`);
    console.log(`${'='.repeat(80)}\n`);

    const relationshipCount: Record<string, number> = {};
    const allReferences: Set<string> = new Set();

    topics.forEach(topic => {
      const refs = topic.metadata.crossReferences || [];
      relationshipCount[topic.slug] = refs.length;

      refs.forEach((ref: string) => {
        allReferences.add(ref.toLowerCase().replace(/\s+/g, '-'));
      });
    });

    console.log(`Topics in sample: ${topics.length}`);
    console.log(`Total cross-references: ${Object.values(relationshipCount).reduce((a, b) => a + b, 0)}`);
    console.log(`Unique referenced topics: ${allReferences.size}\n`);

    console.log(`Reference distribution:`);
    Object.entries(relationshipCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([slug, count]) => {
        const bar = '█'.repeat(count);
        console.log(`   ${slug.padEnd(20)} ${bar} (${count})`);
      });
  }

  /**
   * Generate ingestion statistics
   */
  static displayStatistics(topics: DirectusTopic[]): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 Ingestion Statistics`);
    console.log(`${'='.repeat(80)}\n`);

    const stats = {
      totalTopics: topics.length,
      totalCrossReferences: topics.reduce(
        (sum, t) => sum + (t.metadata.crossReferences?.length || 0),
        0
      ),
      avgDescriptionLength: Math.round(
        topics.reduce((sum, t) => sum + t.description.length, 0) / topics.length
      ),
      avgOverviewLength: Math.round(
        topics.reduce((sum, t) => sum + t.overview.length, 0) / topics.length
      ),
      categories: new Set(topics.map(t => t.metadata.category)).size,
    };

    console.log(`Topics to ingest: ${stats.totalTopics}`);
    console.log(`Total cross-references: ${stats.totalCrossReferences}`);
    console.log(`Avg description length: ${stats.avgDescriptionLength} chars`);
    console.log(`Avg overview length: ${stats.avgOverviewLength} chars`);
    console.log(`Categories: ${stats.categories}`);

    console.log(`\n📋 Directus Operations:`);
    console.log(`   POST /items/topics (${stats.totalTopics} requests)`);
    console.log(`   POST /items/topic_relationships (~${stats.totalCrossReferences} requests)`);
    console.log(`   Total API calls: ~${stats.totalTopics + stats.totalCrossReferences}`);
  }

  /**
   * Generate sample Directus API payloads
   */
  static displayApiPayloads(topics: DirectusTopic[]): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔌 Sample Directus API Payloads`);
    console.log(`${'='.repeat(80)}\n`);

    if (topics.length > 0) {
      const topic = topics[0];

      console.log(`POST /items/topics`);
      console.log(`${JSON.stringify(
        {
          canonical_title: topic.canonical_title,
          canonical_title_transliteration: topic.canonical_title_transliteration,
          canonical_title_en: topic.canonical_title_en,
          slug: topic.slug,
          description: topic.description.substring(0, 50) + '...',
          overview: topic.overview.substring(0, 50) + '...',
          historical_context: topic.historical_context.substring(0, 50) + '...',
          practical_takeaways: topic.practical_takeaways.substring(0, 50) + '...',
          topic_type: topic.topic_type,
          content_status: 'partial',
          badge_color: 'blue',
          metadata: topic.metadata,
        },
        null,
        2
      )}\n`);

      if (topic.metadata.crossReferences.length > 0) {
        console.log(`POST /items/topic_relationships`);
        console.log(`${JSON.stringify(
          {
            parent_topic_id: 42,
            child_topic_id: 43,
            relation_type: 'related_to',
            strength: 0.7,
            display_order: 0,
            description: 'Cross-reference from v1.md',
          },
          null,
          2
        )}\n`);
      }
    }
  }

  /**
   * Run complete demo
   */
  static async runDemo(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const samplePath = path.join(__dirname, '../data/v1-sample-ingestion.json');

    if (!fs.existsSync(samplePath)) {
      console.error(`\n❌ Sample file not found: ${samplePath}`);
      console.error(`\nRun first: npx ts-node scripts/ingest-v1-dictionary.ts\n`);
      process.exit(1);
    }

    const topics: DirectusTopic[] = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 v1.md Dictionary Ingestion Demo`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\nLoaded ${topics.length} sample entries from v1-sample-ingestion.json\n`);

    // Display each topic
    topics.forEach((topic, index) => {
      this.displayTopic(topic, index);
    });

    // Display relationship map
    this.displayRelationshipMap(topics);

    // Display statistics
    this.displayStatistics(topics);

    // Display API payloads
    this.displayApiPayloads(topics);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✨ Demo Complete`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Set environment variables:`);
    console.log(`     export DIRECTUS_URL="http://localhost:8055"`);
    console.log(`     export DIRECTUS_ACCESS_TOKEN="your_token"`);
    console.log(`  2. Run ingestion:`);
    console.log(`     npx ts-node scripts/ingest-to-directus.ts`);
    console.log(`  3. Verify in Directus UI`);
    console.log(`\n`);
  }
}

// Execute if run directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  IngestionDemo.runDemo().catch(console.error);
}

export { IngestionDemo };
