# Smart Content Editing System

A comprehensive workflow for editing text content while maintaining proper database relationships and version control.

## Overview

The Smart Content Editing System provides a guided workflow for editing text content that automatically maintains the complex database relationships required for the Chabad Research platform.

## Database Structure

The system maintains this hierarchical structure:

```
documents (main content)
├── paragraphs (text sections)
│   └── statements (logical claims/assertions)
│       ├── statement_topics (topic mappings)
│       └── source_links (citations/references)
└── document_versions (version control)
```

## Key Features

### 1. Structured Editing Workflow
- **Paragraph Selection**: Choose which paragraph to edit
- **Rich Text Editing**: Use TipTap editor with Hebrew OCR support
- **Version Control**: Automatic versioning of all changes
- **Relationship Preservation**: Maintains all database relationships

### 2. AI-Powered Statement Breaking
- **Automatic Splitting**: Use AI to break paragraphs into logical statements
- **Database Integration**: Creates proper statement records with foreign keys
- **Metadata Generation**: Adds confidence scores and processing info

### 3. Topic and Citation Management
- **Topic Linking**: Connect statements to relevant topics via junction table
- **Citation Tracking**: Manage source references with relationship types
- **Relevance Scoring**: Assign confidence levels to topic mappings

### 4. Version Control & Audit
- **Document Versions**: Track changes to entire documents
- **Paragraph Versions**: Version control for individual paragraphs
- **Statement Versions**: Track statement text changes
- **Audit Trail**: Complete change history with user tracking

## Usage

### Basic Editing Workflow

1. **Select Content**: Choose a paragraph from the document structure
2. **Edit Text**: Use the TipTap editor to modify content
3. **Break Statements**: Use AI to split into logical statements
4. **Link Topics**: Connect statements to relevant topics
5. **Add Citations**: Reference source materials
6. **Review Structure**: Verify all relationships are correct
7. **Publish**: Save with version control

### API Integration

```typescript
// Update paragraph content
await fetch('/api/editor/smart', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update_paragraph',
    documentId: 'doc-id',
    paragraphId: 'para-id',
    content: 'new content'
  })
});

// Break paragraph into statements
await fetch('/api/editor/smart', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create_statements',
    paragraphId: 'para-id'
  })
});

// Link statement to topics
await fetch('/api/editor/smart', {
  method: 'POST',
  body: JSON.stringify({
    action: 'link_topics',
    statementId: 'stmt-id',
    topics: [{ id: 'topic-id', relevance_score: 0.8 }]
  })
});
```

## Components

### SmartEditor
Main editing interface with tabbed views:
- **Edit Content**: Rich text editing with TipTap
- **Data Structure**: Visual representation of relationships
- **Preview**: Full document preview

### EditingWorkflow
Guided step-by-step editing process:
- Progress tracking
- Step validation
- Automatic relationship management

### TipTap Extensions
Custom extensions for Hebrew content:
- **Hebrew Language**: RTL support and proper font rendering
- **Hebrew OCR**: Image paste processing with OCR
- **Advanced Citations**: Rich citation management

## Data Integrity

### Foreign Key Constraints
- `paragraphs.doc_id` → `documents.id`
- `statements.paragraph_id` → `paragraphs.id`
- `statement_topics.statement_id` → `statements.id`
- `statement_topics.topic_id` → `topics.id`
- `source_links.statement_id` → `statements.id`
- `source_links.source_id` → `sources.id`

### Version Control
All changes are versioned:
- Document-level changes
- Paragraph content updates
- Statement text modifications
- Relationship changes

### Audit Logging
All operations are logged with:
- User identification
- Timestamp
- Change type
- Before/after values

## Best Practices

### Content Editing
1. Always select a paragraph before editing
2. Use the "Break into Statements" feature for new content
3. Link topics immediately after statement creation
4. Add citations for source verification
5. Review the data structure before publishing

### Database Management
1. Let the system handle foreign key relationships
2. Use the workflow to ensure data integrity
3. Review audit logs for change tracking
4. Export/import data using provided scripts

### Performance
1. Edit one paragraph at a time
2. Use batch operations for multiple items
3. Monitor version history growth
4. Clean up old versions periodically

## Demo

Visit `/smart-edit` to experience the full workflow with a demo document.

## Integration Points

### Directus Collections
- `documents`, `paragraphs`, `statements`
- `topics`, `statement_topics`
- `sources`, `source_links`
- `document_versions`, `paragraph_versions`, `statement_versions`
- `audit_log`

### API Endpoints
- `/api/editor/smart` - Main editing API
- `/api/statements/break` - AI statement breaking
- `/api/topics/tag` - Topic tagging
- `/api/citations/detect` - Citation detection

### External Services
- OpenRouter (AI processing)
- Directus MCP Bridge
- Tesseract.js (OCR fallback)
- hebocr library (Hebrew OCR)

## Troubleshooting

### Common Issues
- **Version conflicts**: Check document locks
- **Foreign key errors**: Ensure parent records exist
- **OCR failures**: Check image quality and format
- **Topic linking**: Verify topic exists in database

### Recovery
- Use version history to rollback changes
- Check audit logs for change tracking
- Re-run statement breaking if needed
- Manually fix relationship issues via Directus admin

## Future Enhancements

- Real-time collaborative editing
- Advanced AI topic suggestion
- Bulk editing operations
- Content approval workflows
- Advanced search and filtering
