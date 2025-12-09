// Script to populate Tanya data with INTEGER primary keys (auto-increment)
const axios = require('axios');

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const TOKEN = 'ChassidusWikiAdminToken2025';

// Helper function to get text from Sefaria
async function getSefariaChapter(chapterNum) {
  try {
    const ref = `Tanya,_Part_I;_Likkutei_Amarim.${chapterNum}`;
    const response = await axios.get(`https://www.sefaria.org/api/texts/${ref}?context=0`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get chapter ${chapterNum}:`, error.message);
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
    metadata: { source: "sefaria", api_ref: "Tanya,_Part_I;_Likkutei_Amarim" }
  };
  
  const document = await createDirectusItem('documents', documentData);
  if (!document) {
    console.error('Failed to create document');
    return;
  }
  
  console.log(`Created document: ${document.title} (ID: ${document.id})`);
  
  // Tanya Likutei Amarim has 53 chapters
  for (let chapter = 1; chapter <= 53; chapter++) {
    console.log(`Processing chapter ${chapter}...`);
    
    const chapterData = await getSefariaChapter(chapter);
    if (!chapterData || chapterData.error) {
      console.log(`Skipping chapter ${chapter} - no data found`);
      continue;
    }
    
    // Create paragraph records for this chapter
    if (chapterData.he && chapterData.text) {
      const numParagraphs = Math.min(chapterData.he.length, chapterData.text.length);
      
      for (let para = 0; para < numParagraphs; para++) {
        // Create paragraph - doc_id is now integer
        const paragraphData = {
          order_key: `tanya_1_${chapter}_${para + 1}`,
          original_lang: 'he',
          text: chapterData.he[para],
          status: 'draft',
          doc_id: document.id, // Integer ID from Directus auto-increment
          page_number: chapter,
          metadata: { 
            sefaria_ref: `Tanya,_Part_I;_Likkutei_Amarim.${chapter}.${para + 1}`,
            chapter: chapter,
            paragraph: para + 1
          }
        };
        
        const paragraph = await createDirectusItem('paragraphs', paragraphData);
        if (paragraph) {
          console.log(`Created paragraph ${chapter}.${para + 1} (ID: ${paragraph.id})`);
          
          // Create statement for this paragraph - paragraph_id is now integer
          const statementData = {
            order_key: `tanya_1_${chapter}_${para + 1}_a`,
            original_lang: 'he',
            text: chapterData.he[para],
            status: 'draft',
            importance_score: 0.5,
            is_disputed: false,
            paragraph_id: paragraph.id, // Integer ID
            metadata: { 
              has_english: !!chapterData.text[para],
              sefaria_ref: `Tanya,_Part_I;_Likkutei_Amarim.${chapter}.${para + 1}`
            }
          };
          
          const statement = await createDirectusItem('statements', statementData);
          if (statement) {
            console.log(`Created statement ${chapter}.${para + 1} (ID: ${statement.id})`);
            
            // Create English translation if available - entity_id is now integer
            if (chapterData.text[para]) {
              const translationData = {
                entity_type: 'statement',
                entity_id: statement.id, // Integer ID
                field_name: 'text',
                target_lang: 'en',
                translated_text: chapterData.text[para],
                translation_quality: 'machine',
                metadata: { source: 'sefaria' }
              };
              
              await createDirectusItem('translations', translationData);
            }
          }
        }
      }
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('Tanya population complete!');
}

// Run the script
populateTanya().catch(console.error);
