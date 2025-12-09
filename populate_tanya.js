// Script to populate Tanya data from Sefaria API to Directus
const axios = require('axios');

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const TOKEN = 'ChassidusWikiAdminToken2025';
const SEFARIA_BASE = 'https://www.sefaria.org/api';

// Helper function to get text from Sefaria
async function getSefariaText(ref) {
  try {
    const response = await axios.get(`${SEFARIA_BASE}/texts/${ref}?context=0`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get ${ref}:`, error.message);
    return null;
  }
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

// Main population function
async function populateTanya() {
  // First, ensure we have the Tanya document
  const documentData = {
    title: "Tanya - Likutei Amarim",
    doc_type: "sefer",
    original_lang: "he",
    status: "draft",
    source_format: "external_api",
    metadata: { source: "sefaria" }
  };
  
  const document = await createDirectusItem('documents', documentData);
  if (!document) return;
  
  console.log(`Created document: ${document.title} (ID: ${document.id})`);
  
  // Now populate chapters (Pereks) - Tanya has 53 chapters
  for (let chapter = 1; chapter <= 53; chapter++) {
    console.log(`Processing chapter ${chapter}...`);
    
    // Try different reference formats for Sefaria
    const refs = [
      `Likutei_Amarim.${chapter}`,
      `Tanya,_Likutei_Amarim.${chapter}`,
      `Likutei_Amarim_${chapter}`
    ];
    
    let chapterData = null;
    for (const ref of refs) {
      chapterData = await getSefariaText(ref);
      if (chapterData && !chapterData.error) break;
    }
    
    if (!chapterData || chapterData.error) {
      console.log(`Skipping chapter ${chapter} - no data found`);
      continue;
    }
    
    // Create paragraph records for this chapter
    if (chapterData.he && chapterData.text) {
      const paragraphs = Math.min(chapterData.he.length, chapterData.text.length);
      
      for (let para = 0; para < paragraphs; para++) {
        const paragraphData = {
          order_key: `tanya_1_${chapter}_${para + 1}`,
          original_lang: 'he',
          text: chapterData.he[para],
          status: 'draft',
          doc_id: document.id
        };
        
        const paragraph = await createDirectusItem('paragraphs', paragraphData);
        if (paragraph) {
          console.log(`Created paragraph ${chapter}.${para + 1}`);
          
          // Create statement for this paragraph
          const statementData = {
            order_key: `tanya_1_${chapter}_${para + 1}_a`,
            original_lang: 'he',
            text: chapterData.he[para],
            status: 'draft',
            paragraph_id: paragraph.id
          };
          
          await createDirectusItem('statements', statementData);
        }
      }
    }
  }
  
  console.log('Tanya population complete!');
}

// Run the script
populateTanya().catch(console.error);
