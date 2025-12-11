// Script to populate Chabad Library book data to Directus
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getEntireChabadLibraryBookSequential } = require('./scrapers/chabadlibraryScraper');

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const TOKEN = 'f4Zk7OBxDQlkQuO60f3PeATYzjdgP2mv';

// Language detection (simple heuristic for Hebrew/English)
function detectLanguage(text) {
  if (!text) return 'en'; // default

  // Count Hebrew characters (U+0590-U+05FF)
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  // If more than 10% Hebrew characters, classify as Hebrew
  return hebrewChars / totalChars > 0.1 ? 'he' : 'en';
}

// Generate sequential order key for content blocks
function generateOrderKey(index) {
  // Simple sequential for now (can upgrade to LexoRank later)
  return String(index + 1).padStart(3, '0');
}

// Extract citation information from Chabad Library structure
function extractCitationInfo(heading, sectionPath = []) {
  const citationInfo = {
    page_number: null,
    chapter_number: null,
    halacha_number: null,
    daf_number: null,
    section_number: null,
    citation_refs: []
  };

  // Extract folio reference (e.g., "א, א" -> page_number: "1a")
  const folioReference = parseFolioReference(heading);
  if (folioReference) {
    citationInfo.page_number = folioReference;
  }

  // Extract chapter/section numbers from heading
  const chapterMatch = heading.match(/פרק\s*(\d+)/);
  if (chapterMatch) {
    citationInfo.chapter_number = parseInt(chapterMatch[1]);
  }

  const halachaMatch = heading.match(/הלכה\s*(\d+)/);
  if (halachaMatch) {
    citationInfo.halacha_number = parseInt(halachaMatch[1]);
  }

  // Extract section numbers
  const sectionMatch = heading.match(/שער\s*(\d+)/);
  if (sectionMatch) {
    citationInfo.section_number = parseInt(sectionMatch[1]);
  }

  // Add traditional citation formats if we have enough info
  if (citationInfo.chapter_number && citationInfo.halacha_number) {
    citationInfo.citation_refs.push({
      system: 'traditional',
      reference: `שער ${citationInfo.section_number || 'א'}, פרק ${citationInfo.chapter_number}, הלכה ${citationInfo.halacha_number}`
    });
  }

  // Add Sefaria-style citation if we have page info
  if (citationInfo.page_number) {
    citationInfo.citation_refs.push({
      system: 'sefaria',
      reference: `${folioReference}`
    });
  }

  return citationInfo;
}

// Parse footnotes and split text into statement segments
function parseFootnotesIntoStatements(text, notes) {
  if (!text || !notes) return [{ text: text, appended_text: '', citation_references: [] }];

  // Parse the notes object - it comes as a string with [ftn_X_Y] markers
  const noteMap = {};
  const noteLines = notes.split('\r\n\r\n');
  for (const line of noteLines) {
    const match = line.match(/^\[ftn_(\d+)_(\d+)\]\s*\[dibur_maschil\](.*)\[\/dibur_maschil\]/);
    if (match) {
      const [, num1, num2, content] = match;
      noteMap[`ftnref_${num1}_${num2}`] = content;
    }
  }

  // Split text by footnote references and create statement segments
  const statements = [];
  let currentText = '';
  let lastIndex = 0;

  // Find all footnote references in order
  const footnoteRefs = [];
  const refRegex = /\[ftnref_(\d+)_(\d+)\]/g;
  let match;
  while ((match = refRegex.exec(text)) !== null) {
    footnoteRefs.push({
      index: match.index,
      fullMatch: match[0],
      num1: match[1],
      num2: match[2],
      footnoteKey: `ftnref_${match[1]}_${match[2]}`
    });
  }

  // Process each footnote reference
  for (let i = 0; i < footnoteRefs.length; i++) {
    const ref = footnoteRefs[i];
    const nextRef = footnoteRefs[i + 1];

    // Extract text segment from current position to this footnote reference
    const textBeforeRef = text.substring(lastIndex, ref.index);
    if (textBeforeRef.trim()) {
      statements.push({
        text: textBeforeRef.trim(),
        appended_text: '',
        citation_references: []
      });
    }

    // Create statement for the footnote segment
    const footnoteContent = noteMap[ref.footnoteKey];
    const footnoteText = footnoteContent ?
      `<div class="footnote">${ref.num1}.${ref.num2} ${footnoteContent}</div>` : '';

    // Extract citation references from footnote content
    const citationReferences = footnoteContent ? extractCitationReferences(footnoteContent) : [];

    // Text segment from footnote reference to next reference (or end)
    const endIndex = nextRef ? nextRef.index : text.length;
    const segmentText = text.substring(ref.index + ref.fullMatch.length, endIndex);

    if (segmentText.trim() || footnoteText) {
      statements.push({
        text: segmentText.trim(),
        appended_text: footnoteText,
        citation_references: citationReferences
      });
    }

    lastIndex = endIndex;
  }

  // Add any remaining text after the last footnote
  const remainingText = text.substring(lastIndex);
  if (remainingText.trim()) {
    statements.push({
      text: remainingText.trim(),
      appended_text: '',
      citation_references: []
    });
  }

  // Filter out empty statements and ensure we have at least one
  const validStatements = statements.filter(stmt => stmt.text.trim() || stmt.appended_text);
  return validStatements.length > 0 ? validStatements : [{ text: text, appended_text: '', citation_references: [] }];
}

