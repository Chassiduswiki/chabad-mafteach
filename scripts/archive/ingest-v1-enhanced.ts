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

interface DirectusDocument {
  title: string;
  doc_type: 'entry' | 'sefer';
  original_lang: 'he' | 'en';
  status: 'draft' | 'reviewed' | 'published' | 'archived';
  source_format: 'pdf' | 'html' | 'docx' | 'manual_entry';
  category: string[];
  metadata: Record<string, any>;
  topic: number;
}

interface DirectusContentBlock {
  document_id: number;
  block_type: 'heading' | 'subheading' | 'paragraph' | 'section break';
  order_key: string;
  content: string;
  metadata: Record<string, any>;
  order_position: number;
}

interface DirectusStatement {
  order_key: string;
  original_lang: 'he' | 'en';
  text: string;
  status: 'draft' | 'reviewed' | 'published';
  importance_score: number;
  metadata: Record<string, any>;
  block_id: number;
}

interface DirectusSource {
  title: string;
  original_lang: 'he' | 'en';
  is_external: boolean;
  external_system?: 'sefaria' | 'wikisource' | 'hebrewbooks';
  external_id?: string;
  external_url?: string;
  metadata: Record<string, any>;
  author_id?: number;
}

interface DirectusSourceLink {
  relationship_type: 'quotes' | 'references' | 'paraphrases' | 'supports' | 'discusses';
  confidence_level: 'low' | 'medium' | 'high' | 'verified';
  notes: string;
  statement_id: number;
  source_id: number;
}

interface DirectusStatementTopic {
  statement_id: number;
  topic_id: number;
  relevance_score: number;
  is_primary: boolean;
}

class EnhancedV1Parser {
  private content: string;
  private entries: ParsedEntry[] = [];
  private existingAuthors: Map<string, number> = new Map();

