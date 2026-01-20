import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface ParsedEntry {
  hebrewTerm: string;
  englishTerm: string;
  transliteration: string;
  definition: string[];
  mashal: string[];
  personalNimshal: string[];
  globalNimshal: string[];
  sources: string[];
  category: string;
  crossReferences: string[];
}

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
  metadata: {
    category: string;
    sources: string[];
    crossReferences: string[];
    originalEntry: ParsedEntry;
  };
}

class V1DictionaryParser {
  private content: string;
  private entries: ParsedEntry[] = [];

  constructor(filePath: string) {
    this.content = fs.readFileSync(filePath, 'utf-8');
  }

  private extractCrossReferences(text: string): string[] {
    const matches = text.match(/\[\[([^\]]+)\]\]/g) || [];
    return matches.map(m => m.replace(/\[\[|\]\]/g, ''));
  }

  private generateSlug(englishTerm: string): string {
    return englishTerm
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  private parseEntryBlock(block: string): ParsedEntry | null {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 3) return null;

    const entryLine = lines[0];
    const entryMatch = entryLine.match(/Entry:\s*([^,]+),\s*(.+)/);
    if (!entryMatch) return null;

    const hebrewTerm = entryMatch[1].trim();
    const englishTerm = entryMatch[2].trim();

    const entry: ParsedEntry = {
      hebrewTerm,
      englishTerm,
      transliteration: this.extractTransliteration(hebrewTerm),
      definition: [],
      mashal: [],
      personalNimshal: [],
      globalNimshal: [],
      sources: [],
      category: this.determineCategory(block),
      crossReferences: this.extractCrossReferences(block),
    };

    let currentSection: keyof ParsedEntry | '' = '';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('Definition:')) {
        currentSection = 'definition';
      } else if (line.startsWith('Mashal:')) {
        currentSection = 'mashal';
      } else if (line.startsWith('Personal Nimshal:')) {
        currentSection = 'personalNimshal';
      } else if (line.startsWith('Global Nimshal:')) {
        currentSection = 'globalNimshal';
      } else if (line.startsWith('Sources:')) {
        currentSection = 'sources';
      } else if (currentSection && line.trim()) {
        const section = entry[currentSection];
        if (Array.isArray(section)) {
          section.push(line.trim());
        }
      }
    }

    return entry;
  }

  private extractTransliteration(hebrewTerm: string): string {
    const hebrewToTranslit: Record<string, string> = {
      'א': 'A', 'ב': 'B', 'ג': 'G', 'ד': 'D', 'ה': 'H', 'ו': 'V', 'ז': 'Z',
      'ח': 'Ch', 'ט': 'T', 'י': 'Y', 'כ': 'K', 'ל': 'L', 'מ': 'M', 'נ': 'N',
      'ס': 'S', 'ע': 'A', 'פ': 'P', 'צ': 'Tz', 'ק': 'K', 'ר': 'R', 'ש': 'Sh',
      'ת': 'T',
    };
    return hebrewTerm
      .split('')
      .map(char => hebrewToTranslit[char] || char)
      .join('');
  }

  private determineCategory(block: string): string {
    if (block.includes('General Concepts')) return 'General Concepts';
    if (block.includes('Avodah concepts')) return 'Avodah Concepts';
    if (block.includes('Haskalah Concepts')) return 'Haskalah Concepts';
    return 'Uncategorized';
  }

  public parseAll(): ParsedEntry[] {
    const entryBlocks = this.content.split(/(?=Entry:)/);

    for (const block of entryBlocks) {
      const entry = this.parseEntryBlock(block);
      if (entry) {
        this.entries.push(entry);
      }
    }

    return this.entries;
  }

  public convertToDirectusTopic(entry: ParsedEntry): DirectusTopic {
    const slug = this.generateSlug(entry.englishTerm);

    return {
      canonical_title: entry.englishTerm,
      canonical_title_transliteration: entry.transliteration,
      canonical_title_en: entry.englishTerm,
      slug,
      description: entry.definition.join(' '),
      overview: this.formatOverview(entry),
      historical_context: entry.globalNimshal.join('\n\n'),
      practical_takeaways: entry.personalNimshal.join('\n\n'),
      topic_type: 'concept',
      metadata: {
        category: entry.category,
        sources: entry.sources,
        crossReferences: entry.crossReferences,
        originalEntry: entry,
      },
    };
  }

  private formatOverview(entry: ParsedEntry): string {
    const sections: string[] = [];

    if (entry.mashal.length > 0) {
      sections.push(`<h3>Mashal (Parable)</h3><p>${entry.mashal.join('</p><p>')}</p>`);
    }

    if (entry.personalNimshal.length > 0) {
      sections.push(`<h3>Personal Application</h3><p>${entry.personalNimshal.join('</p><p>')}</p>`);
    }

    return sections.join('\n');
  }
}

