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

  /**
   * Extract cross-references from text (e.g., [[Keter]], [[Mitzvos]])
   */
  private extractCrossReferences(text: string): string[] {
    const matches = text.match(/\[\[([^\]]+)\]\]/g) || [];
    return matches.map(m => m.replace(/\[\[|\]\]/g, ''));
  }

  /**
   * Convert Hebrew term to slug
   */
  private generateSlug(englishTerm: string): string {
    return englishTerm
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  /**
   * Parse a single entry block
   */
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

    // Parse sections
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

  /**
   * Extract transliteration from Hebrew text (simplified)
   */
  private extractTransliteration(hebrewTerm: string): string {
    // This is a simplified version - in production, use a proper Hebrew transliteration library
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

  /**
   * Determine category based on content location
   */
  private determineCategory(block: string): string {
    if (block.includes('General Concepts')) return 'General Concepts';
    if (block.includes('Avodah concepts')) return 'Avodah Concepts';
    if (block.includes('Haskalah Concepts')) return 'Haskalah Concepts';
    return 'Uncategorized';
  }

  /**
   * Parse all entries from content
   */
  public parseAll(): ParsedEntry[] {
    // Split by "Entry:" pattern
    const entryBlocks = this.content.split(/(?=Entry:)/);

    for (const block of entryBlocks) {
      const entry = this.parseEntryBlock(block);
      if (entry) {
        this.entries.push(entry);
      }
    }

    return this.entries;
  }

  /**
   * Get sample entries (first N)
   */
  public getSampleEntries(count: number = 5): ParsedEntry[] {
    return this.entries.slice(0, count);
  }

  /**
   * Convert parsed entry to Directus topic format
   */
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

  /**
   * Format overview section with Mashal and Personal Nimshal
   */
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

/**
 * Main execution
 */
async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const v1Path = path.join(__dirname, '../data/v1.md');
  const parser = new V1DictionaryParser(v1Path);

  console.log('📖 Parsing v1.md dictionary...');
  const allEntries = parser.parseAll();
  console.log(`✅ Found ${allEntries.length} entries`);

  const sampleEntries = parser.getSampleEntries(5);
  console.log(`\n📋 Sample entries (first 5):`);

  const directusTopics = sampleEntries.map(entry => {
    const topic = parser.convertToDirectusTopic(entry);
    console.log(`\n  • ${entry.englishTerm} (${entry.hebrewTerm})`);
    console.log(`    Slug: ${topic.slug}`);
    console.log(`    Cross-refs: ${topic.metadata.crossReferences.join(', ') || 'none'}`);
    return topic;
  });

  // Output sample for inspection
  const outputPath = path.join(__dirname, '../data/v1-sample-ingestion.json');
  fs.writeFileSync(outputPath, JSON.stringify(directusTopics, null, 2));
  console.log(`\n💾 Sample output saved to: ${outputPath}`);

  return directusTopics;
}

main().catch(console.error);
