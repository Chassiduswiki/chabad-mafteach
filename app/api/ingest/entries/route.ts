import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, updateItem } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';

const directus = createClient();

interface EntryFrontmatter {
  slug: string;
  name: string;
  name_hebrew?: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published';
  last_updated: string;
  tags?: string[];
  // New flexible mapping fields
  content_type?: 'bio' | 'article' | 'reference' | 'metadata' | 'topic_description';
  target_entity?: 'topic' | 'document' | 'statement';
  target_id?: string;
  mapping_rules?: Record<string, string>;
}

interface ParsedEntry {
  frontmatter: EntryFrontmatter;
  content: string;
  title: string;
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): ParsedEntry {
  const frontmatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid frontmatter format');
  }

  const [, frontmatterStr, contentStr] = match;

  // Parse YAML frontmatter
  const frontmatter: EntryFrontmatter = {
    slug: '',
    name: '',
    category: '',
    difficulty: 'Beginner',
    status: 'Draft',
    last_updated: new Date().toISOString().split('T')[0]
  };

  const lines = frontmatterStr.split(/\r?\n/); // Handle both \n and \r\n
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    if (!key || !value) continue;

    switch (key.trim()) {
      case 'slug':
        frontmatter.slug = value.replace(/['"]/g, '');
        break;
      case 'name':
        frontmatter.name = value.replace(/['"]/g, '');
        break;
      case 'name_hebrew':
        frontmatter.name_hebrew = value.replace(/['"]/g, '');
        break;
      case 'category':
        frontmatter.category = value.replace(/['"]/g, '');
        break;
      case 'difficulty':
        frontmatter.difficulty = value as EntryFrontmatter['difficulty'];
        break;
      case 'status':
        frontmatter.status = value as EntryFrontmatter['status'];
        break;
      case 'last_updated':
        frontmatter.last_updated = value.replace(/['"]/g, '');
        break;
      case 'tags':
        // Parse array format like [tag1, tag2, tag3]
        const tagsMatch = value.match(/^\[(.+)\]$/);
        if (tagsMatch) {
          frontmatter.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
        }
        break;
    }
  }

  // Extract title from first heading
  const titleMatch = contentStr.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : frontmatter.name;

  return {
    frontmatter,
    content: contentStr.trim(),
    title
  };
}

/**
 * Process markdown content into structured paragraphs
 */
function processMarkdownContent(markdown: string): string[] {
  // Split by double line breaks and headings to create logical paragraphs
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0)
    .map(p => p.trim());

  // Group related content and clean up
  const processedParagraphs: string[] = [];
  let currentParagraph = '';

  for (const para of paragraphs) {
    // If it's a heading or list item, start a new paragraph
    if (para.match(/^#{1,6}\s/) || para.match(/^[-*+]\s/) || para.match(/^\d+\.\s/)) {
      if (currentParagraph) {
        processedParagraphs.push(currentParagraph.trim());
      }
      currentParagraph = para;
    } else {
      // Continue current paragraph
      currentParagraph += (currentParagraph ? '\n\n' : '') + para;
    }
  }

  if (currentParagraph) {
    processedParagraphs.push(currentParagraph.trim());
  }

  return processedParagraphs.filter(p => p.length > 0);
}

/**
 * Create statements from paragraph content
 */
function createStatementsFromParagraph(paragraphText: string): string[] {
  // For now, split on sentence endings and filter out very short fragments
  const sentences = paragraphText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.match(/^[A-Z\s]+$/)); // Filter out headers and short fragments

  return sentences.filter(s => s.length > 0);
}

/**
 * Process content based on flexible mapping rules
 */
async function processFlexibleContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  const contentType = frontmatter.content_type || 'article';

  switch (contentType) {
    case 'bio':
      return await processBioContent(frontmatter, content, context);

    case 'topic_description':
      return await processTopicDescriptionContent(frontmatter, content, context);

    case 'reference':
      return await processReferenceContent(frontmatter, content, context);

    case 'metadata':
      return await processMetadataContent(frontmatter, content, context);

    case 'article':
    default:
      return await processArticleContent(frontmatter, content, context);
  }
}

/**
 * Process bio content - short descriptions for topics
 */
async function processBioContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  // Find or create topic
  let topic;
  if (frontmatter.target_id) {
    // Update existing topic
    topic = { id: frontmatter.target_id };
  } else {
    // Create new topic
    topic = await directus.request(createItem('topics', {
      canonical_title: frontmatter.name,
      slug: frontmatter.slug || frontmatter.name.toLowerCase().replace(/\s+/g, '-'),
      topic_type: 'person', // Default for bios
      description: content.trim(),
      original_lang: 'en',
      metadata: {
        imported_at: new Date().toISOString(),
        imported_by: context.userId,
        source: 'bio_import'
      }
    }));
  }

  return {
    success: true,
    message: `Bio content added to topic: ${topic.canonical_title || frontmatter.name}`,
    data: { topic_id: topic.id, content_type: 'bio' }
  };
}

/**
 * Process topic description content
 */
async function processTopicDescriptionContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!frontmatter.target_id) {
    throw new Error('target_id required for topic_description content type');
  }

    // Update existing topic's description
  const updatedTopic = await directus.request(updateItem('topics', frontmatter.target_id, {
    description: content.trim(),
    metadata: {
      description_updated_at: new Date().toISOString(),
      description_updated_by: context.userId
    }
  }));

  return {
    success: true,
    message: `Topic description updated`,
    data: { topic_id: frontmatter.target_id, content_type: 'topic_description' }
  };
}

/**
 * Process reference content - single statement with citation
 */
async function processReferenceContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  // Create a minimal document for the reference
  const document = await directus.request(createItem('documents', {
    title: frontmatter.name,
    doc_type: 'entry',
    status: 'published',
    source_format: 'manual_entry',
    metadata: {
      reference_type: 'citation',
      imported_at: new Date().toISOString(),
      imported_by: context.userId
    }
  }));

  // Create single paragraph
  const paragraph = await directus.request(createItem('paragraphs', {
    doc_id: document.id,
    order_key: '0',
    text: content.trim(),
    metadata: {
      source: 'reference_import'
    }
  }));

  // Create single statement
  const statement = await directus.request(createItem('statements', {
    block_id: paragraph.id,
    order_key: '0',
    text: content.trim(),
    status: 'published',
    metadata: {
      reference: true,
      imported_by: context.userId
    }
  }));

  return {
    success: true,
    message: `Reference content added as statement`,
    data: {
      document_id: document.id,
      statement_id: statement.id,
      content_type: 'reference'
    }
  };
}

/**
 * Map singular entity names to plural for Directus API
 */
function getEntityPlural(entity: 'topic' | 'document' | 'statement'): string {
  const mapping = {
    topic: 'topics',
    document: 'documents',
    statement: 'statements'
  };
  return mapping[entity];
}

/**
 * Process metadata-only content - update existing records
 */
async function processMetadataContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!frontmatter.target_entity || !frontmatter.target_id) {
    throw new Error('target_entity and target_id required for metadata content type');
  }

  // Apply mapping rules to update existing record
  const mappingRules = frontmatter.mapping_rules || {};
  const updateData: any = {};

  // Map frontmatter fields according to rules
  Object.entries(mappingRules).forEach(([sourceField, targetField]) => {
    if (frontmatter[sourceField as keyof EntryFrontmatter]) {
      updateData[targetField] = frontmatter[sourceField as keyof EntryFrontmatter];
    }
  });

  // Update the target entity
  const entityPlural = getEntityPlural(frontmatter.target_entity);
  const updatedRecord = await directus.request(updateItem(entityPlural as any, frontmatter.target_id, {
    ...updateData,
    metadata: {
      metadata_updated_at: new Date().toISOString(),
      metadata_updated_by: context.userId
    }
  }));

  return {
    success: true,
    message: `Metadata updated for ${frontmatter.target_entity}`,
    data: {
      entity_type: frontmatter.target_entity,
      entity_id: frontmatter.target_id,
      content_type: 'metadata'
    }
  };
}