class DirectusIngestionClient {
  private directusUrl: string;
  private accessToken: string;
  private topicIdMap: Map<string, number> = new Map();

  constructor(directusUrl: string, accessToken: string) {
    this.directusUrl = directusUrl;
    this.accessToken = accessToken;
  }

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

  async createTopicsBatch(topics: DirectusTopic[]): Promise<number[]> {
    const ids: number[] = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        console.log(`[${i + 1}/${topics.length}] Creating topic: ${topic.canonical_title}...`);
        const id = await this.createTopic(topic);
        ids.push(id);
        console.log(`✅ Created topic ID: ${id}`);
      } catch (error) {
        console.error(`❌ Error creating topic ${topic.canonical_title}:`, error);
      }
    }

    return ids;
  }

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

  getAllTopicIds(): Map<string, number> {
    return this.topicIdMap;
  }
}

async function ingestFullDictionary() {
  const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
  const accessToken = process.env.DIRECTUS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('DIRECTUS_ACCESS_TOKEN environment variable is required');
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const v1Path = path.join(__dirname, '../data/v1.md');

  const parser = new V1DictionaryParser(v1Path);

  console.log('📖 Parsing v1.md dictionary...');
  const allEntries = parser.parseAll();
  console.log(`✅ Found ${allEntries.length} entries\n`);

  const directusTopics = allEntries.map(entry => parser.convertToDirectusTopic(entry));

  console.log(`\n🚀 Starting full ingestion of ${directusTopics.length} topics to Directus`);
  console.log(`📍 Directus URL: ${directusUrl}\n`);

  const client = new DirectusIngestionClient(directusUrl, accessToken);

  // Step 1: Create all topics
  console.log('📝 Step 1: Creating all topics...');
  const topicIds = await client.createTopicsBatch(directusTopics);
  console.log(`\n✅ Created ${topicIds.length} topics\n`);

  // Step 2: Create relationships
  console.log('🔗 Step 2: Creating relationships from cross-references...');
  const relationshipIds = await client.createRelationshipsFromCrossReferences(directusTopics);
  console.log(`✅ Created ${relationshipIds.length} relationships\n`);

  // Step 3: Summary
  console.log('📊 Full Ingestion Summary:');
  console.log(`   Total entries parsed: ${allEntries.length}`);
  console.log(`   Topics created: ${topicIds.length}`);
  console.log(`   Relationships created: ${relationshipIds.length}`);
  console.log(`\n   Created Topics:`);
  client.getAllTopicIds().forEach((id, slug) => {
    console.log(`     ${slug}: ${id}`);
  });

  return {
    entriesParsed: allEntries.length,
    topicIds,
    relationshipIds,
    topicMap: client.getAllTopicIds(),
  };
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  ingestFullDictionary()
    .then(result => {
      console.log('\n✨ Full ingestion complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ingestion failed:', error);
      process.exit(1);
    });
}

export { ingestFullDictionary };
