// Script to populate Chabad Library book data to Directus
const axios = require('axios');
const fs = require('fs');

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const TOKEN = 'ChassidusWikiAdminToken2025';

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

// Recursive function to process book structure and create paragraphs
async function processSection(section, documentId, parentPath = '') {
  const currentPath = parentPath ? `${parentPath} > ${section.heading}` : section.heading;

  if (section.text && section.notes) {
    // This is a leaf node with content - create a paragraph
    const paragraphData = {
      document_id: documentId,
      text: section.text,
      notes: section.notes,
      reference: section.heading,
      metadata: {
        source: 'chabad_library',
        path: currentPath,
        original_id: section.id
      }
    };

    const paragraph = await createDirectusItem('paragraphs', paragraphData);
    if (paragraph) {
      console.log(`Created paragraph: ${section.heading} (ID: ${paragraph.id})`);
    }
  } else if (section.children && Array.isArray(section.children)) {
    // This has children - process recursively
    for (const child of section.children) {
      await processSection(child, documentId, currentPath);
    }
  }
}

// Main population function
async function populateChabadBook(jsonFilePath, bookTitle) {
  try {
    // Read the JSON file
    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const bookData = JSON.parse(rawData);

    // Create the document
    const documentData = {
      title: bookTitle,
      doc_type: "sefer",
      original_lang: "he",
      status: "draft",
      source_format: "chabad_library",
      metadata: {
        source: "chabad_library",
        scraped_id: Object.keys(bookData)[0] // Use first key as ID
      }
    };

    const document = await createDirectusItem('documents', documentData);
    if (!document) {
      console.error('Failed to create document');
      return;
    }

    console.log(`Created document: ${document.title} (ID: ${document.id})`);

    // Process each top-level section
    for (const [sectionKey, sectionData] of Object.entries(bookData)) {
      console.log(`Processing section: ${sectionKey}`);
      await processSection(sectionData, document.id);
    }

    console.log('Book population completed!');
  } catch (error) {
    console.error('Error populating book:', error);
  }
}

// Usage: node populate_chabad_book.js <json_file> <book_title>
if (require.main === module) {
  const jsonFile = process.argv[2] || 'data/book-2800000000.json';
  const bookTitle = process.argv[3] || 'Chabad Library Book';

  if (!fs.existsSync(jsonFile)) {
    console.error(`JSON file not found: ${jsonFile}`);
    process.exit(1);
  }

  populateChabadBook(jsonFile, bookTitle);
}

module.exports = { populateChabadBook };
