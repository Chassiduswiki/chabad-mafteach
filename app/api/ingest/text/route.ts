import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { createItem } from '@directus/sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const language = formData.get('language') as string || 'he';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only .txt files are supported' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    
    // Validate content (basic Hebrew check if language is he)
    if (language === 'he') {
      const hebrewRegex = /[\u0590-\u05FF]/;
      if (!hebrewRegex.test(text)) {
        console.warn('Warning: File may not contain Hebrew text');
      }
    }

    // Create document entry
    const document = await directus.request(createItem('documents', {
      title: title || file.name.replace('.txt', ''),
      metadata: {
        source: 'text_upload',
        filename: file.name,
        file_size: file.size,
        language,
        uploaded_at: new Date().toISOString()
      }
    }));

    console.log(`Created document: ${document.id}`);

    // Process text into paragraphs
    const paragraphs = [];
    let paragraphOrder = 0;

    // Split text into paragraphs (handle different line endings)
    const paragraphTexts = text
      .split(/\n\s*\n|\r\n\s*\r\n/)  // Double line breaks
      .filter(p => p.trim().length > 0)  // Remove empty paragraphs
      .map(p => p.trim());  // Clean whitespace

    for (const paragraphText of paragraphTexts) {
      // Create paragraph
      const paragraph = await directus.request(createItem('paragraphs', {
        doc_id: document.id,
        order_key: String(paragraphOrder++),
        text: paragraphText,
        metadata: {
          source_language: language,
          auto_generated: false
        }
      }));

      paragraphs.push(paragraph);

      // Create initial statement (can be manually refined later)
      const statement = await directus.request(createItem('statements', {
        paragraph_id: paragraph.id,
        order_key: '0',
        text: paragraphText,
        metadata: {
          auto_generated: true,
          source: 'text_upload'
        }
      }));

      console.log(`Created paragraph ${paragraph.id} with statement ${statement.id}`);
    }

    return NextResponse.json({
      success: true,
      document_id: document.id,
      file_info: {
        filename: file.name,
        size: file.size,
        language,
        paragraphs_created: paragraphs.length
      },
      message: `Successfully imported ${paragraphs.length} paragraphs from ${file.name}`
    });

  } catch (error) {
    console.error('Text file import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during text file import' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Text file upload endpoint. Use POST to upload .txt files.',
    supported_formats: ['.txt'],
    parameters: {
      file: 'required - .txt file',
      title: 'optional - document title',
      language: 'optional - "he" (default) or "en"'
    }
  });
}
