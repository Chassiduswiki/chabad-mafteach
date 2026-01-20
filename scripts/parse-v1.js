import fs from 'fs/promises';

const content = await fs.readFile('./data/v1.md', 'utf-8');
const lines = content.split('\n');

const entries = [];
let currentEntry = null;
let currentSection = null;
let currentLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Skip table of contents and index sections
  if (trimmed === 'Contents' || trimmed === 'מפתח ערכים') {
    while (i < lines.length && !lines[i].trim().match(/^[A-Z][a-z]+\s+[A-Z]/)) {
      i++;
    }
    continue;
  }
  
  // Entry start: "Entry: עבודה, Avodah"
  if (trimmed.startsWith('Entry:')) {
    if (currentEntry && currentEntry.sections.length > 0) {
      entries.push(currentEntry);
    }
    
    const match = trimmed.match(/Entry:\s*([^,]+),\s*(.+)/);
    if (match) {
      currentEntry = {
        hebrew: match[1].trim(),
        transliteration: match[2].trim(),
        sections: []
      };
      currentSection = null;
      currentLines = [];
    }
    continue;
  }
  
  // Section headers (Definition:, Mashal:, etc.)
  if (trimmed.match(/^(Definition|Mashal|Personal Nimshal|Global Nimshal|Nimshal|Sources|Introduction|Table of the six general partzufim|Basic Hishtalshelus Reference Chart|Name|Translation):/)) {
    if (currentSection && currentLines.length > 0) {
      currentEntry.sections.push({
        type: currentSection,
        content: currentLines.join('\n').trim()
      });
    }
    currentSection = trimmed.replace(':', '');
    currentLines = [];
    continue;
  }
  
  // Content accumulation
  if (currentEntry && currentSection && trimmed) {
    currentLines.push(trimmed);
  }
}

// Add final entry
if (currentEntry && currentEntry.sections.length > 0) {
  if (currentSection && currentLines.length > 0) {
    currentEntry.sections.push({
      type: currentSection,
      content: currentLines.join('\n').trim()
    });
  }
  entries.push(currentEntry);
}

console.log(JSON.stringify(entries, null, 2));
console.log(`\n// Found ${entries.length} entries`);