// Helper function to extract citation references from footnote content
function extractCitationReferences(footnoteContent) {
  const references = [];

  // Common patterns in Jewish text citations
  // Example patterns:
  // - "ראה ליקוטי תורה" (see Likkutei Torah)
  // - "שער היחוד והאמונה" (Gate of Unity and Faith)
  // - "תניא פלוני" (Tanya chapter X)
  // - "לקוטי אמרים" (Likkutei Amarim)
  // - Hebrew book titles followed by folio references

  // Extract book titles (common Chabad texts)
  const bookPatterns = [
    /(ליקוטי תורה|תורה אור|ספר התניא|תניא|לקוטי אמרים|שער היחוד והאמונה|שער האמונה|אגרת התשובה|אגרת הקדש|קונטרס אחרון)/g,
    /(Likkutei Torah|Tanya|Likkutei Amarim|Igeret HaTeshuva|Igeret HaKodesh)/gi
  ];

  // Look for folio references (Hebrew numerals followed by letters)
  const folioPattern = /([א-ת]+),\s*([א-ת])/g;

  // Look for section/chapter references
  const sectionPattern = /(שער|פרק|אות)\s*[\dא-ת]+/g;

  // Extract potential book references
  bookPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(footnoteContent)) !== null) {
      references.push({
        type: 'book_reference',
        text: match[1],
        confidence: 0.8, // High confidence for direct book titles
        position: match.index,
        context: footnoteContent.substring(Math.max(0, match.index - 20), Math.min(footnoteContent.length, match.index + match[1].length + 20))
      });
    }
  });

  // Extract folio references
  let match;
  while ((match = folioPattern.exec(footnoteContent)) !== null) {
    const folioText = match[1] + ',' + match[2];
    references.push({
      type: 'folio_reference',
      text: folioText,
      confidence: 0.9,
      position: match.index,
      context: footnoteContent.substring(Math.max(0, match.index - 10), Math.min(footnoteContent.length, match.index + folioText.length + 10))
    });
  }

  // Extract section references
  while ((match = sectionPattern.exec(footnoteContent)) !== null) {
    references.push({
      type: 'section_reference',
      text: match[1],
      confidence: 0.7,
      position: match.index,
      context: footnoteContent.substring(Math.max(0, match.index - 15), Math.min(footnoteContent.length, match.index + match[1].length + 15))
    });
  }

  // Remove duplicates and sort by position
  const uniqueRefs = references.filter((ref, index, self) =>
    index === self.findIndex(r => r.text === ref.text && r.type === ref.type)
  ).sort((a, b) => a.position - b.position);

  return uniqueRefs;
}

// Helper function to convert Hebrew letters to numbers
function hebrewToNumber(hebrew) {
  const hebrewMap = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
    'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70,
    'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
  };

  let total = 0;
  for (let i = 0; i < hebrew.length; i++) {
    const char = hebrew[i];
    if (hebrewMap[char]) {
      total += hebrewMap[char];
    }
  }
  return total;
}

// Helper function to convert Hebrew letters to folio letters (a, b, c...)
function hebrewToFolioLetter(hebrew) {
  const letterMap = {
    'א': 'a', 'ב': 'b', 'ג': 'c', 'ד': 'd', 'ה': 'e', 'ו': 'f', 'ז': 'g', 'ח': 'h', 'ט': 'i',
    'י': 'j', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 'o',
    'ע': 'p', 'פ': 'q', 'ף': 'q', 'צ': 'r', 'ץ': 'r', 'ק': 's', 'ר': 't', 'ש': 'u', 'ת': 'v'
  };

  return letterMap[hebrew] || hebrew;
}