  constructor(filePath: string) {
    this.content = fs.readFileSync(filePath, 'utf-8');
    // Pre-populate known authors
    this.existingAuthors.set('alter rebbe', 2);
    this.existingAuthors.set('mittler rebbe', 3);
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

  /**
   * Format brief description (first definition only)
   */
  public formatDescription(entry: ParsedEntry): string {
    if (entry.definition.length === 0) return '';
    // Take only the first definition point
    const firstDef = entry.definition[0];
    return firstDef.split('\n')[0].trim();
  }

  /**
   * Format practical takeaways (Personal Nimshal + Mashal)
   */
  public formatPracticalTakeaways(entry: ParsedEntry): string {
    const sections: string[] = [];

    if (entry.mashal.length > 0) {
      sections.push(`<h3>Mashal (Parable)</h3>`);
      entry.mashal.forEach(m => {
        sections.push(`<p>${m}</p>`);
      });
    }

    if (entry.personalNimshal.length > 0) {
      sections.push(`<h3>Personal Application</h3>`);
      entry.personalNimshal.forEach(p => {
        sections.push(`<p>${p}</p>`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Format historical context (Global Nimshal)
   */
  public formatHistoricalContext(entry: ParsedEntry): string {
    if (entry.globalNimshal.length === 0) return '';
    const sections: string[] = [];
    sections.push(`<h3>Global Meaning</h3>`);
    entry.globalNimshal.forEach(g => {
      sections.push(`<p>${g}</p>`);
    });
    return sections.join('\n');
  }

  /**
   * Hybrid statement extraction: auto-extract sentences + manual importance scoring
   */
  public extractStatements(entry: ParsedEntry): Array<{ text: string; importance_score: number; section: string }> {
    const statements: Array<{ text: string; importance_score: number; section: string }> = [];

    // Definition statements (highest importance)
    entry.definition.forEach(def => {
      const sentences = this.splitSentences(def);
      sentences.forEach((sentence, idx) => {
        statements.push({
          text: sentence,
          importance_score: idx === 0 ? 0.95 : 0.85, // First sentence is core definition
          section: 'definition',
        });
      });
    });

    // Mashal statements (medium-high importance)
    entry.mashal.forEach(mashal => {
      const sentences = this.splitSentences(mashal);
      sentences.forEach((sentence, idx) => {
        statements.push({
          text: sentence,
          importance_score: 0.70,
          section: 'mashal',
        });
      });
    });

    // Personal Nimshal statements (medium importance)
    entry.personalNimshal.forEach(nimshal => {
      const sentences = this.splitSentences(nimshal);
      sentences.forEach((sentence, idx) => {
        statements.push({
          text: sentence,
          importance_score: idx === 0 ? 0.75 : 0.65, // First is most important
          section: 'personal_nimshal',
        });
      });
    });

    // Global Nimshal statements (medium importance)
    entry.globalNimshal.forEach(nimshal => {
      const sentences = this.splitSentences(nimshal);
      sentences.forEach((sentence, idx) => {
        statements.push({
          text: sentence,
          importance_score: idx === 0 ? 0.70 : 0.60,
          section: 'global_nimshal',
        });
      });
    });

    return statements;
  }

  /**
   * Split text into sentences (simple heuristic)
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10)
      .map(s => s.trim());
  }

  /**
   * Hybrid source extraction: parse citations and attempt to identify known sources
   */
  public extractSources(entry: ParsedEntry): Array<{ title: string; authorName?: string; isKnown: boolean }> {
    const sources: Array<{ title: string; authorName?: string; isKnown: boolean }> = [];

    entry.sources.forEach(sourceText => {
      // Simple parsing: split by comma
      const citations = sourceText.split(',').map(s => s.trim());

      citations.forEach(citation => {
        if (citation.length > 0) {
          // Check if it's a known author
          const lowerCitation = citation.toLowerCase();
          let authorName: string | undefined;

          if (lowerCitation.includes('alter rebbe') || lowerCitation.includes('tanya')) {
            authorName = 'Alter Rebbe';
          } else if (lowerCitation.includes('mittler rebbe')) {
            authorName = 'Mittler Rebbe';
          }

          sources.push({
            title: citation,
            authorName,
            isKnown: !!authorName,
          });
        }
      });
    });

    return sources;
  }

  /**
   * Calculate topic relevance based on statement centrality
   */
  calculateTopicRelevance(statement: { text: string; importance_score: number; section: string }): number {
    // Relevance = how central is this statement to the topic definition
    // Definition statements are most central
    const sectionWeights: Record<string, number> = {
      definition: 0.95,
      personal_nimshal: 0.75,
      global_nimshal: 0.70,
      mashal: 0.60,
    };

    const baseWeight = sectionWeights[statement.section] || 0.50;
    return Math.min(1.0, baseWeight * statement.importance_score);
  }
}

class EnhancedDirectusIngestionClient {
  private directusUrl: string;
  private accessToken: string;
  private topicIdMap: Map<string, number> = new Map();
  private documentIdMap: Map<string, number> = new Map();
  private paragraphIdMap: Map<string, number> = new Map();
  private statementIdMap: Map<string, number> = new Map();
  private sourceIdMap: Map<string, number> = new Map();

  constructor(directusUrl: string, accessToken: string) {
    this.directusUrl = directusUrl;
    this.accessToken = accessToken;
  }

  calculateTopicRelevance(statement: { text: string; importance_score: number; section: string }): number {
    // Relevance = how central is this statement to the topic definition
    // Definition statements are most central
    const sectionWeights: Record<string, number> = {
      definition: 0.95,
      personal_nimshal: 0.75,
      global_nimshal: 0.70,
      mashal: 0.60,
    };

    const baseWeight = sectionWeights[statement.section] || 0.50;
    return Math.min(1.0, baseWeight * statement.importance_score);
  }

  async createDocument(doc: DirectusDocument): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doc),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create document: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async createContentBlock(block: DirectusContentBlock): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/content_blocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(block),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create content block: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async createStatement(stmt: DirectusStatement): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/statements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stmt),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create statement: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async createSource(source: DirectusSource): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(source),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create source: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async createStatementTopic(st: DirectusStatementTopic): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/statement_topics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(st),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create statement_topic: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  async createSourceLink(sl: DirectusSourceLink): Promise<number> {
    const response = await fetch(`${this.directusUrl}/items/source_links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sl),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create source_link: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  setTopicId(slug: string, id: number): void {
    this.topicIdMap.set(slug, id);
  }

  getTopicId(slug: string): number | undefined {
    return this.topicIdMap.get(slug);
  }

  getAllMaps() {
    return {
      topics: this.topicIdMap,
      documents: this.documentIdMap,
      paragraphs: this.paragraphIdMap,
      statements: this.statementIdMap,
      sources: this.sourceIdMap,
    };
  }
}

async function ingestEnhanced() {
  const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
  const accessToken = process.env.DIRECTUS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('DIRECTUS_ACCESS_TOKEN environment variable is required');
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const v1Path = path.join(__dirname, '../data/v1.md');

  const parser = new EnhancedV1Parser(v1Path);
  const client = new EnhancedDirectusIngestionClient(directusUrl, accessToken);

  console.log('📖 Parsing v1.md dictionary...');
  const allEntries = parser.parseAll();
  console.log(`✅ Found ${allEntries.length} entries\n`);

  // Pre-populate topic IDs from existing topics (IDs 9-27)
  const topicIds = [9, 10, 11, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 27];
  allEntries.forEach((entry, idx) => {
    if (idx < topicIds.length) {
      client.setTopicId(parser['generateSlug'](entry.englishTerm), topicIds[idx]);
    }
  });

  console.log('🚀 Starting enhanced ingestion (documents, paragraphs, statements, sources)\n');

  let totalDocuments = 0;
  let totalParagraphs = 0;
  let totalStatements = 0;
  let totalSources = 0;
  let totalStatementTopics = 0;
  let totalSourceLinks = 0;

  for (let i = 0; i < Math.min(allEntries.length, 3); i++) {
    const entry = allEntries[i];
    const topicId = client.getTopicId(parser['generateSlug'](entry.englishTerm));

    if (!topicId) {
      console.log(`⚠️  Skipping ${entry.englishTerm} - topic ID not found`);
      continue;
    }

    console.log(`\n📝 Processing: ${entry.englishTerm} (Topic ID: ${topicId})`);

    // 1. Update Topic with properly formatted fields
    try {
      const topicUpdate = {
        description: parser.formatDescription(entry),
        practical_takeaways: parser.formatPracticalTakeaways(entry),
        historical_context: parser.formatHistoricalContext(entry),
        content_status: 'partial',
      };

      // Update topic via API
      const topicResponse = await fetch(`${directusUrl}/items/topics/${topicId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicUpdate),
      });

      if (!topicResponse.ok) {
        const error = await topicResponse.json();
        console.error(`  ⚠️  Could not update topic fields:`, error);
      } else {
        console.log(`  ✅ Topic fields updated (description, practical_takeaways, historical_context)`);
      }
    } catch (error) {
      console.error(`  ⚠️  Error updating topic:`, error);
    }

    // 2. Create Document
    try {
      const doc: DirectusDocument = {
        title: `${entry.englishTerm} (${entry.hebrewTerm}) - Dictionary Entry`,
        doc_type: 'entry',
        original_lang: 'he',
        status: 'published',
        source_format: 'manual_entry',
        category: ['chassidus'],
        metadata: {
          source: 'v1.md',
          hebrew_term: entry.hebrewTerm,
          transliteration: entry.transliteration,
          entry_category: entry.category,
        },
        topic: topicId,
      };

      const docId = await client.createDocument(doc);
      console.log(`  ✅ Document created (ID: ${docId})`);
      totalDocuments++;

      // 2. Create Content Blocks
      const blocks: Array<{ id: number; section: string }> = [];

      const sections = [
        { key: 'definition', label: 'Definition', data: entry.definition },
        { key: 'mashal', label: 'Mashal', data: entry.mashal },
        { key: 'personalNimshal', label: 'Personal Nimshal', data: entry.personalNimshal },
        { key: 'globalNimshal', label: 'Global Nimshal', data: entry.globalNimshal },
        { key: 'sources', label: 'Sources', data: entry.sources },
      ];

      for (let blockIdx = 0; blockIdx < sections.length; blockIdx++) {
        const section = sections[blockIdx];
        if (section.data.length > 0) {
          const block: DirectusContentBlock = {
            document_id: docId,
            block_type: blockIdx === 0 ? 'heading' : 'paragraph',
            order_key: `${i + 1}_${section.key}`,
            content: section.data.join('\n'),
            metadata: { section: section.key, label: section.label },
            order_position: blockIdx,
          };

          const blockId = await client.createContentBlock(block);
          blocks.push({ id: blockId, section: section.key });
          totalParagraphs++;
        }
      }

      console.log(`  ✅ ${blocks.length} content blocks created`);

      // 3. Extract and create Statements
      const statements = parser.extractStatements(entry);
      const statementIds: Array<{ id: number; statement: typeof statements[0] }> = [];

      for (let sIdx = 0; sIdx < statements.length; sIdx++) {
        const stmt = statements[sIdx];
        const block = blocks.find((b: any) => b.section === stmt.section);

        if (block) {
          const statement: DirectusStatement = {
            order_key: `${i + 1}_${stmt.section}_${sIdx + 1}`,
            original_lang: 'en',
            text: stmt.text,
            status: 'published',
            importance_score: stmt.importance_score,
            metadata: { section: stmt.section },
            block_id: block.id,
          };

          const stmtId = await client.createStatement(statement);
          statementIds.push({ id: stmtId, statement: stmt });
          totalStatements++;
        }
      }

      console.log(`  ✅ ${statementIds.length} statements created`);

      // 4. Extract and create Sources
      const sources = parser.extractSources(entry);
      const sourceIds: Array<{ id: number; title: string }> = [];

      for (const source of sources) {
        const directusSource: DirectusSource = {
          title: source.title,
          original_lang: 'he',
          is_external: false,
          metadata: { from_entry: entry.englishTerm },
        };

        const sourceId = await client.createSource(directusSource);
        sourceIds.push({ id: sourceId, title: source.title });
        totalSources++;
      }

      console.log(`  ✅ ${sourceIds.length} sources created`);

      // 5. Create statement_topics (link statements to topic with relevance)
      for (const { id: stmtId, statement } of statementIds) {
        const relevance = client.calculateTopicRelevance(statement);
        const st: DirectusStatementTopic = {
          statement_id: stmtId,
          topic_id: topicId,
          relevance_score: relevance,
          is_primary: statement.importance_score > 0.85,
        };

        await client.createStatementTopic(st);
        totalStatementTopics++;
      }

      console.log(`  ✅ ${statementIds.length} statement_topics created`);

      // 6. Create source_links (link sources to statements)
      if (sourceIds.length > 0 && statementIds.length > 0) {
        // Link first statement to first source as example
        const sl: DirectusSourceLink = {
          relationship_type: 'references',
          confidence_level: 'medium',
          notes: `Source cited in ${entry.englishTerm} entry`,
          statement_id: statementIds[0].id,
          source_id: sourceIds[0].id,
        };

        await client.createSourceLink(sl);
        totalSourceLinks++;
      }

      console.log(`  ✅ Source links created`);
    } catch (error) {
      console.error(`  ❌ Error processing ${entry.englishTerm}:`, error);
    }
  }

  console.log(`\n📊 Enhanced Ingestion Summary:`);
  console.log(`   Documents created: ${totalDocuments}`);
  console.log(`   Paragraphs created: ${totalParagraphs}`);
  console.log(`   Statements created: ${totalStatements}`);
  console.log(`   Sources created: ${totalSources}`);
  console.log(`   Statement-Topic links: ${totalStatementTopics}`);
  console.log(`   Source-Statement links: ${totalSourceLinks}`);

  return {
    documents: totalDocuments,
    paragraphs: totalParagraphs,
    statements: totalStatements,
    sources: totalSources,
    statementTopics: totalStatementTopics,
    sourceLinks: totalSourceLinks,
  };
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  ingestEnhanced()
    .then(result => {
      console.log('\n✨ Enhanced ingestion complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Ingestion failed:', error);
      process.exit(1);
    });
}

export { ingestEnhanced, EnhancedV1Parser };
