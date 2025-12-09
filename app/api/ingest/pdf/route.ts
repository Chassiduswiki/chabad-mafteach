import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { createItem } from '@directus/sdk';
// @ts-ignore - pdf-parse uses CommonJS exports
const pdfParse = require('pdf-parse');
import { getOCRProcessor, OCRProcessor, cleanupOCR } from '@/lib/ocr-processor';

interface PDFTextContent {
  text: string;
  pages: string[];
  totalPages: number;
  hasTextLayer: boolean;
  needsOCR: boolean;
  ocrConfidence?: number;
  textQuality: 'excellent' | 'good' | 'poor' | 'none';
}

interface OCRDetectionResult {
  hasTextLayer: boolean;
  needsOCR: boolean;
  textQuality: 'excellent' | 'good' | 'poor' | 'none';
  confidence: number;
  reasoning: string[];
}

function detectOCRNeed(pdfData: any, pages: string[]): OCRDetectionResult {
  const totalPages = pdfData.numpages;
  const totalText = pdfData.text;
  const reasoning: string[] = [];

  // Basic metrics
  const avgCharsPerPage = totalText.length / totalPages;
  const totalWords = totalText.split(/\s+/).filter((word: string) => word.length > 0).length;
  const avgWordsPerPage = totalWords / totalPages;

  reasoning.push(`Average ${avgCharsPerPage.toFixed(1)} characters per page`);
  reasoning.push(`Average ${avgWordsPerPage.toFixed(1)} words per page`);

  // Check for Hebrew characters (basic detection)
  const hebrewChars = /[\u0590-\u05FF]/g;
  const hasHebrew = hebrewChars.test(totalText);
  reasoning.push(hasHebrew ? 'Hebrew characters detected' : 'No Hebrew characters found');

  // Text quality assessment
  let textQuality: 'excellent' | 'good' | 'poor' | 'none' = 'none';
  let hasTextLayer = false;
  let needsOCR = false;
  let confidence = 0;

  if (avgCharsPerPage > 500) {
    textQuality = 'excellent';
    hasTextLayer = true;
    confidence = 95;
    reasoning.push('Excellent text extraction - native text layer confirmed');
  } else if (avgCharsPerPage > 200) {
    textQuality = 'good';
    hasTextLayer = true;
    confidence = 85;
    reasoning.push('Good text extraction - likely native text layer');
  } else if (avgCharsPerPage > 50) {
    textQuality = 'poor';
    hasTextLayer = true;
    needsOCR = true; // Poor quality suggests OCR might help
    confidence = 60;
    reasoning.push('Poor text quality - may benefit from OCR enhancement');
  } else if (totalText.length < 100) {
    textQuality = 'none';
    hasTextLayer = false;
    needsOCR = true;
    confidence = 10;
    reasoning.push('Minimal or no text extracted - likely scanned document needing OCR');
  } else {
    textQuality = 'poor';
    hasTextLayer = true;
    needsOCR = avgCharsPerPage < 100; // Borderline case
    confidence = 50;
    reasoning.push('Borderline text quality - OCR may or may not be needed');
  }

  // Additional heuristics for scanned PDFs
  const hasImages = pdfData.info?.Pages?.some((page: any) => page.Resources?.XObject);
  if (hasImages !== undefined) {
    reasoning.push(hasImages ? 'PDF contains images' : 'PDF appears text-only');
    if (hasImages && textQuality === 'none') {
      needsOCR = true;
      confidence = Math.max(confidence, 90);
      reasoning.push('Images present with no text - high confidence OCR needed');
    }
  }

  // Check for common OCR indicators
  const gibberishRatio = getGibberishRatio(totalText);
  if (gibberishRatio > 0.3) {
    needsOCR = true;
    confidence = Math.min(confidence, 30);
    reasoning.push(`High gibberish ratio (${(gibberishRatio * 100).toFixed(1)}%) - likely OCR errors`);
  }

  return {
    hasTextLayer,
    needsOCR,
    textQuality,
    confidence,
    reasoning
  };
}

