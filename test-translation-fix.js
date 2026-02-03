// Test script to check translation API fix
console.log('Testing translation API fix...');

// Test creating a new translation with a non-title field
const testUpsert = {
  topicId: 165, // Binah topic
  language: 'he', // Hebrew
  field: 'description', // Not the title field
  value: '<p>זהו תרגום חדש של תיאור</p>' // Hebrew description
};

console.log('Testing translation upsert:', testUpsert);

fetch('http://localhost:3001/api/topics/translations', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testUpsert)
})
.then(response => response.json())
.then(data => {
  console.log('Translation upsert response:', data);
})
.catch(error => {
  console.error('Translation upsert error:', error);
});
