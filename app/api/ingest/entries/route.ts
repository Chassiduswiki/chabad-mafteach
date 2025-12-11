import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem } from '@directus/sdk';
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

    // Validate required fields
    if (!parsedEntry.frontmatter.slug || !parsedEntry.frontmatter.name) {
      return NextResponse.json({
        error: 'Missing required fields: slug and name are required in frontmatter'
      }, { status: 400 });
    }

    // Validate and normalize status
    const statusMap: Record<string, 'draft' | 'reviewed' | 'published' | 'archived'> = {
      'draft': 'draft',
      'published': 'published',
      'reviewed': 'reviewed',
      'archived': 'archived'
    };

    const normalizedStatus = statusMap[parsedEntry.frontmatter.status.toLowerCase()] || 'draft';

    // Create the document
    const document = await directus.request(createItem('documents', {
      title: parsedEntry.title,
      doc_type: 'entry',
      original_lang: 'en', // Assuming English primary with Hebrew references
      status: normalizedStatus,
      source_format: 'manual_entry',
      metadata: {
        slug: parsedEntry.frontmatter.slug,
        name_hebrew: parsedEntry.frontmatter.name_hebrew,
        category: parsedEntry.frontmatter.category,
        difficulty: parsedEntry.frontmatter.difficulty.toLowerCase(),
        tags: parsedEntry.frontmatter.tags || [],
        last_updated: parsedEntry.frontmatter.last_updated,
        source: 'markdown_import',
        imported_at: new Date().toISOString(),
        imported_by: context.userId,
        filename: file.name
      }
    }));

    console.log(`Created document: ${document.id} (${parsedEntry.title})`);

    // Process content into content blocks
    const contentBlocks = processMarkdownContent(parsedEntry.content);
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
          source: 'markdown_import',
          imported_by: context.userId
        }
      }));

      // Create statements from content block content
      const statements = createStatementsFromParagraph(blockContent);
      let statementOrder = 0;

      for (const statementText of statements) {
        await directus.request(createItem('statements', {
          block_id: contentBlock.id,
          order_key: `${statementOrder++}`,
          text: statementText,
          status: 'published',
          metadata: {
            source: 'markdown_import',
            auto_generated: true,
            imported_by: context.userId
          }
        }));
        totalStatements++;
      }

      console.log(`Created content block ${contentBlock.id} with ${statements.length} statements`);
    }

    return NextResponse.json({
      success: true,
      document_id: document.id,
      file_info: {
        filename: file.name,
        title: parsedEntry.title,
        content_blocks_created: contentBlocks.length,
        statements_created: totalStatements,
        category: parsedEntry.frontmatter.category,
        difficulty: parsedEntry.frontmatter.difficulty,
        tags: parsedEntry.frontmatter.tags
      },
      message: `Successfully imported "${parsedEntry.title}" with ${contentBlocks.length} content blocks and ${totalStatements} statements`
    });

  } catch (error) {
    console.error('Entry import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error during entry import' },
      { status: 500 }
    );
  }
});

export async function GET() {
  return NextResponse.json({
    message: 'Entry document upload endpoint. Use POST to upload .md files.',
    supported_formats: ['.md'],
    required_frontmatter: [
      'slug',
      'name',
      'category',
      'difficulty',
      'status'
    ],
    optional_frontmatter: [
      'name_hebrew',
      'last_updated',
      'tags'
    ],
    parameters: {
      file: 'required - .md file with frontmatter',
      options: 'optional - JSON string with import options'
    },
    example_frontmatter: `---
slug: emunah
name: Emunah
name_hebrew: אֱמוּנָה
category: Avodah
difficulty: Beginner
status: Draft
last_updated: 2025-12-04
tags: [emunah, faith, belief]
---`
  });
}
