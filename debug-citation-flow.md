# Citation Flow Debug

## Current Flow

1. **EliteCitationModal.handleInsert()** calls `onInsert` with citation data
2. **EditorProvider.insertCitation()** calls `editor.commands.insertCitation()` 
3. **CitationExtension.insertCitation()** creates TipTap node with data attributes
4. **TipTap Editor** stores as HTML: `<span class="citation-ref" data-source-id="218" data-source-title="Tanya (Likkutei Amarim)">[Tanya (Likkutei Amarim)]</span>`
5. **Topic Update** saves HTML to Directus `topics.description` field
6. **Citation Extraction** parses HTML and creates `source_links` records

## Potential Issues

### 1. Citation Data Format
The EliteCitationModal sends:
```js
{
  sourceId: 218,           // ✅ Number
  sourceTitle: "Tanya (Likkutei Amarim)", // ✅ String
  reference: "",            // ❌ Empty - might cause issues
  quote: undefined,        // ✅ Undefined is fine
  note: undefined,         // ✅ Undefined is fine
  url: "https://..."       // ✅ String
}
```

### 2. TipTap Node Creation
The CitationExtension creates nodes with all the data attributes, but we need to verify the HTML output.

### 3. Citation Extraction
The `extractCitationReferences()` function looks for:
- `span.citation-ref`
- `span[data-citation-id]` 
- `span[data-type="citation"]`

And extracts:
- `data-source-id` → sourceId
- `data-source-title` → sourceTitle
- etc.

### 4. Source Link Creation
The extraction creates `source_links` records with:
- `source_id` (from citation.sourceId)
- `topic_id` (from API call)
- `citation_id` (from citation.id)
- etc.

## Debug Steps

1. Check actual HTML output from TipTap editor
2. Verify citation extraction is finding the spans
3. Check if source_links are being created
4. Verify source_id is valid number
