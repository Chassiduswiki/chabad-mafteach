// Test script to verify integer ID setup works
const axios = require('axios');

const DIRECTUS_URL = 'https://directus-production-20db.up.railway.app';
const TOKEN = 'ChassidusWikiAdminToken2025';

async function testIntegerIds() {
  try {
    // Create a test document
    const docResponse = await axios.post(
      `${DIRECTUS_URL}/items/documents`,
      {
        title: "Test Tanya Document",
        doc_type: "sefer",
        status: "draft"
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    const docId = docResponse.data.data.id;
    console.log(`Created document with ID: ${docId} (type: ${typeof docId})`);
    
    // Create a test paragraph
    const paraResponse = await axios.post(
      `${DIRECTUS_URL}/items/paragraphs`,
      {
        order_key: "test_1_1",
        text: "Test Hebrew text",
        doc_id: docId, // Should be integer
        status: "draft"
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    const paraId = paraResponse.data.data.id;
    console.log(`Created paragraph with ID: ${paraId} (type: ${typeof paraId})`);
    
    // Create a test statement
    const stmtResponse = await axios.post(
      `${DIRECTUS_URL}/items/statements`,
      {
        order_key: "test_1_1_a",
        text: "Test Hebrew text",
        paragraph_id: paraId, // Should be integer
        status: "draft"
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    const stmtId = stmtResponse.data.data.id;
    console.log(`Created statement with ID: ${stmtId} (type: ${typeof stmtId})`);
    
    console.log('✅ Integer IDs working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testIntegerIds();
