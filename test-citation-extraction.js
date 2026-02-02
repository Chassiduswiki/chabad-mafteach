// Test script to check citation extraction
const testHtml = `
<p>This is some content with a citation.</p>
<p>Here is a citation: <span class="citation-ref" data-type="citation" data-citation-id="cite_test123" data-source-id="218" data-source-title="Tanya (Likkutei Amarim)" data-reference="">[Tanya (Likkutei Amarim)]</span></p>
<p>Another citation: <span class="citation-ref" data-type="citation" data-citation-id="cite_test456" data-source-id="256" data-source-title="Likkutei Sichos" data-reference="">[Likkutei Sichos]</span></p>
`;

console.log('Testing citation extraction...');
console.log('HTML:', testHtml);

fetch('http://localhost:3001/api/citations/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: testHtml,
    topicId: 165 // Use real topic ID (Binah)
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