/**
 * Process article content - default full document processing
 */
async function processArticleContent(
  frontmatter: EntryFrontmatter,
  content: string,
  context: any
): Promise<{ success: boolean; message: string; data?: any }> {
  // This is the existing article processing logic
  const statusMap: Record<string, 'draft' | 'reviewed' | 'published' | 'archived'> = {
    'draft': 'draft',
    'published': 'published',
    'reviewed': 'reviewed',
    'archived': 'archived'
  };

  const normalizedStatus = statusMap[frontmatter.status.toLowerCase()] || 'draft';

  // Create the document
  const document = await directus.request(createItem('documents', {
    title: frontmatter.name,
    doc_type: 'entry',
    original_lang: 'en',
    status: normalizedStatus,
    source_format: 'manual_entry',
    metadata: {
      slug: frontmatter.slug,
      name_hebrew: frontmatter.name_hebrew,
      category: frontmatter.category,
      difficulty: frontmatter.difficulty.toLowerCase(),
      tags: frontmatter.tags || [],
      last_updated: frontmatter.last_updated,
      source: 'flexible_import',
      imported_at: new Date().toISOString(),
      imported_by: context.userId,
      filename: 'flexible_import'
    }
  }));

  console.log(`Created document: ${document.id} (${frontmatter.name})`);

  // Process content into content blocks
  const contentBlocks = processMarkdownContent(content);
  let contentBlockOrder = 0;
  let totalStatements = 0;

  for (const blockContent of contentBlocks) {
    // Create content block
    const contentBlock = await directus.request(createItem('content_blocks', {
      document_id: document.id,
      order_key: String(contentBlockOrder++).padStart(3, '0'),
      content: blockContent,
      block_type: 'paragraph',
      metadata: {
        source: 'flexible_import',
        imported_by: context.userId
      }
    }));

    // Create statements from content block content
    const statements = createStatementsFromParagraph(blockContent);
    let statementOrder = 0;

    for (const statementText of statements) {
      await directus.request(createItem('statements', {
        block_id: contentBlock.id,
        order_key: String(statementOrder++),
        text: statementText,
        status: 'published',
        metadata: {
          source: 'flexible_import',
          auto_generated: true,
          imported_by: context.userId
        }
      }));
      totalStatements++;
    }

    console.log(`Created content block ${contentBlock.id} with ${statements.length} statements`);
  }

  return {
    success: true,
    message: `Article processed with ${contentBlocks.length} content blocks and ${totalStatements} statements`,
    data: {
      document_id: document.id,
      content_blocks_created: contentBlocks.length,
      statements_created: totalStatements,
      content_type: 'article'
    }
  };
}

