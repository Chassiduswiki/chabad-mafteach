import { createDirectus, rest, createItems, readItems } from '@directus/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directus client setup
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ACCESS_TOKEN || '';

const client = createDirectus(DIRECTUS_URL).with(rest());

interface ParsedEntry {
  canonical_title: string;
  canonical_title_en: string;
  canonical_title_transliteration: string;
  hebrew_term: string;
  slug: string;
  topic_type: string;
  description: string;
  description_en: string;
  overview: string;
  practical_takeaways: string;
  historical_context: string;
  content_status: string;
  status_label: string;
  badge_color: string;
  original_lang: string;
  metadata: {
    category: string;
    sources: string[];
    entry_source: string;
    section_order: string[];
  };
  sections: {
    definition?: string;
    mashal?: string;
    personal_nimshal?: string;
    global_nimshal?: string;
    sources?: string;
  };
}

interface ChassidusRelationship {
  parent: string;
  child: string;
  type: 'subcategory' | 'instance_of' | 'related_to';
  strength: number;
  description: string;
}

// Chassidus-based relationship mappings
const CHASSIDUS_RELATIONSHIPS: ChassidusRelationship[] = [
  // The Three Branches
  { parent: 'Avodah', child: 'Haskalah', type: 'related_to', strength: 0.9, description: 'Complementary branches of Chassidus' },
  { parent: 'Avodah', child: 'Havanah', type: 'related_to', strength: 0.9, description: 'Complementary branches of Chassidus' },
  { parent: 'Haskalah', child: 'Havanah', type: 'related_to', strength: 0.9, description: 'Complementary branches of Chassidus' },
  { parent: 'Hisbonenus', child: 'Avodah', type: 'related_to', strength: 0.95, description: 'Hisbonenus is the foundation of Avodah' },
  { parent: 'Hisbonenus', child: 'Haskalah', type: 'related_to', strength: 0.95, description: 'Hisbonenus is the foundation of Haskalah' },
  
  // Soul Hierarchy (Nefesh → Ruach → Neshamah → Chayah → Yechidah)
  { parent: 'Nefesh', child: 'Ruach', type: 'subcategory', strength: 0.95, description: 'Five levels of the soul (NeRaN ChaY)' },
  { parent: 'Ruach', child: 'Neshamah', type: 'subcategory', strength: 0.95, description: 'Five levels of the soul (NeRaN ChaY)' },
  { parent: 'Neshamah', child: 'Chayah', type: 'subcategory', strength: 0.95, description: 'Five levels of the soul (NeRaN ChaY)' },
  { parent: 'Chayah', child: 'Yechidah', type: 'subcategory', strength: 0.95, description: 'Five levels of the soul (NeRaN ChaY)' },
  
  // Soul Types
  { parent: 'Nefesh', child: 'Nefesh HaBehamis', type: 'instance_of', strength: 0.9, description: 'Animal soul is a type of Nefesh' },
  { parent: 'Nefesh', child: 'Nefesh HaElokis', type: 'instance_of', strength: 0.9, description: 'G-dly soul is a type of Nefesh' },
  
  // Soul Anatomy
  { parent: 'Nefesh', child: 'Etzem HaNefesh', type: 'subcategory', strength: 0.85, description: 'Essence is the core of the soul' },
  { parent: 'Nefesh', child: 'Kochos HaNefesh', type: 'subcategory', strength: 0.85, description: 'Abilities express the soul' },
  { parent: 'Nefesh', child: 'Levushei HaNefesh', type: 'subcategory', strength: 0.85, description: 'Garments are external expression of soul' },
  
  // Avodah Concepts
  { parent: 'Avodah', child: 'Ahavas Hashem', type: 'instance_of', strength: 0.9, description: 'Love of G-d is a form of Avodah' },
  { parent: 'Avodah', child: 'Yiras Hashem', type: 'instance_of', strength: 0.9, description: 'Fear of G-d is a form of Avodah' },
  { parent: 'Avodah', child: 'Kabbalas Ol', type: 'instance_of', strength: 0.85, description: 'Accepting the yoke is foundational Avodah' },
  { parent: 'Avodah', child: 'Mesiras Nefesh', type: 'instance_of', strength: 0.95, description: 'Self-sacrifice is the highest Avodah' },
  
  // Motivation Types
  { parent: 'Ahavas Hashem', child: 'Pnimiyus', type: 'related_to', strength: 0.9, description: 'Love flows from inner motivation' },
  { parent: 'Yiras Hashem', child: 'Chitzoniyus', type: 'related_to', strength: 0.8, description: 'Fear can be external motivation' },
  { parent: 'Shtus', child: 'Taam Vadaas', type: 'related_to', strength: 0.85, description: 'Foolishness transcends logic' },
  
  // Haskalah Concepts - Seder Hishtalshelus
  { parent: 'Seder Hishtalshelus', child: 'Atzmus', type: 'subcategory', strength: 0.95, description: 'Essence is the source of creation' },
  { parent: 'Atzmus', child: 'Tzimtzum', type: 'subcategory', strength: 0.95, description: 'Contraction creates space for creation' },
  { parent: 'Tzimtzum', child: 'Reshimu', type: 'subcategory', strength: 0.9, description: 'Impression remains after contraction' },
  { parent: 'Tzimtzum', child: 'Kav', type: 'subcategory', strength: 0.9, description: 'Line of light enters after contraction' },
  { parent: 'Kav', child: 'Igulim', type: 'related_to', strength: 0.85, description: 'Circles and line are two modes of revelation' },
  { parent: 'Kav', child: 'Yosher', type: 'related_to', strength: 0.85, description: 'Straight sefiros follow the line' },
  { parent: 'Yosher', child: 'Adam Kadmon', type: 'subcategory', strength: 0.9, description: 'Original Man is first straight configuration' },
  
  // Four Worlds (ABY"A)
  { parent: 'Adam Kadmon', child: 'Atzilus', type: 'subcategory', strength: 0.95, description: 'Emanation follows Original Man' },
  { parent: 'Atzilus', child: 'Beriyah', type: 'subcategory', strength: 0.95, description: 'Creation follows Emanation' },
  { parent: 'Beriyah', child: 'Yetzirah', type: 'subcategory', strength: 0.95, description: 'Formation follows Creation' },
  { parent: 'Yetzirah', child: 'Asiyah', type: 'subcategory', strength: 0.95, description: 'Action follows Formation' },
  
  // Sefiros
  { parent: 'Atzilus', child: 'Sefirah', type: 'instance_of', strength: 0.9, description: 'Sefiros are the structure of Atzilus' },
  { parent: 'Sefirah', child: 'Partzuf', type: 'related_to', strength: 0.85, description: 'Partzufim are configurations of Sefiros' },
  
  // Barriers and Concealment
  { parent: 'Atzilus', child: 'Parsa', type: 'related_to', strength: 0.8, description: 'Curtain separates Atzilus from lower worlds' },
  { parent: 'Parsa', child: 'Kelipah', type: 'related_to', strength: 0.75, description: 'Kelipah is extreme concealment' },
];

