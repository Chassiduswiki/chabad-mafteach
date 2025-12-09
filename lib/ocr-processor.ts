// @ts-ignore - tesseract.js uses ESM
const { createWorker } = require('tesseract.js');
// @ts-ignore - pdf2pic uses CommonJS
const pdf2pic = require('pdf2pic');

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface PageOCRResult {
  pageNumber: number;
  ocrResult: OCRResult;
  processingTime: number;
  imagePath?: string;
}

export class OCRProcessor {
  private worker: any = null;

  async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await createWorker('heb+eng', 1, {
      logger: (m: any) => console.log('OCR:', m)
    });

    // Load Hebrew language data
    await this.worker.setParameters({
      tessedit_char_whitelist: 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ׳״׳ 0123456789.,;:!?-()[]{}',
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
    });
  }

  async processPDFPage(buffer: Buffer, pageNumber: number): Promise<PageOCRResult> {
    const startTime = Date.now();

    try {
      await this.initialize();

      // Convert PDF page to image
      const convert = pdf2pic.fromBuffer(buffer, {
        density: 300,           // Higher DPI for better OCR
        saveFilename: `page_${pageNumber}`,
        savePath: "/tmp",       // Temporary directory
        format: "png",
        width: 2000,            // High resolution
        height: 2800
      });

      const result = await convert(pageNumber);
      const imagePath = result.path;

      console.log(`Converted page ${pageNumber} to image: ${imagePath}`);

      // Run OCR on the image
      const { data } = await this.worker.recognize(imagePath);

      const ocrResult: OCRResult = {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        }))
      };

      const processingTime = Date.now() - startTime;

      console.log(`OCR completed for page ${pageNumber}: ${ocrResult.text.length} chars, ${(ocrResult.confidence).toFixed(1)}% confidence, ${processingTime}ms`);

      // Clean up image file
      try {
        const fs = require('fs');
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup image file:', cleanupError);
      }

      return {
        pageNumber,
        ocrResult,
        processingTime,
        imagePath
      };

    } catch (error) {
      console.error(`OCR failed for page ${pageNumber}:`, error);
      throw new Error(`OCR processing failed for page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processPDFPages(buffer: Buffer, pageNumbers: number[]): Promise<PageOCRResult[]> {
    const results: PageOCRResult[] = [];

    for (const pageNum of pageNumbers) {
      try {
        const result = await this.processPDFPage(buffer, pageNum);
        results.push(result);
      } catch (error) {
        console.error(`Failed to OCR page ${pageNum}, skipping:`, error);
        // Continue with other pages even if one fails
      }
    }

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Utility function to improve OCR text quality
  static postProcessHebrewText(text: string): string {
    return text
      // Fix common OCR errors for Hebrew
      .replace(/יי/g, 'יי') // Preserve double yods
      .replace(/וו/g, 'וו') // Preserve double vavs
      .replace(/שש/g, 'שש') // Preserve double shins
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Calculate overall OCR quality metrics
  static analyzeOCRQuality(results: PageOCRResult[]): {
    averageConfidence: number;
    totalCharacters: number;
    processingTime: number;
    quality: 'excellent' | 'good' | 'poor';
  } {
    const totalConfidence = results.reduce((sum, r) => sum + r.ocrResult.confidence, 0);
    const averageConfidence = totalConfidence / results.length;

    const totalCharacters = results.reduce((sum, r) => sum + r.ocrResult.text.length, 0);
    const processingTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    let quality: 'excellent' | 'good' | 'poor';
    if (averageConfidence > 80) quality = 'excellent';
    else if (averageConfidence > 60) quality = 'good';
    else quality = 'poor';

    return {
      averageConfidence,
      totalCharacters,
      processingTime,
      quality
    };
  }
}

// Singleton instance for reuse
let ocrProcessor: OCRProcessor | null = null;

export async function getOCRProcessor(): Promise<OCRProcessor> {
  if (!ocrProcessor) {
    ocrProcessor = new OCRProcessor();
    await ocrProcessor.initialize();
  }
  return ocrProcessor;
}

export async function cleanupOCR(): Promise<void> {
  if (ocrProcessor) {
    await ocrProcessor.cleanup();
    ocrProcessor = null;
  }
}
