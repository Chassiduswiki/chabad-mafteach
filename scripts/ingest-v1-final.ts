import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ACCESS_TOKEN || '';

interface ParsedEntry {
  canonical_title: string;
  hebrew_term: string;
  slug: string;
  description: string;
  overview: string;
  practical_takeaways: string;
  historical_context: string;
  metadata: {
    category: string;
    sources: string[];
  };
}

const CHASSIDUS_RELATIONSHIPS = [
  { parent: 'Avodah', child: 'Haskalah', type: 'related_to', strength: 0.9, description: 'Complementary branches' },
  { parent: 'Avodah', child: 'Havanah', type: 'related_to', strength: 0.9, description: 'Complementary branches' },
  { parent: 'Haskalah', child: 'Havanah', type: 'related_to', strength: 0.9, description: 'Complementary branches' },
  { parent: 'Hisbonenus', child: 'Avodah', type: 'related_to', strength: 0.95, description: 'Foundation of Avodah' },
  { parent: 'Hisbonenus', child: 'Haskalah', type: 'related_to', strength: 0.95, description: 'Foundation of Haskalah' },
  { parent: 'Nefesh', child: 'Nefesh HaBehamis', type: 'instance_of', strength: 0.9, description: 'Animal soul type' },
  { parent: 'Nefesh', child: 'Nefesh HaElokis', type: 'instance_of', strength: 0.9, description: 'G-dly soul type' },
  { parent: 'Nefesh', child: 'Etzem HaNefesh', type: 'subcategory', strength: 0.85, description: 'Soul essence' },
  { parent: 'Nefesh', child: 'Kochos HaNefesh', type: 'subcategory', strength: 0.85, description: 'Soul abilities' },
  { parent: 'Nefesh', child: 'Levushei HaNefesh', type: 'subcategory', strength: 0.85, description: 'Soul garments' },
  { parent: 'Avodah', child: 'Ahavas Hashem', type: 'instance_of', strength: 0.9, description: 'Love as Avodah' },
  { parent: 'Avodah', child: 'Yiras Hashem', type: 'instance_of', strength: 0.9, description: 'Fear as Avodah' },
  { parent: 'Avodah', child: 'Kabbalas Ol', type: 'instance_of', strength: 0.85, description: 'Accepting yoke' },
  { parent: 'Avodah', child: 'Mesiras Nefesh', type: 'instance_of', strength: 0.95, description: 'Self-sacrifice' },
  { parent: 'Ahavas Hashem', child: 'Pnimiyus', type: 'related_to', strength: 0.9, description: 'Inner motivation' },
  { parent: 'Yiras Hashem', child: 'Chitzoniyus', type: 'related_to', strength: 0.8, description: 'External motivation' },
  { parent: 'Seder Hishtalshelus', child: 'Atzmus', type: 'subcategory', strength: 0.95, description: 'Source of creation' },
  { parent: 'Atzmus', child: 'Tzimtzum', type: 'subcategory', strength: 0.95, description: 'Contraction' },
  { parent: 'Tzimtzum', child: 'Reshimu', type: 'subcategory', strength: 0.9, description: 'Impression remains' },
  { parent: 'Tzimtzum', child: 'Kav', type: 'subcategory', strength: 0.9, description: 'Line of light' },
  { parent: 'Kav', child: 'Igulim', type: 'related_to', strength: 0.85, description: 'Circles and line' },
  { parent: 'Kav', child: 'Yosher', type: 'related_to', strength: 0.85, description: 'Straight sefiros' },
  { parent: 'Yosher', child: 'Adam Kadmon', type: 'subcategory', strength: 0.9, description: 'Original Man' },
  { parent: 'Adam Kadmon', child: 'Atzilus', type: 'subcategory', strength: 0.95, description: 'Emanation' },
  { parent: 'Atzilus', child: 'Beriyah', type: 'subcategory', strength: 0.95, description: 'Creation' },
  { parent: 'Beriyah', child: 'Yetzirah', type: 'subcategory', strength: 0.95, description: 'Formation' },
  { parent: 'Yetzirah', child: 'Asiyah', type: 'subcategory', strength: 0.95, description: 'Action' },
  { parent: 'Atzilus', child: 'Sefirah', type: 'instance_of', strength: 0.9, description: 'Sefiros structure' },
  { parent: 'Sefirah', child: 'Partzuf', type: 'related_to', strength: 0.85, description: 'Sefirot configurations' },
  { parent: 'Atzilus', child: 'Parsa', type: 'related_to', strength: 0.8, description: 'Curtain separator' },
  { parent: 'Parsa', child: 'Kelipah', type: 'related_to', strength: 0.75, description: 'Extreme concealment' },
];