// Helper function to parse Hebrew folio reference like "א, א" to standard notation "1a"
function parseFolioReference(heading) {
  if (!heading || !heading.includes(',')) return null;

  const parts = heading.split(',').map(part => part.trim());
  if (parts.length === 2) {
    const folioNumber = hebrewToNumber(parts[0]);
    const folioLetter = hebrewToFolioLetter(parts[1]);
    return `${folioNumber}${folioLetter}`;
  }
  return null;
}

// Helper function to extract section title from HTML
function extractSectionTitle(text) {
  if (!text) return null;

  const h2Match = text.match(/<h2>(.*?)<\/h2>/);
  if (h2Match) {
    return h2Match[1].trim();
  }
  return null;
}

// Helper function to create Directus item
async function createDirectusItem(collection, data) {
  try {
    const response = await axios.post(
      `${DIRECTUS_URL}/items/${collection}`,
      data,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error(`Failed to create ${collection} item:`, error.message);
    return null;
  }
}

// Process section and create child documents and paragraphs
async function processSection(section, parentDocumentId) {
  const sectionHeading = section.heading;

  // Create a child document for this major section
  const sectionDocData = {
    title: sectionHeading,
    doc_type: "sefer", // Major sections are also sefarim
    parent_id: parentDocumentId, // Link to parent book document
    original_lang: "he",
    status: "draft",
    source_format: "chabad_library",
    metadata: {
      source: "chabad_library",
      section_type: "major_section",
      original_id: section.id
    }
  };

  const sectionDocument = await createDirectusItem('documents', sectionDocData);
  if (!sectionDocument) {
    console.error(`Failed to create section document: ${sectionHeading}`);
    return;
  }

  console.log(`Created section document: ${sectionHeading} (ID: ${sectionDocument.id})`);

  // Now process the children of this section as paragraphs
  if (section.children && Array.isArray(section.children)) {
    const orderCounter = { current: 0 }; // Reset order counter for chapters within this section
    for (const child of section.children) {
      await processChapterAsParagraph(child, sectionDocument.id, orderCounter);
    }
  }
}

// Process chapter/section as content block under a section document
async function processChapterAsParagraph(chapter, sectionDocumentId, orderCounter = { current: 0 }) {
  const chapterPath = chapter.heading;

  console.log(`DEBUG: Processing chapter "${chapterPath}" for section doc ${sectionDocumentId}`);
  console.log(`DEBUG: Chapter has text: ${!!chapter.text}, has notes: ${!!chapter.notes}`);

  if (chapter.text && chapter.notes) {
    // This is a leaf node with content - create a content block
    orderCounter.current += 1;
    const orderKey = generateOrderKey(orderCounter.current);
    const lang = detectLanguage(chapter.text);

    // Extract structural information from Chabad Library format
    const citationInfo = extractCitationInfo(chapter.heading, []);
    const sectionTitle = extractSectionTitle(chapter.text);

    console.log(`DEBUG: Creating content block - Order: ${orderKey}, Folio: ${citationInfo.page_number}, Lang: ${lang}`);

    const contentBlockData = {
      document_id: sectionDocumentId, // Link to the section document
      block_type: 'paragraph', // Default to paragraph, could be heading/section_break
      order_key: orderKey,
      content: chapter.text,
      page_number: citationInfo.page_number,
      chapter_number: citationInfo.chapter_number,
      halacha_number: citationInfo.halacha_number,
      daf_number: citationInfo.daf_number,
      section_number: citationInfo.section_number,
      citation_refs: citationInfo.citation_refs.length > 0 ? citationInfo.citation_refs : null,
      metadata: {
        source: 'chabad_library',
        path: chapterPath,
        original_id: chapter.id,
        section_title: sectionTitle,
        heading_type: 'folio_reference',
        folio_notation: citationInfo.page_number,
        chapter_type: 'chapter', // This is a chapter within a section
        original_lang: lang
      }
    };

    console.log(`DEBUG: Content block data prepared, calling API...`);

    const contentBlock = await createDirectusItem('content_blocks', contentBlockData);
    if (!contentBlock) {
      console.error(`FAILED to create content block: ${chapter.heading}`);
      return;
    }

    console.log(`SUCCESS: Created content block: ${chapter.heading} (${citationInfo.page_number}) (Order: ${orderKey}, ID: ${contentBlock.id})`);

    // Create multiple statements for this content block based on footnote segments
    const statementSegments = parseFootnotesIntoStatements(chapter.text, chapter.notes);
    console.log(`DEBUG: Creating ${statementSegments.length} statements from ${statementSegments.filter(s => s.appended_text).length} footnote segments`);

    let statementOrderCounter = 0;
    for (const segment of statementSegments) {
      statementOrderCounter++;
      const statementOrderKey = String(statementOrderCounter).padStart(3, '0');

      const statementData = {
        block_id: contentBlock.id, // CHANGED: block_id instead of paragraph_id
        order_key: statementOrderKey,
        original_lang: lang,
        text: segment.text,
        appended_text: segment.appended_text,
        status: 'draft',
        importance_score: segment.appended_text ? 1.0 : 0.5, // Higher score for statements with footnotes
        metadata: {
          source: 'chabad_library',
          auto_generated: true,
          page_number: citationInfo.page_number,
          folio_notation: citationInfo.page_number,
          section_title: sectionTitle,
          has_footnote: !!segment.appended_text,
          citation_references: segment.citation_references || [] // Store parsed citation data
        }
      };

      console.log(`DEBUG: Creating statement ${statementOrderKey}: "${segment.text.substring(0, 50)}..." (${segment.appended_text ? 'with footnote' : 'no footnote'})`);

      const statement = await createDirectusItem('statements', statementData);
      if (statement) {
        console.log(`SUCCESS: Created statement ${statementOrderKey} (ID: ${statement.id})`);
      } else {
        console.error(`FAILED to create statement ${statementOrderKey} for content block ${contentBlock.id}`);
      }
    }
  } else if (chapter.children && Array.isArray(chapter.children)) {
    // This has children - process recursively (for deeper nesting)
    console.log(`DEBUG: Chapter has ${chapter.children.length} children, processing recursively`);
    for (const child of chapter.children) {
      await processChapterAsParagraph(child, sectionDocumentId, orderCounter);
    }
  } else {
    console.log(`DEBUG: Chapter "${chapterPath}" has neither text/notes nor children - SKIPPING`);
  }
}

// Main population function
async function populateChabadBook(bookId, bookTitle) {
  try {
    console.log(`Starting population using JSON file for book ID ${bookId}...`);
    
    // TEMPORARY: Load from existing JSON file instead of scraping
    const fs = require('fs');
    const path = require('path');
    const jsonPath = `/Users/yitzchok/Documents/Directus/chabad-research/data/book-${bookId}.json`;
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`JSON file not found: ${jsonPath}`);
      return;
    }
    
    const bookData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('Loaded book data from JSON file, starting Directus population...');

    // Create the main book document
    const mainDocumentData = {
      title: bookTitle,
      doc_type: "sefer", // Main book document
      original_lang: "he",
      status: "draft",
      source_format: "chabad_library",
      metadata: {
        source: "chabad_library",
        scraped_id: bookId,
        document_type: "main_book",
        full_book_population: true
      }
    };

    const mainDocument = await createDirectusItem('documents', mainDocumentData);
    if (!mainDocument) {
      console.error('Failed to create main document');
      return;
    }

    console.log(`Created main document: ${mainDocument.title} (ID: ${mainDocument.id})`);

    // Process all sections
    const sectionKeys = Object.keys(bookData);
    console.log(`Available sections: ${sectionKeys.join(', ')}`);
    console.log(`\n📚 Processing all ${sectionKeys.length} sections with all chapters`);
    
    let totalSections = 0;
    let totalChapters = 0;
    
    for (const sectionKey of sectionKeys) {
      const sectionData = bookData[sectionKey];
      await processSection(sectionData, mainDocument.id);
      totalSections++;
      
      // Count chapters in this section
      if (sectionData.children && Array.isArray(sectionData.children)) {
        totalChapters += sectionData.children.length;
      }
    }

    console.log('\n🎯 Population completed!');
    console.log(`Created hierarchical structure: ${bookTitle} > ${totalSections} sections > ${totalChapters} chapters > content blocks > statements`);
    console.log(`Total documents created: 1 main + ${totalSections} sections = ${totalSections + 1} documents`);
    console.log(`Citation fields populated: page_number, chapter_number, halacha_number, section_number, citation_refs`);
    
  } catch (error) {
    console.error('Error populating book:', error);
  }
}

// Usage: node populate_chabad_book.js <book_id> "<book_title>"
if (require.main === module) {
  const bookId = process.argv[2];
  const bookTitle = process.argv[3] || 'Chabad Library Book';

  if (!bookId) {
    console.error('Usage: node populate_chabad_book.js <book_id> "<book_title>"');
    process.exit(1);
  }

  populateChabadBook(parseInt(bookId), bookTitle);
}

module.exports = { populateChabadBook };
