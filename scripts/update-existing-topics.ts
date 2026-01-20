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

  public getEntryBySlug(slug: string): ParsedEntry | undefined {
    return this.entries.find(entry => this.generateSlug(entry.englishTerm) === slug);
  }
}

async function updateExistingTopics() {
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

  // Fetch all existing topics
  console.log('🔍 Fetching existing topics from Directus...');
  const response = await fetch(`${directusUrl}/items/topics?limit=-1&fields=id,slug,canonical_title`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch topics: ${await response.text()}`);
  }

  const { data: topics } = await response.json();
  console.log(`✅ Found ${topics.length} existing topics\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const topic of topics) {
    const entry = parser.getEntryBySlug(topic.slug);
    
    if (!entry) {
      console.log(`⚠️  No v1.md entry found for slug: ${topic.slug}`);
      skippedCount++;
      continue;
    }

    const updatePayload = {
      name_hebrew: entry.hebrewTerm,
      mashal: entry.mashal.join('\n\n'),
      global_nimshal: entry.globalNimshal.join('\n\n'),
    };

    console.log(`[${updatedCount + skippedCount + 1}/${topics.length}] Updating topic: ${topic.canonical_title}...`);

    try {
      const updateResponse = await fetch(`${directusUrl}/items/topics/${topic.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.log(`❌ Failed to update topic ${topic.canonical_title}: ${JSON.stringify(error)}`);
        skippedCount++;
      } else {
        console.log(`✅ Updated topic: ${topic.canonical_title}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating topic ${topic.canonical_title}:`, error);
      skippedCount++;
    }
  }

  console.log('\n📊 Update Summary:');
  console.log(`   Topics updated: ${updatedCount}`);
  console.log(`   Topics skipped: ${skippedCount}`);
  console.log(`   Total topics: ${topics.length}`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  updateExistingTopics()
    .then(() => {
      console.log('\n✨ Update complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}

export { updateExistingTopics };