function parseV1File(filePath: string): ParsedEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: ParsedEntry[] = [];
  
  // Split by entry headers (English – Hebrew pattern)
  const lines = content.split('\n');
  let currentEntry: any = null;
  let currentSection = '';
  let sectionLines: string[] = [];
  let category = 'General Concepts';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track category
    if (line === 'General Concepts' || line === 'Avodah concepts' || line === 'Haskalah Concepts') {
      category = line;
      continue;
    }
    
    // Entry header: "Entry: Hebrew, English" format
    const entryMatch = line.match(/^Entry:\s*([א-ת][א-ת\s\(\),"']+),\s*([A-Za-z][A-Za-z\s\(\),'"]+)$/);
    // Or "Title – Hebrew" format (for entries without "Entry:" prefix)
    const simpleMatch = line.match(/^([A-Za-z][A-Za-z\s\(\),'"]+?)\s*–\s*([א-ת][א-ת\s\(\),"']+)$/);
    
    if (entryMatch || simpleMatch) {
      // Save previous entry
      if (currentEntry) {
        if (sectionLines.length > 0) {
          currentEntry.sections[currentSection] = sectionLines.join('\n').trim();
        }
        const built = buildEntry(currentEntry, category);
        if (built) entries.push(built);
      }
      
      // Start new entry
      if (entryMatch) {
        currentEntry = {
          title: entryMatch[2].trim(),
          hebrew: entryMatch[1].trim(),
          sections: {}
        };
      } else if (simpleMatch) {
        currentEntry = {
          title: simpleMatch[1].trim(),
          hebrew: simpleMatch[2].trim(),
          sections: {}
        };
      }
      currentSection = '';
      sectionLines = [];
      continue;
    }
    
    // Section headers
    if (line.match(/^(Definition|Mashal|Personal Nimshal|Global Nimshal|Nimshal|Sources):\s*$/)) {
      if (currentSection && sectionLines.length > 0) {
        currentEntry.sections[currentSection] = sectionLines.join('\n').trim();
      }
      currentSection = line.replace(':', '').trim().toLowerCase().replace(/\s+/g, '_');
      sectionLines = [];
      continue;
    }
    
    // Collect section content
    if (currentEntry && currentSection) {
      // Stop collecting if we hit a line that looks like a new entry header
      if (line.match(/^[A-Za-z][A-Za-z\s\(\),'"]+?\s*–\s*[א-ת]/)) {
        i--; // Reprocess this line
        continue;
      }
      sectionLines.push(line);
    }
  }
  
  // Save last entry
  if (currentEntry && currentSection && sectionLines.length > 0) {
    currentEntry.sections[currentSection] = sectionLines.join('\n').trim();
    const built = buildEntry(currentEntry, category);
    if (built) entries.push(built);
  }
  
  return entries;
}

function buildEntry(raw: any, category: string): ParsedEntry | null {
  if (!raw.title || !raw.sections.definition) return null;
  
  const slug = raw.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  if (!slug) return null;
  
  const def = raw.sections.definition || '';
  const mashal = raw.sections.mashal || '';
  const personalNimshal = raw.sections.personal_nimshal || '';
  const globalNimshal = raw.sections.global_nimshal || '';
  const nimshal = raw.sections.nimshal || '';
  const sources = raw.sections.sources || '';
  
  let overview = '';
  if (mashal) overview += `<h3>Mashal</h3>\n${toHtml(mashal)}\n\n`;
  if (personalNimshal) overview += `<h3>Personal Application</h3>\n${toHtml(personalNimshal)}`;
  else if (nimshal) overview += `<h3>Application</h3>\n${toHtml(nimshal)}`;
  
  let practical = '';
  if (personalNimshal) practical = `<h3>Personal Application</h3>\n${toHtml(personalNimshal)}`;
  
  let historical = '';
  if (globalNimshal) historical = `<h3>Global Meaning</h3>\n${toHtml(globalNimshal)}`;
  
  const sourceList = sources
    .split(/\.\s+(?=[A-Z])|;/)
    .map((s: string) => s.trim().replace(/\.$/, ''))
    .filter((s: string) => s.length > 5 && !s.match(/^(ch\.|vol\.|pp\.|Introduction)/i));
  
  return {
    canonical_title: raw.title,
    hebrew_term: raw.hebrew,
    slug,
    description: toHtml(def),
    overview: overview.trim(),
    practical_takeaways: practical.trim(),
    historical_context: historical.trim(),
    metadata: {
      category,
      sources: sourceList
    }
  };
}

