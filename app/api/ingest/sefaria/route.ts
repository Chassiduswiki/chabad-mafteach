import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { createItem, readItems } from '@directus/sdk';

interface SefariaText {
  he: string;
  en: string;
  heTitle: string;
  enTitle: string;
  category: string;
  sections: string[];
  toSections: string[];
  ref: string;
  index: string;
  length: number;
}

interface SefariaIndex {
  title: string;
  heTitle: string;
  categories: string[];
  length: number;
}

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, language = 'he' } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required' }, { status: 400 });
    }

    // First get the index to verify book exists and get structure
    const indexResponse = await fetch(`https://www.sefaria.org/api/index/${bookTitle}`);
    if (!indexResponse.ok) {
      return NextResponse.json({ error: 'Book not found in Sefaria' }, { status: 404 });
    }
    
    const index: SefariaIndex = await indexResponse.json();
    console.log(`Found book: ${index.heTitle} (${index.title}) with ${index.length} sections`);

    // Fetch all text content
    const textUrl = `https://www.sefaria.org/api/texts/${bookTitle}?lang=${language}&commentary=0`;
    const textResponse = await fetch(textUrl);
    
    if (!textResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch text content' }, { status: 500 });
    }

    const textData: SefariaText = await textResponse.json();
    
    // Initialize Directus client
    // const directus = await createDirectusClient();

    // Create document entry
    const document = await directus.request(createItem('documents', {
      title: index.heTitle,
      metadata: {
        title_en: index.title,
        source: 'sefaria',
        source_uri: `https://www.sefaria.org/${bookTitle}`,
        sefaria_index: index,
        categories: index.categories,
        length: index.length
      }
    }));

    console.log(`Created document: ${document.id}`);

    // Process text into paragraphs and statements
    const paragraphs = [];
    let paragraphOrder = 0;

    // Hebrew text typically uses different paragraph structures
    // We'll split by double line breaks or section breaks
    const textSections = Array.isArray(textData.he) ? textData.he : [textData.he];
    
    for (let sectionIndex = 0; sectionIndex < textSections.length; sectionIndex++) {
      const sectionText = textSections[sectionIndex];
      
      // Split into paragraphs (Hebrew often uses different separators)
      const paragraphTexts = sectionText
        .split(/\n\s*\n|\r\n\s*\r\n/)  // Double line breaks
        .filter((p: string) => p.trim().length > 0)  // Remove empty paragraphs

      for (const paragraphText of paragraphTexts) {
        // Create paragraph
        const paragraph = await directus.request(createItem('paragraphs', {
          doc_id: document.id,
          order_key: String(paragraphOrder++),
          text: paragraphText.trim(),
          metadata: {
            section_reference: `${sectionIndex + 1}`,
            section_index: sectionIndex,
            source_language: language
          }
        }));

        paragraphs.push(paragraph);

        // Create initial statement (can be manually refined later)
        const statement = await directus.request(createItem('statements', {
          paragraph_id: paragraph.id,
          order_key: '0',
          text: paragraphText.trim(),
          metadata: {
            auto_generated: true,
            source: 'sefaria_import'
          }
        }));

        console.log(`Created paragraph ${paragraph.id} with statement ${statement.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      document_id: document.id,
      book_info: {
        title: index.heTitle,
        title_en: index.title,
        categories: index.categories,
        sections_count: index.length,
        paragraphs_created: paragraphs.length
      },
      message: `Successfully imported ${paragraphs.length} paragraphs from ${index.heTitle}`
    });

  } catch (error) {
    console.error('Sefaria import error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Sefaria import' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Search Sefaria for books
    const searchUrl = `https://www.sefaria.org/api/index?q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      return NextResponse.json({ error: 'Failed to search Sefaria' }, { status: 500 });
    }

    const results = await searchResponse.json();

    // Filter for books (not individual texts/sections)
    const books = results.filter((item: any) => 
      item.categories && 
      !item.categories.includes('Commentary') &&
      item.length > 1
    ).slice(0, 20); // Limit results

    return NextResponse.json({
      success: true,
      books: books.map((book: any) => ({
        title: book.title,
        heTitle: book.heTitle,
        categories: book.categories,
        length: book.length,
        enDesc: book.enDesc || '',
        heDesc: book.heDesc || ''
      }))
    });

  } catch (error) {
    console.error('Sefaria search error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Sefaria search' },
      { status: 500 }
    );
  }
}