function parseV1File(filePath: string): ParsedEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: ParsedEntry[] = [];
  
  // Split by "Entry:" markers or Hebrew term patterns
  const entryPattern = /(?:Entry: ([^\n]+)|^([א-ת\s]+) – ([A-Za-z\s]+)$)/gm;
  const sections = content.split(/(?=Entry:|(?:^[א-ת\s]+ – [A-Za-z\s]+$))/m);
  
  for (const section of sections) {
    if (section.trim().length < 50) continue;
    
    const entry = parseEntry(section);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

function parseEntry(text: string): ParsedEntry | null {
  // Extract title and Hebrew term
  const titleMatch = text.match(/(?:Entry: )?([^\n–]+)\s*(?:–\s*([א-ת\s]+))?/);
  if (!titleMatch) return null;
  
  let englishTitle = titleMatch[1].trim();
  let hebrewTerm = titleMatch[2]?.trim() || '';
  
  // Handle reverse order (Hebrew – English)
  const reverseMatch = text.match(/^([א-ת\s]+)\s*–\s*([A-Za-z\s]+)/m);
  if (reverseMatch) {
    hebrewTerm = reverseMatch[1].trim();
    englishTitle = reverseMatch[2].trim();
  }
  
  // Extract sections
  const definition = extractSection(text, 'Definition');
  const mashal = extractSection(text, 'Mashal');
  const personalNimshal = extractSection(text, 'Personal Nimshal');
  const globalNimshal = extractSection(text, 'Global Nimshal');
  const nimshal = extractSection(text, 'Nimshal'); // For entries without Personal/Global split
  const sources = extractSection(text, 'Sources');
  
  // Determine category from position in file
  let category = 'General Concepts';
  if (text.includes('Avodah concepts') || englishTitle.includes('Nefesh') || englishTitle.includes('Soul')) {
    category = 'Avodah Concepts';
  } else if (text.includes('Haskalah Concepts') || englishTitle.includes('Seder') || englishTitle.includes('Sefirah')) {
    category = 'Haskalah Concepts';
  }
  
  // Create slug
  const slug = englishTitle.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Build overview from mashal and personal nimshal
  let overview = '';
  if (mashal) {
    overview += `<h3>Mashal (Parable)</h3>\n${formatAsHtml(mashal)}\n\n`;
  }
  if (personalNimshal) {
    overview += `<h3>Personal Application</h3>\n${formatAsHtml(personalNimshal)}`;
  } else if (nimshal) {
    overview += `<h3>Application</h3>\n${formatAsHtml(nimshal)}`;
  }
  
  // Build practical takeaways
  let practicalTakeaways = '';
  if (personalNimshal) {
    practicalTakeaways = `<h3>Personal Application</h3>\n${formatAsHtml(personalNimshal)}`;
  }
  
  // Build historical context
  let historicalContext = '';
  if (globalNimshal) {
    historicalContext = `<h3>Global Meaning</h3>\n${formatAsHtml(globalNimshal)}`;
  } else if (nimshal && personalNimshal) {
    historicalContext = `<h3>Universal Meaning</h3>\n${formatAsHtml(nimshal)}`;
  }
  
  // Parse sources
  const sourceList = sources ? sources.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0) : [];
  
  return {
    canonical_title: englishTitle,
    canonical_title_en: englishTitle,
    canonical_title_transliteration: englishTitle,
    hebrew_term: hebrewTerm,
    slug,
    topic_type: 'concept',
    description: definition || '',
    description_en: definition || '',
    overview: overview.trim(),
    practical_takeaways: practicalTakeaways.trim(),
    historical_context: historicalContext.trim(),
    content_status: 'partial',
    status_label: 'Dictionary Entry',
    badge_color: 'blue',
    original_lang: hebrewTerm ? 'he' : 'en',
    metadata: {
      category,
      sources: sourceList,
      entry_source: 'v1.md',
      section_order: ['definition', 'mashal', 'personal_nimshal', 'global_nimshal', 'sources'].filter(s => {
        if (s === 'definition') return !!definition;
        if (s === 'mashal') return !!mashal;
        if (s === 'personal_nimshal') return !!personalNimshal;
        if (s === 'global_nimshal') return !!globalNimshal;
        if (s === 'sources') return !!sources;
        return false;
      })
    },
    sections: {
      definition,
      mashal,
      personal_nimshal: personalNimshal,
      global_nimshal: globalNimshal,
      sources
    }
  };
}

