import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { createItem } from '@directus/sdk';
// @ts-ignore - pdf-parse uses CommonJS exports
const pdfParse = require('pdf-parse');

interface PDFTextContent {
  text: string;
  pages: string[];
  totalPages: number;
  hasTextLayer: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const language = formData.get('language') as string || 'he';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Validate file size (max 50MB as per plan)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    console.log(`Processing PDF: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Convert File to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const pdfData = await pdfParse(buffer);

    // Extract text from each page
    const pages: string[] = [];
    const pageTexts = pdfData.text.split('\f'); // Form feed separates pages

    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i].trim();
      if (pageText.length > 0) {
        pages.push(pageText);
      }
    }

    // Basic text layer detection - if we got meaningful text, assume it has text layer
    const totalTextLength = pdfData.text.length;
    const hasTextLayer = totalTextLength > pdfData.numpages * 100; // Rough heuristic

    const pdfContent: PDFTextContent = {
      text: pdfData.text,
      pages,
      totalPages: pdfData.numpages,
      hasTextLayer
    };

    console.log(`PDF parsed: ${pdfContent.totalPages} pages, ${totalTextLength} characters, hasTextLayer: ${hasTextLayer}`);

    // Create document entry
    const document = await directus.request(createItem('documents', {
      title: title || file.name.replace('.pdf', ''),
      metadata: {
        source: 'pdf_upload',
        filename: file.name,
        file_size: file.size,
        total_pages: pdfContent.totalPages,
        has_text_layer: hasTextLayer,
        language,
        uploaded_at: new Date().toISOString(),
        pdf_info: pdfData.info
      }
    }));

    console.log(`Created document: ${document.id}`);

    // Process pages into paragraphs
    const paragraphs = [];
    let paragraphOrder = 0;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageText = pages[pageIndex];

      if (!pageText.trim()) continue;

      // Split page text into paragraphs (similar to text upload)
      const pageParagraphs = pageText
        .split(/\n\s*\n|\r\n\s*\r\n/)  // Double line breaks
        .filter(p => p.trim().length > 0)  // Remove empty paragraphs
        .map(p => p.trim());  // Clean whitespace

      for (const paragraphText of pageParagraphs) {
        // Create paragraph with page metadata
        const paragraph = await directus.request(createItem('paragraphs', {
          doc_id: document.id,
          order_key: String(paragraphOrder++),
          text: paragraphText,
          metadata: {
            source_language: language,
            page_number: pageIndex + 1,
            has_text_layer: hasTextLayer,
            auto_generated: false
          }
        }));

        paragraphs.push(paragraph);

        // Create initial statement
        const statement = await directus.request(createItem('statements', {
          paragraph_id: paragraph.id,
          order_key: '0',
          text: paragraphText,
          metadata: {
            auto_generated: true,
            source: 'pdf_upload',
            page_number: pageIndex + 1,
            has_text_layer: hasTextLayer
          }
        }));

        console.log(`Created paragraph ${paragraph.id} on page ${pageIndex + 1} with statement ${statement.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      document_id: document.id,
      pdf_info: {
        filename: file.name,
        size: file.size,
        pages: pdfContent.totalPages,
        has_text_layer: hasTextLayer,
        paragraphs_created: paragraphs.length,
        total_characters: totalTextLength
      },
      message: `Successfully processed PDF with ${paragraphs.length} paragraphs across ${pdfContent.totalPages} pages`
    });

  } catch (error) {
    console.error('PDF processing error:', error);

    // Provide more specific error messages
    let errorMessage = 'Internal server error during PDF processing';
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        errorMessage = 'The uploaded file is not a valid PDF or is corrupted';
      } else if (error.message.includes('password')) {
        errorMessage = 'This PDF is password-protected and cannot be processed';
      } else if (error.message.includes('size') || error.message.includes('memory')) {
        errorMessage = 'PDF is too large or complex to process. Try a smaller file or contact support';
      } else {
        errorMessage = `PDF processing failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF upload endpoint. Use POST to upload PDF files.',
    supported_formats: ['.pdf'],
    max_size: '50MB',
    parameters: {
      file: 'required - PDF file',
      title: 'optional - document title',
      language: 'optional - "he" (default) or "en"'
    },
    capabilities: [
      'Text extraction from text-based PDFs',
      'Page-by-page processing',
      'Automatic paragraph detection',
      'Metadata storage (page numbers, text layer detection)'
    ]
  });
}
