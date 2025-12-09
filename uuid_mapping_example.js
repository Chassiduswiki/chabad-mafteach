// Example of how to handle integer ID to UUID mapping
// when you have existing Directus data and want to link to Sefaria content

const existingMappings = {
  // If you have existing authors/sources with integer IDs from another system
  authors: {
    1: "uuid-of-rabbi-shneur-zalman", // Map integer ID to Directus UUID
    2: "uuid-of-another-author"
  },
  sources: {
    1: "uuid-of-existing-source"
  }
};

// When creating new records that reference existing ones:
async function createDocumentWithExistingSource() {
  const documentData = {
    title: "Tanya - Likutei Amarim",
    doc_type: "sefer",
    // If you had an integer source_id from another system:
    // source_id: existingMappings.sources[1], // Maps to UUID
    metadata: { 
      original_source_id: 1, // Keep track of original integer ID
      mapped_to_uuid: existingMappings.sources[1]
    }
  };
  
  return await createDirectusItem('documents', documentData);
}

// For bulk operations with CSV data that has integer foreign keys:
function mapCsvRowToDirectus(row) {
  return {
    ...row,
    author_id: existingMappings.authors[row.author_id] || null,
    source_id: existingMappings.sources[row.source_id] || null,
    // Convert any other integer foreign keys to UUIDs
  };
}