function extractSection(text: string, sectionName: string): string | undefined {
  const pattern = new RegExp(`${sectionName}:\\s*\n([\\s\\S]*?)(?=\n(?:Definition|Mashal|Personal Nimshal|Global Nimshal|Nimshal|Sources|Entry:|^[א-ת])|$)`, 'i');
  const match = text.match(pattern);
  return match ? match[1].trim() : undefined;
}

function formatAsHtml(text: string): string {
  // Convert numbered lists
  let html = text.replace(/^(\d+)\.\s+(.+)$/gm, '<p><strong>$1.</strong> $2</p>');
  
  // Convert bullet points
  html = html.replace(/^\s*•\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
  
  // Convert paragraphs (lines separated by blank lines)
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      if (p.startsWith('<ul>') || p.startsWith('<p>')) return p;
      return `<p>${p.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
  
  return html;
}

async function createTopicsInDirectus(entries: ParsedEntry[]) {
  console.log(`\n📝 Creating ${entries.length} topics in Directus...\n`);
  
  const createdTopics: any[] = [];
  
  for (const entry of entries) {
    try {
      const topicData = {
        canonical_title: entry.canonical_title,
        canonical_title_en: entry.canonical_title_en,
        canonical_title_transliteration: entry.canonical_title_transliteration,
        slug: entry.slug,
        topic_type: entry.topic_type,
        description: entry.description,
        description_en: entry.description_en,
        overview: entry.overview,
        practical_takeaways: entry.practical_takeaways,
        historical_context: entry.historical_context,
        content_status: entry.content_status,
        status_label: entry.status_label,
        badge_color: entry.badge_color,
        original_lang: entry.original_lang,
        metadata: entry.metadata
      };
      
      const response = await fetch(`${DIRECTUS_URL}/items/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify(topicData)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to create topic "${entry.canonical_title}": ${error}`);
        continue;
      }
      
      const result = await response.json();
      createdTopics.push({ ...result.data, slug: entry.slug });
      console.log(`✅ Created: ${entry.canonical_title} (ID: ${result.data.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating topic "${entry.canonical_title}":`, error);
    }
  }
  
  return createdTopics;
}

async function createRelationships(topics: any[]) {
  console.log(`\n🔗 Creating Chassidus-based relationships...\n`);
  
  // Build slug to ID map
  const slugToId = new Map<string, number>();
  topics.forEach(t => slugToId.set(t.slug, t.id));
  
  let created = 0;
  let skipped = 0;
  
  for (const rel of CHASSIDUS_RELATIONSHIPS) {
    const parentSlug = rel.parent.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const childSlug = rel.child.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    const parentId = slugToId.get(parentSlug);
    const childId = slugToId.get(childSlug);
    
    if (!parentId || !childId) {
      skipped++;
      continue;
    }
    
    try {
      const relationshipData = {
        parent_topic_id: parentId,
        child_topic_id: childId,
        relation_type: rel.type,
        strength: rel.strength,
        display_order: 0,
        description: rel.description
      };
      
      const response = await fetch(`${DIRECTUS_URL}/items/topic_relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify(relationshipData)
      });
      
      if (response.ok) {
        created++;
        console.log(`✅ ${rel.parent} → ${rel.child} (${rel.type})`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed: ${rel.parent} → ${rel.child}: ${error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating relationship ${rel.parent} → ${rel.child}:`, error);
    }
  }
  
  console.log(`\n📊 Relationships: ${created} created, ${skipped} skipped (topics not found)`);
}

async function createSources(entries: ParsedEntry[], topics: any[]) {
  console.log(`\n📚 Creating source records...\n`);
  
  const slugToId = new Map<string, number>();
  topics.forEach(t => slugToId.set(t.slug, t.id));
  
  const uniqueSources = new Set<string>();
  entries.forEach(entry => {
    entry.metadata.sources.forEach(source => uniqueSources.add(source));
  });
  
  const createdSources: any[] = [];
  
  for (const sourceTitle of uniqueSources) {
    if (!sourceTitle || sourceTitle.length < 3) continue;
    
    try {
      // Try to determine if this is a Sefaria source
      const isSefariaSource = sourceTitle.match(/Tanya|Likkutei|Kuntres|Torah Ohr|Derech Chaim/i);
      
      const sourceData = {
        title: sourceTitle,
        original_lang: 'he',
        is_external: !!isSefariaSource,
        external_system: isSefariaSource ? 'sefaria' : null,
        citation_text: sourceTitle,
        metadata: {
          source_type: 'chassidus',
          auto_imported: true,
          import_source: 'v1.md'
        }
      };
      
      const response = await fetch(`${DIRECTUS_URL}/items/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify(sourceData)
      });
      
      if (response.ok) {
        const result = await response.json();
        createdSources.push({ ...result.data, title: sourceTitle });
        console.log(`✅ Created source: ${sourceTitle}${isSefariaSource ? ' (Sefaria)' : ''}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating source "${sourceTitle}":`, error);
    }
  }
  
  console.log(`\n📊 Created ${createdSources.length} unique sources`);
  return createdSources;
}

async function main() {
  console.log('🚀 Starting v1.md Complete Ingestion\n');
  console.log('=' .repeat(60));
  
  // Parse v1.md
  const v1Path = path.join(__dirname, '../data/v1.md');
  console.log(`\n📖 Parsing ${v1Path}...\n`);
  
  const entries = parseV1File(v1Path);
  console.log(`✅ Parsed ${entries.length} entries\n`);
  
  // Show sample
  console.log('📋 Sample entries:');
  entries.slice(0, 5).forEach(e => {
    console.log(`  • ${e.canonical_title} (${e.hebrew_term || 'no Hebrew'})`);
    console.log(`    Category: ${e.metadata.category}`);
    console.log(`    Sections: ${e.metadata.section_order.join(', ')}`);
  });
  
  // Create topics
  const topics = await createTopicsInDirectus(entries);
  
  // Create relationships
  await createRelationships(topics);
  
  // Create sources
  await createSources(entries, topics);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Ingestion Complete!\n');
  console.log(`📊 Final Statistics:`);
  console.log(`   Topics created: ${topics.length}`);
  console.log(`   Categories: ${new Set(entries.map(e => e.metadata.category)).size}`);
  console.log(`   Total relationships defined: ${CHASSIDUS_RELATIONSHIPS.length}`);
  console.log('\n🎉 Database is ready with complete v1.md data!');
}

main().catch(console.error);