export const POST = requireEditor(async (request: NextRequest, context) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = JSON.parse(formData.get('options') as string || '{}');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json({ error: 'Only .md files are supported for entries' }, { status: 400 });
    }

    console.log(`User ${context.userId} uploading entry: ${file.name}`);

    // Read and parse the markdown file
    const markdownContent = await file.text();
    const parsedEntry = parseFrontmatter(markdownContent);

    // Validate required fields based on content type
    const contentType = parsedEntry.frontmatter.content_type || 'article';
    if (!validateFrontmatterForContentType(parsedEntry.frontmatter, contentType)) {
      return NextResponse.json({
        error: `Missing required fields for content type '${contentType}'`
      }, { status: 400 });
    }

    // Process content using flexible mapping system
    const result = await processFlexibleContent(parsedEntry.frontmatter, parsedEntry.content, context);

    return NextResponse.json({
      success: true,
      message: result.message,
      file_info: {
        filename: file.name,
        title: parsedEntry.title,
        content_type: contentType,
        ...result.data
      }
    });

  } catch (error) {
    console.error('Entry import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error during entry import' },
      { status: 500 }
    );
  }
});

/**
 * Validate frontmatter based on content type requirements
 */
function validateFrontmatterForContentType(frontmatter: EntryFrontmatter, contentType: string): boolean {
  switch (contentType) {
    case 'bio':
      return !!(frontmatter.name);

    case 'topic_description':
      return !!(frontmatter.name && frontmatter.target_id);

    case 'reference':
      return !!(frontmatter.name);

    case 'metadata':
      return !!(frontmatter.target_entity && frontmatter.target_id);

    case 'article':
    default:
      return !!(frontmatter.slug && frontmatter.name && frontmatter.category &&
                frontmatter.difficulty && frontmatter.status);
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Entry document upload endpoint. Use POST to upload .md files with flexible content mapping.',
    supported_formats: ['.md'],
    content_types: {
      article: {
        description: 'Full article with paragraphs and statements (default)',
        required_fields: ['slug', 'name', 'category', 'difficulty', 'status'],
        optional_fields: ['name_hebrew', 'last_updated', 'tags']
      },
      bio: {
        description: 'Short biography for topics',
        required_fields: ['name'],
        optional_fields: ['target_id', 'slug']
      },
      topic_description: {
        description: 'Update existing topic description',
        required_fields: ['name', 'target_id']
      },
      reference: {
        description: 'Single citation or reference statement',
        required_fields: ['name']
      },
      metadata: {
        description: 'Update metadata on existing records',
        required_fields: ['target_entity', 'target_id'],
        optional_fields: ['mapping_rules']
      }
    },
    flexible_mapping_fields: [
      'content_type',
      'target_entity',
      'target_id',
      'mapping_rules'
    ],
    parameters: {
      file: 'required - .md file with frontmatter',
      options: 'optional - JSON string with import options'
    },
    example_frontmatter: {
      article: `---
slug: example-article
name: Example Article
category: Philosophy
difficulty: Intermediate
status: Draft
tags: [example, test]
---

Article content here...`,
      bio: `---
content_type: bio
name: Rabbi Schneur Zalman
---

Biography content here...`,
      topic_description: `---
content_type: topic_description
name: Bittul Description Update
target_id: existing-topic-id
---

Updated description content...`
    }
  });
}
