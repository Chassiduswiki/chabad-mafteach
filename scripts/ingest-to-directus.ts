import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

interface TopicRelationship {
  parent_topic_id: number;
  child_topic_id: number;
  relation_type: 'related_to' | 'subcategory' | 'instance_of';
  strength: number;
  display_order: number;
  description: string;
}

/**
 * Directus API client for batch ingestion
 */
class DirectusIngestionClient {
  private directusUrl: string;
  private accessToken: string;
  private topicIdMap: Map<string, number> = new Map();

  constructor(directusUrl: string, accessToken: string) {
    this.directusUrl = directusUrl;
    this.accessToken = accessToken;
  }

  /**
   * Create a single topic in Directus
   */
  async createTopic(topic: DirectusTopic): Promise<number> {
    const payload = {
      canonical_title: topic.canonical_title,
      canonical_title_transliteration: topic.canonical_title_transliteration,
      canonical_title_en: topic.canonical_title_en,
      slug: topic.slug,
      description: topic.description,
      overview: topic.overview,
      historical_context: topic.historical_context,
      practical_takeaways: topic.practical_takeaways,
      topic_type: topic.topic_type,
      metadata: topic.metadata,
      content_status: 'partial',
      badge_color: 'blue',
    };

    const response = await fetch(`${this.directusUrl}/items/topics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create topic: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const topicId = data.data.id;
    this.topicIdMap.set(topic.slug, topicId);
    return topicId;
  }

  /**
   * Create multiple topics in batch
   */
  async createTopicsBatch(topics: DirectusTopic[]): Promise<number[]> {
    const ids: number[] = [];

    for (const topic of topics) {
      try {
        console.log(`Creating topic: ${topic.canonical_title}...`);
        const id = await this.createTopic(topic);
        ids.push(id);
        console.log(`✅ Created topic ID: ${id}`);
      } catch (error) {
        console.error(`❌ Error creating topic ${topic.canonical_title}:`, error);
      }
    }

    return ids;
  }

  /**
   * Create a relationship between two topics
   */
  async createRelationship(
    parentSlug: string,
    childSlug: string,
    relationType: 'related_to' | 'subcategory' | 'instance_of' = 'related_to',
    strength: number = 0.5
  ): Promise<number> {
    const parentId = this.topicIdMap.get(parentSlug);
    const childId = this.topicIdMap.get(childSlug);

    if (!parentId || !childId) {
      throw new Error(
        `Cannot create relationship: parent=${parentSlug}(${parentId}) or child=${childSlug}(${childId}) not found`
      );
    }

    const payload = {
      parent_topic_id: parentId,
      child_topic_id: childId,
      relation_type: relationType,
      strength,
      display_order: 0,
      description: `${relationType} relationship`,
    };

    const response = await fetch(`${this.directusUrl}/items/topic_relationships`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create relationship: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  /**
   * Create relationships from cross-references
   */
  async createRelationshipsFromCrossReferences(
    topics: DirectusTopic[]
  ): Promise<number[]> {
    const relationshipIds: number[] = [];

    for (const topic of topics) {
      const crossRefs = topic.metadata.crossReferences || [];

      for (const ref of crossRefs) {
        const refSlug = ref.toLowerCase().replace(/\s+/g, '-');

        if (this.topicIdMap.has(refSlug)) {
          try {
            console.log(`Creating relationship: ${topic.slug} -> ${refSlug}`);
            const id = await this.createRelationship(
              topic.slug,
              refSlug,
              'related_to',
              0.7
            );
            relationshipIds.push(id);
            console.log(`✅ Created relationship ID: ${id}`);
          } catch (error) {
            console.error(`⚠️  Could not create relationship:`, error);
          }
        }
      }
    }

    return relationshipIds;
  }

  /**
   * Get topic ID by slug
   */
  getTopicId(slug: string): number | undefined {
    return this.topicIdMap.get(slug);
  }

  /**
   * Get all created topic IDs
   */
  getAllTopicIds(): Map<string, number> {
    return this.topicIdMap;
  }
}

/**
 * Main ingestion workflow
 */
async function ingestSampleEntries() {
  const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
  const accessToken = process.env.DIRECTUS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('DIRECTUS_ACCESS_TOKEN environment variable is required');
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const samplePath = path.join(__dirname, '../data/v1-sample-ingestion.json');

  if (!fs.existsSync(samplePath)) {
    throw new Error(
      `Sample ingestion file not found: ${samplePath}\nRun: npx ts-node scripts/ingest-v1-dictionary.ts`
    );
  }

  const topics: DirectusTopic[] = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));

  console.log(`\n🚀 Starting ingestion of ${topics.length} sample topics to Directus`);
  console.log(`📍 Directus URL: ${directusUrl}\n`);

  const client = new DirectusIngestionClient(directusUrl, accessToken);

  // Step 1: Create all topics
  console.log('📝 Step 1: Creating topics...');
  const topicIds = await client.createTopicsBatch(topics);
  console.log(`✅ Created ${topicIds.length} topics\n`);

  // Step 2: Create relationships
  console.log('🔗 Step 2: Creating relationships from cross-references...');
  const relationshipIds = await client.createRelationshipsFromCrossReferences(topics);
  console.log(`✅ Created ${relationshipIds.length} relationships\n`);

  // Step 3: Summary
  console.log('📊 Ingestion Summary:');
  console.log(`   Topics created: ${topicIds.length}`);
  console.log(`   Relationships created: ${relationshipIds.length}`);
  console.log(`\n   Topic ID Map:`);
  client.getAllTopicIds().forEach((id, slug) => {
    console.log(`     ${slug}: ${id}`);
  });

  return {
    topicIds,
    relationshipIds,
    topicMap: client.getAllTopicIds(),
  };
}

// Execute if run directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  ingestSampleEntries()
    .then(result => {
      console.log('\n✨ Ingestion complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ingestion failed:', error);
      process.exit(1);
    });
}

export { DirectusIngestionClient, ingestSampleEntries };
