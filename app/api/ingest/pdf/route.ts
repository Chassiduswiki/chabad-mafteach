import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
const directus = createClient();
import { createItem } from '@directus/sdk';
import { requireEditor } from '@/lib/auth';
// Dynamic import for pdf-parse to avoid DOMMatrix issues during build
let pdfParse: any = null;
// Dynamic import for OCR to avoid DOMMatrix issues during build
let ocrProcessor: any = null;
let OCRProcessor: any = null;

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

export const POST = requireEditor(async (request: NextRequest, context) => {
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

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    console.log(`User ${context.userId} (${context.role}) creating PDF job: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Add job to queue
    const jobQueue = (await import('@/lib/job-queue')).getJobQueue();
    const jobId = await jobQueue.addJob('pdf_processing', {
      fileName: file.name,
      fileSize: file.size,
      title,
      language,
      fileBuffer: buffer,
      userId: context.userId
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'PDF processing job created. Processing will begin shortly.',
      statusUrl: `/api/jobs/status?jobId=${jobId}`,
      estimatedTime: file.size > 10 * 1024 * 1024 ? '5-15 minutes' : '1-3 minutes' // Rough estimate based on file size
    });

  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: 'Failed to create PDF processing job' },
      { status: 500 }
    );
  }
});

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
