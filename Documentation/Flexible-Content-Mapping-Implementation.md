# Flexible Content Mapping System - Implementation Documentation

## Overview
Implemented a comprehensive flexible content mapping system for the entry ingestion API that allows users to specify how different types of content should be processed and mapped to the database. This prevents schema violations and provides intelligent content routing.

## Implementation Date
December 11, 2025

## Changes Made

### 1. API Changes (`/app/api/ingest/entries/route.ts`)

#### New Frontmatter Fields
```typescript
interface EntryFrontmatter {
  // Existing fields...
  content_type?: 'bio' | 'article' | 'reference' | 'metadata' | 'topic_description';
  target_entity?: 'topic' | 'document' | 'statement';
  target_id?: string;
  mapping_rules?: Record<string, string>;
}
```

#### New Content Processing Functions
- `processFlexibleContent()` - Main dispatcher for content types
- `processBioContent()` - Creates topic records with biographies
- `processTopicDescriptionContent()` - Updates existing topic descriptions
- `processReferenceContent()` - Creates single statement references
- `processMetadataContent()` - Updates existing records with custom mapping
- `processArticleContent()` - Default full document processing

#### New Utility Functions
- `validateFrontmatterForContentType()` - Content-type specific validation
- `getEntityPlural()` - Type-safe entity name mapping

#### Import Changes
```typescript
import { createItem, updateItem } from '@directus/sdk';
```

### 2. UI Changes (`/components/editor/EntryImportModal.tsx`)

#### Updated File Description
Changed from generic YAML frontmatter description to flexible content mapping description.

#### New Format Requirements Section
- Shows all 5 content types with examples
- Provides frontmatter templates for each type
- Includes validation requirements

### 3. API Documentation Updates

#### Enhanced GET Endpoint
- Documents all content types with descriptions
- Shows required/optional fields per type
- Provides example frontmatter for each type
- Includes flexible mapping fields documentation

## Content Types Supported

### 1. Article (Default)
**Purpose**: Full documents with paragraphs and statements
**Required Fields**: slug, name, category, difficulty, status
**Database Action**: Creates documents → content_blocks → statements

### 2. Bio
**Purpose**: Short biographies for topics
**Required Fields**: name
**Database Action**: Creates/updates topics with description field

### 3. Topic Description
**Purpose**: Update existing topic descriptions
**Required Fields**: name, target_id
**Database Action**: Updates existing topic's description field

### 4. Reference
**Purpose**: Single citations or statements
**Required Fields**: name
**Database Action**: Creates minimal document with single statement

### 5. Metadata
**Purpose**: Update existing records with custom field mapping
**Required Fields**: target_entity, target_id
**Database Action**: Updates specified entity using mapping_rules

## Database Implications

### Current Schema Compatibility
- Uses existing collections: documents, paragraphs, statements, topics, content_blocks
- Leverages metadata fields for tracking import source and user
- Maintains referential integrity through proper ID relationships

### Potential Future Changes Needed
1. **Enhanced Topic Model**: May need additional fields for biography-specific metadata
2. **Citation Tracking**: Reference content may need dedicated citation fields
3. **Import History**: Consider adding import_history table for audit trails
4. **Content Versioning**: May need versioning for updates to existing content

## Editor UI Considerations

### Current State
- EntryImportModal shows all content type options
- Basic form validation
- File upload with progress indication
- Success/error feedback

### Potential Improvements Needed
1. **Advanced Validation**: Real-time frontmatter validation
2. **Preview Mode**: Show how content will be mapped before upload
3. **Bulk Upload**: Support multiple files with different content types
4. **Template Library**: Pre-built frontmatter templates for common use cases
5. **Import History**: Track and display previous imports
6. **Conflict Resolution**: Handle duplicate content intelligently

## API Endpoints Impact

### Modified Endpoints
- `POST /api/ingest/entries` - Now supports flexible content mapping
- `GET /api/ingest/entries` - Enhanced documentation

### Backward Compatibility
- Existing article uploads continue to work (content_type defaults to 'article')
- All existing frontmatter fields still supported
- No breaking changes to current workflows

## Testing Considerations

### Content Type Testing
- [ ] Bio creation with new topic
- [ ] Bio update to existing topic
- [ ] Topic description updates
- [ ] Reference content creation
- [ ] Metadata-only updates
- [ ] Article processing (existing functionality)

### Error Handling Testing
- [ ] Invalid content_type values
- [ ] Missing required fields per content type
- [ ] Invalid target_id references
- [ ] Permission validation for updates

## Future Planning

### Phase 2 Enhancements
1. **Content Validation Service**: Pre-upload validation of frontmatter and content
2. **Smart Content Detection**: Auto-detect content type from content analysis
3. **Template System**: User-created templates for common content patterns
4. **Batch Processing**: Support for bulk imports with mixed content types

### Phase 3 Enhancements
1. **Content Relationships**: Link related content across different types
2. **Import Workflows**: Multi-step import processes for complex content
3. **Content Review**: Editor workflows for imported content
4. **Analytics**: Track import patterns and content type usage

### Potential Backend Changes
1. **Database Schema**: May need content_type table for better organization
2. **Import Queue**: Background processing for large imports
3. **Content Validation**: Server-side validation rules per content type
4. **Audit Logging**: Comprehensive import history and change tracking

## Migration Notes

### For Existing Content
- No migration needed - existing article imports continue to work
- Can gradually adopt new content types as needed

### For New Features
- Frontend can be updated incrementally to support new content types
- Backend validation can be enhanced without breaking existing functionality

## Files Modified
- `/app/api/ingest/entries/route.ts` - Core API implementation
- `/components/editor/EntryImportModal.tsx` - UI updates
- Documentation created: This file

## Files Created
- This documentation file

---

*This documentation serves as a foundation for planning future enhancements and ensuring the flexible mapping system can evolve with changing requirements.*