function toHtml(text: string): string {
  if (!text) return '';
  
  let html = text
    .replace(/^(\d+)\.\s+(.+)$/gm, '<p><strong>$1.</strong> $2</p>')
    .replace(/^\s*•\s+(.+)$/gm, '<li>$1</li>');
  
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('<li>')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(trimmed);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (trimmed && !trimmed.startsWith('<p>')) {
        result.push(`<p>${trimmed}</p>`);
      } else if (trimmed) {
        result.push(trimmed);
      }
    }
  }
  
  if (inList) result.push('</ul>');
  return result.join('\n');
}

async function createTopics(entries: ParsedEntry[]) {
  console.log(`\n📝 Creating ${entries.length} topics...\n`);
  
  const created: any[] = [];
  
  for (const entry of entries) {
    try {
      const data = {
        canonical_title: entry.canonical_title,
        canonical_title_en: entry.canonical_title,
        canonical_title_transliteration: entry.canonical_title,
        slug: entry.slug,
        topic_type: 'concept',
        description: entry.description,
        description_en: entry.description,
        overview: entry.overview,
        practical_takeaways: entry.practical_takeaways,
        historical_context: entry.historical_context,
        content_status: 'partial',
        status_label: 'Dictionary Entry',
        badge_color: 'blue',
        original_lang: 'he',
        metadata: entry.metadata
      };
      
      const res = await fetch(`${DIRECTUS_URL}/items/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const result = await res.json();
        created.push({ ...result.data, slug: entry.slug });
        console.log(`✅ ${entry.canonical_title} (${entry.hebrew_term})`);
      } else {
        const err = await res.text();
        console.error(`❌ ${entry.canonical_title}: ${err}`);
      }
    } catch (error) {
      console.error(`❌ ${entry.canonical_title}:`, error);
    }
  }
  
  return created;
}

async function createRelationships(topics: any[]) {
  console.log(`\n🔗 Creating relationships...\n`);
  
  const slugMap = new Map<string, number>();
  topics.forEach(t => {
    slugMap.set(t.slug, t.id);
    const alt = t.canonical_title?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    if (alt) slugMap.set(alt, t.id);
  });
  
  let created = 0;
  
  for (const rel of CHASSIDUS_RELATIONSHIPS) {
    const pSlug = rel.parent.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    const cSlug = rel.child.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    
    const pId = slugMap.get(pSlug);
    const cId = slugMap.get(cSlug);
    
    if (!pId || !cId) continue;
    
    try {
      const res = await fetch(`${DIRECTUS_URL}/items/topic_relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify({
          parent_topic_id: pId,
          child_topic_id: cId,
          relation_type: rel.type,
          strength: rel.strength,
          display_order: 0,
          description: rel.description
        })
      });
      
      if (res.ok) {
        created++;
        console.log(`✅ ${rel.parent} → ${rel.child}`);
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  console.log(`\n📊 Created ${created} relationships`);
}

async function createSources(entries: ParsedEntry[]) {
  console.log(`\n📚 Creating sources...\n`);
  
  const unique = new Set<string>();
  entries.forEach(e => e.metadata.sources.forEach(s => unique.add(s)));
  
  let created = 0;
  
  for (const title of unique) {
    try {
      const isSefaria = title.match(/Tanya|Likkutei|Kuntres|Torah Ohr|Hayom Yom/i);
      
      const res = await fetch(`${DIRECTUS_URL}/items/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        },
        body: JSON.stringify({
          title,
          original_lang: 'he',
          is_external: !!isSefaria,
          external_system: isSefaria ? 'sefaria' : null,
          citation_text: title,
          metadata: { auto_imported: true, import_source: 'v1.md' }
        })
      });
      
      if (res.ok) {
        created++;
        console.log(`✅ ${title}`);
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  console.log(`\n📊 Created ${created} sources`);
}

async function main() {
  console.log('🚀 v1.md Final Ingestion\n' + '='.repeat(60) + '\n');
  
  const v1Path = path.join(__dirname, '../data/v1.md');
  const entries = parseV1File(v1Path);
  
  console.log(`✅ Parsed ${entries.length} entries\n`);
  entries.forEach((e, i) => console.log(`  ${i + 1}. ${e.canonical_title} (${e.hebrew_term})`));
  
  const topics = await createTopics(entries);
  await createRelationships(topics);
  await createSources(entries);
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Complete! ${topics.length} topics created\n`);
}

main().catch(console.error);
