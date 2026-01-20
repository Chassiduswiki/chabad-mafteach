import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directus client setup
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ACCESS_TOKEN || '';

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
  
  // Soul Hierarchy
  { parent: 'Five Soul Levels', child: 'Nefesh', type: 'subcategory', strength: 0.95, description: 'Nefesh is first of five soul levels' },
  
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
  
  // Split content into lines for processing
  const lines = content.split('\n');
  let currentEntry: any = null;
  let currentSection = '';
  let sectionContent: string[] = [];
  let currentCategory = 'General Concepts';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect category headers
    if (line.match(/^(General Concepts|Avodah concepts|Haskalah Concepts)$/)) {
      currentCategory = line;
      continue;
    }
    
    // Detect entry start: "Avodah – עבודה" or "Entry: עבודה, Avodah"
    const entryMatch = line.match(/^([A-Za-z\s\(\)'"]+)\s*–\s*([א-ת\s]+)$/) || 
                       line.match(/^Entry:\s*([א-ת\s]+),\s*([A-Za-z\s]+)$/);
    
    if (entryMatch) {
      // Save previous entry
      if (currentEntry) {
        if (sectionContent.length > 0) {
          currentEntry.sections[currentSection] = sectionContent.join('\n').trim();
        }
        entries.push(buildEntry(currentEntry, currentCategory));
      }
      
      // Start new entry
      const englishTitle = entryMatch[1].trim();
      const hebrewTerm = entryMatch[2].trim();
      
      currentEntry = {
        englishTitle,
        hebrewTerm,
        sections: {}
      };
      currentSection = '';
      sectionContent = [];
      continue;
    }
    
    // Detect section headers
    if (line.match(/^(Definition|Mashal|Personal Nimshal|Global Nimshal|Nimshal|Sources):\s*$/)) {
      // Save previous section
      if (currentSection && sectionContent.length > 0) {
        currentEntry.sections[currentSection] = sectionContent.join('\n').trim();
      }
      
      currentSection = line.replace(':', '').trim().toLowerCase().replace(/\s+/g, '_');
      sectionContent = [];
      continue;
    }
    
    // Accumulate section content
    if (currentEntry && currentSection) {
      // Skip empty lines at start of section
      if (sectionContent.length === 0 && line.trim() === '') continue;
      
      // Stop at next entry or section
      if (line.match(/^[A-Za-z\s\(\)'"]+\s*–\s*[א-ת\s]+$/) || 
          line.match(/^(Definition|Mashal|Personal Nimshal|Global Nimshal|Nimshal|Sources):\s*$/)) {
        i--; // Reprocess this line
        continue;
      }
      
      sectionContent.push(line);
    }
  }
  
  // Save last entry
  if (currentEntry) {
    if (sectionContent.length > 0) {
      currentEntry.sections[currentSection] = sectionContent.join('\n').trim();
    }
    entries.push(buildEntry(currentEntry, currentCategory));
  }
  
  return entries.filter(e => e.canonical_title && e.canonical_title.length > 1);
}

function buildEntry(rawEntry: any, category: string): ParsedEntry {
  const { englishTitle, hebrewTerm, sections } = rawEntry;
  
  // Create slug
  const slug = englishTitle.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Build description from definition
  const definition = sections.definition || '';
  
  // Build overview from mashal and personal nimshal
  let overview = '';
  if (sections.mashal) {
    overview += `<h3>Mashal (Parable)</h3>\n${formatAsHtml(sections.mashal)}\n\n`;
  }
  if (sections.personal_nimshal) {
    overview += `<h3>Personal Application</h3>\n${formatAsHtml(sections.personal_nimshal)}`;
  } else if (sections.nimshal) {
    overview += `<h3>Application</h3>\n${formatAsHtml(sections.nimshal)}`;
  }
  
  // Build practical takeaways
  let practicalTakeaways = '';
  if (sections.personal_nimshal) {
    practicalTakeaways = `<h3>Personal Application</h3>\n${formatAsHtml(sections.personal_nimshal)}`;
  }
  
  // Build historical context
  let historicalContext = '';
  if (sections.global_nimshal) {
    historicalContext = `<h3>Global Meaning</h3>\n${formatAsHtml(sections.global_nimshal)}`;
  } else if (sections.nimshal && sections.personal_nimshal) {
    historicalContext = `<h3>Universal Meaning</h3>\n${formatAsHtml(sections.nimshal)}`;
  }
  
  // Parse sources
  const sourceList = sections.sources 
    ? sections.sources.split(/[,;]/).map((s: string) => s.trim()).filter((s: string) => s.length > 3)
    : [];
  
  return {
    canonical_title: englishTitle,
    canonical_title_en: englishTitle,
    canonical_title_transliteration: englishTitle,
    hebrew_term: hebrewTerm,
    slug,
    topic_type: 'concept',
    description: formatAsHtml(definition),
    description_en: formatAsHtml(definition),
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
      entry_source: 'v1.md'
    }
  };
}

function formatAsHtml(text: string): string {
  if (!text) return '';
  
  // Convert numbered lists
  let html = text.replace(/^(\d+)\.\s+(.+)$/gm, '<p><strong>$1.</strong> $2</p>');
  
  // Convert bullet points
  html = html.replace(/^\s*•\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive list items
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('<li>')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(line);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line.trim()) {
        if (!line.startsWith('<p>')) {
          result.push(`<p>${line}</p>`);
        } else {
          result.push(line);
        }
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
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
      console.log(`✅ Created: ${entry.canonical_title} (${entry.hebrew_term}) - ID: ${result.data.id}`);
      
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
  const titleToId = new Map<string, number>();
  
  topics.forEach(t => {
    slugToId.set(t.slug, t.id);
    // Also map by canonical title for matching
    const normalizedTitle = t.canonical_title?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    if (normalizedTitle) {
      titleToId.set(normalizedTitle, t.id);
    }
  });
  
  let created = 0;
  let skipped = 0;
  
  for (const rel of CHASSIDUS_RELATIONSHIPS) {
    const parentSlug = rel.parent.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const childSlug = rel.child.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    const parentId = slugToId.get(parentSlug) || titleToId.get(parentSlug);
    const childId = slugToId.get(childSlug) || titleToId.get(childSlug);
    
    if (!parentId || !childId) {
      console.log(`⏭️  Skipped: ${rel.parent} → ${rel.child} (not found)`);
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
  
  console.log(`\n📊 Relationships: ${created} created, ${skipped} skipped`);
}

async function createSources(entries: ParsedEntry[]) {
  console.log(`\n📚 Creating source records...\n`);
  
  const uniqueSources = new Set<string>();
  entries.forEach(entry => {
    entry.metadata.sources.forEach(source => {
      const cleaned = source.trim();
      if (cleaned.length > 3 && !cleaned.match(/^(ch\.|vol\.|pp\.|Introduction|Mashal|Nimshal)/i)) {
        uniqueSources.add(cleaned);
      }
    });
  });
  
  const createdSources: any[] = [];
  
  for (const sourceTitle of uniqueSources) {
    try {
      // Try to determine if this is a Sefaria source
      const isSefariaSource = sourceTitle.match(/Tanya|Likkutei|Kuntres|Torah Ohr|Derech Chaim|Hayom Yom/i);
      
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
        console.log(`✅ ${sourceTitle}${isSefariaSource ? ' (Sefaria)' : ''}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating source "${sourceTitle}":`, error);
    }
  }
  
  console.log(`\n📊 Created ${createdSources.length} unique sources`);
  return createdSources;
}

async function main() {
  console.log('🚀 Starting v1.md Complete Ingestion (Fixed Parser)\n');
  console.log('=' .repeat(60));
  
  // Parse v1.md
  const v1Path = path.join(__dirname, '../data/v1.md');
  console.log(`\n📖 Parsing ${v1Path}...\n`);
  
  const entries = parseV1File(v1Path);
  console.log(`✅ Parsed ${entries.length} entries\n`);
  
  // Show all entries
  console.log('📋 All entries:');
  entries.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.canonical_title} (${e.hebrew_term})`);
  });
  
  // Create topics
  const topics = await createTopicsInDirectus(entries);
  
  // Create relationships
  await createRelationships(topics);
  
  // Create sources
  await createSources(entries);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Ingestion Complete!\n');
  console.log(`📊 Final Statistics:`);
  console.log(`   Topics created: ${topics.length}`);
  console.log(`   Categories: ${new Set(entries.map(e => e.metadata.category)).size}`);
  console.log(`   Total relationships defined: ${CHASSIDUS_RELATIONSHIPS.length}`);
  console.log('\n🎉 Database is ready with complete v1.md data!');
}

main().catch(console.error);