function getGibberishRatio(text: string): number {
  // Simple heuristic: count unusual character sequences
  const words: string[] = text.split(/\s+/).filter((word: string) => word.length > 2);
  let gibberishCount = 0;

  for (const word of words) {
    // Count words with too many consecutive consonants (common OCR error)
    const consecutiveConsonants = word.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi);
    if (consecutiveConsonants) {
      gibberishCount++;
    }

    // Count words with unusual character combinations
    if (/[^a-zA-Z\u0590-\u05FF\s]/.test(word)) {
      // Contains non-letter characters (might be OK for Hebrew)
      continue;
    }
  }

  return gibberishCount / Math.max(words.length, 1);
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

    // Advanced OCR detection
    const ocrResult = detectOCRNeed(pdfData, pages);

    const pdfContent: PDFTextContent = {
      text: pdfData.text,
      pages,
      totalPages: pdfData.numpages,
      hasTextLayer: ocrResult.hasTextLayer,
      needsOCR: ocrResult.needsOCR,
      ocrConfidence: ocrResult.confidence,
      textQuality: ocrResult.textQuality
    };

    console.log(`PDF analyzed: ${pdfContent.totalPages} pages, quality: ${ocrResult.textQuality}, needs OCR: ${ocrResult.needsOCR} (${ocrResult.confidence}% confidence)`);
    console.log(`OCR reasoning:`, ocrResult.reasoning);

    // If OCR is needed, process with Tesseract
    let ocrResults = null;
    let finalPages = [...pages]; // Start with native text

    if (pdfContent.needsOCR) {
      try {
        console.log('Starting OCR processing...');
        const ocrProcessor = await getOCRProcessor();

        // OCR all pages (since we don't know which ones need it specifically)
        const pageNumbers = Array.from({ length: pdfContent.totalPages }, (_, i) => i + 1);
        const ocrPageResults = await ocrProcessor.processPDFPages(buffer, pageNumbers);

        // Analyze OCR quality
        const ocrQuality = OCRProcessor.analyzeOCRQuality(ocrPageResults);
        console.log(`OCR completed: ${ocrQuality.quality} quality, ${(ocrQuality.averageConfidence).toFixed(1)}% avg confidence, ${ocrQuality.processingTime}ms total`);

        // Combine native text with OCR results intelligently
        ocrResults = ocrPageResults;

        // For pages with very poor native text, prefer OCR results
        for (let i = 0; i < pages.length; i++) {
          const nativeText = pages[i];
          const ocrText = ocrPageResults[i]?.ocrResult.text || '';

          // Use OCR if native text is very poor (< 100 chars) and OCR confidence > 50%
          if (nativeText.length < 100 && ocrPageResults[i]?.ocrResult.confidence > 50) {
            finalPages[i] = OCRProcessor.postProcessHebrewText(ocrText);
            console.log(`Page ${i + 1}: Using OCR text (${ocrText.length} chars) over native (${nativeText.length} chars)`);
          } else if (nativeText.length > 200) {
            // Keep native text if it's good quality
            console.log(`Page ${i + 1}: Keeping native text (${nativeText.length} chars)`);
          } else {
            // Blend both - append OCR text if it's different and confident
            const combinedText = nativeText.trim();
            if (ocrText.length > nativeText.length && ocrPageResults[i]?.ocrResult.confidence > 60) {
              finalPages[i] = OCRProcessor.postProcessHebrewText(ocrText);
              console.log(`Page ${i + 1}: Enhanced with OCR (${ocrText.length} chars total)`);
            }
          }
        }

        pdfContent.textQuality = ocrQuality.quality;
        pdfContent.ocrConfidence = ocrQuality.averageConfidence;

      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        // Continue with native text extraction only
        console.log('Falling back to native text extraction');
      }
    }

    // Create document entry
    const document = await directus.request(createItem('documents', {
      title: title || file.name.replace('.pdf', ''),
      metadata: {
        source: 'pdf_upload',
        filename: file.name,
        file_size: file.size,
        total_pages: pdfContent.totalPages,
        has_text_layer: pdfContent.hasTextLayer,
        needs_ocr: pdfContent.needsOCR,
        text_quality: pdfContent.textQuality,
        ocr_confidence: pdfContent.ocrConfidence,
        ocr_reasoning: ocrResult.reasoning,
        ocr_performed: ocrResults !== null,
        ocr_processing_time: ocrResults ? OCRProcessor.analyzeOCRQuality(ocrResults).processingTime : null,
        language,
        uploaded_at: new Date().toISOString(),
        pdf_info: pdfData.info
      }
    }));

    console.log(`Created document: ${document.id}`);

    // Process pages into paragraphs
    const paragraphs = [];
    let paragraphOrder = 0;

    for (let pageIndex = 0; pageIndex < finalPages.length; pageIndex++) {
      const pageText = finalPages[pageIndex];

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
            has_text_layer: pdfContent.hasTextLayer,
            needs_ocr: pdfContent.needsOCR,
            text_quality: pdfContent.textQuality,
            ocr_confidence: pdfContent.ocrConfidence,
            ocr_enhanced: ocrResults !== null && finalPages[pageIndex] !== pages[pageIndex],
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
            has_text_layer: pdfContent.hasTextLayer,
            needs_ocr: pdfContent.needsOCR,
            text_quality: pdfContent.textQuality,
            ocr_confidence: pdfContent.ocrConfidence,
            ocr_enhanced: ocrResults !== null && finalPages[pageIndex] !== pages[pageIndex]
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
        has_text_layer: pdfContent.hasTextLayer,
        needs_ocr: pdfContent.needsOCR,
        text_quality: pdfContent.textQuality,
        ocr_confidence: pdfContent.ocrConfidence,
        ocr_reasoning: ocrResult.reasoning,
        ocr_performed: ocrResults !== null,
        ocr_processing_time: ocrResults ? OCRProcessor.analyzeOCRQuality(ocrResults).processingTime : null,
        paragraphs_created: paragraphs.length,
        total_characters: finalPages.join(' ').length
      },
      message: pdfContent.needsOCR
        ? ocrResults
          ? `PDF processed with OCR enhancement! ${paragraphs.length} paragraphs created. OCR quality: ${pdfContent.textQuality} (${(pdfContent.ocrConfidence || 0).toFixed(1)}% confidence)`
          : `PDF processed with native text extraction. ${paragraphs.length} paragraphs created. OCR was recommended but failed - using native text.`
        : `PDF processed successfully with ${paragraphs.length} paragraphs. High-quality native text extraction (${(pdfContent.ocrConfidence || 0).toFixed(1)}% confidence).`
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
      } else if (error.message.includes('OCR') || error.message.includes('tesseract')) {
        errorMessage = 'OCR processing failed. The PDF may have complex formatting or very poor image quality';
      } else {
        errorMessage = `PDF processing failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Cleanup OCR resources
    try {
      await cleanupOCR();
    } catch (cleanupError) {
      console.warn('OCR cleanup failed:', cleanupError);
    }
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
