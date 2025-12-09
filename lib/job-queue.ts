// Simple in-memory job queue with file-based persistence for Railway compatibility
// This avoids Redis dependency while providing reliable job processing

export interface Job {
  id: string;
  type: 'pdf_processing';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  data: {
    fileName: string;
    fileSize: number;
    title?: string;
    language: string;
    fileBuffer: Buffer; // Stored temporarily
  };
  result?: {
    documentId?: string;
    error?: string;
    pdfInfo?: any;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress?: {
    stage: string;
    percentage: number;
    message: string;
  };
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private queueFile = '/tmp/job-queue.json';
  private isProcessing = false;

  constructor() {
    this.loadJobsFromDisk();
    // Start background processing
    this.startProcessing();
  }

  // Add a new job to the queue
  async addJob(type: 'pdf_processing', data: Job['data']): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: Job = {
      id: jobId,
      type,
      status: 'queued',
      data,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    await this.saveJobsToDisk();

    console.log(`Job ${jobId} added to queue: ${data.fileName}`);

    return jobId;
  }

  // Get job by ID
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  // Update job status and progress
  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);
    await this.saveJobsToDisk();

    console.log(`Job ${jobId} updated: ${updates.status || 'status unchanged'}`);
  }

  // Process jobs in the background
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log('Starting job queue processing...');

    while (true) {
      try {
        const queuedJobs = Array.from(this.jobs.values())
          .filter(job => job.status === 'queued')
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        if (queuedJobs.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          continue;
        }

        // Process one job at a time
        const job = queuedJobs[0];
        await this.processJob(job);

      } catch (error) {
        console.error('Job processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  // Process a single job
  private async processJob(job: Job): Promise<void> {
    try {
      await this.updateJob(job.id, {
        status: 'processing',
        startedAt: new Date(),
        progress: { stage: 'initializing', percentage: 0, message: 'Starting PDF processing...' }
      });

      // Call the actual PDF processing logic
      const result = await this.processPDFJob(job);

      await this.updateJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
        result: {
          documentId: result.documentId,
          pdfInfo: result.pdfInfo
        },
        progress: { stage: 'completed', percentage: 100, message: 'PDF processing completed successfully!' }
      });

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.updateJob(job.id, {
        status: 'failed',
        completedAt: new Date(),
        result: {
          error: error instanceof Error ? error.message : 'Unknown processing error'
        },
        progress: { stage: 'failed', percentage: 100, message: 'PDF processing failed' }
      });
    }
  }

  // Process PDF job (extracted from the API route)
  private async processPDFJob(job: Job): Promise<{ documentId: string; pdfInfo: any }> {
    const { fileName, fileSize, title, language, fileBuffer } = job.data;

    // Update progress
    await this.updateJob(job.id, {
      progress: { stage: 'analyzing', percentage: 10, message: 'Analyzing PDF structure...' }
    });

    // Dynamic import for pdf-parse
    let pdfParse: any = null;
    try {
      pdfParse = (await import('pdf-parse')).default || require('pdf-parse');
    } catch (error) {
      throw new Error('Failed to load PDF parser');
    }

    // Parse PDF
    const pdfData = await pdfParse(fileBuffer);

    await this.updateJob(job.id, {
      progress: { stage: 'extracting', percentage: 30, message: 'Extracting text content...' }
    });

    // Extract text from each page
    const pages: string[] = [];
    const pageTexts = pdfData.text.split('\f');

    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i].trim();
      if (pageText.length > 0) {
        pages.push(pageText);
      }
    }

    // OCR detection logic (simplified for background processing)
    const avgCharsPerPage = pdfData.text.length / pdfData.numpages;
    const needsOCR = avgCharsPerPage < 200; // Simple threshold

    await this.updateJob(job.id, {
      progress: { stage: 'ocr_check', percentage: 50, message: needsOCR ? 'OCR analysis required...' : 'Text quality good, skipping OCR...' }
    });

    let finalPages = [...pages];
    let ocrResults = null;

    if (needsOCR) {
      try {
        await this.updateJob(job.id, {
          progress: { stage: 'ocr_processing', percentage: 60, message: 'Running OCR on scanned content...' }
        });

        // Import OCR processor
        const ocrModule = await import('@/lib/ocr-processor');
        const ocrProcessor = await ocrModule.getOCRProcessor();

        const pageNumbers = Array.from({ length: pdfData.numpages }, (_, i) => i + 1);
        const ocrPageResults = await ocrProcessor.processPDFPages(fileBuffer, pageNumbers);

        ocrResults = ocrPageResults;

        // Use OCR results for low-quality pages
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].length < 100 && ocrPageResults[i]?.ocrResult.confidence > 50) {
            finalPages[i] = ocrModule.OCRProcessor.postProcessHebrewText(ocrPageResults[i].ocrResult.text);
          }
        }

        // Cleanup
        await ocrModule.cleanupOCR();

      } catch (ocrError) {
        console.warn('OCR processing failed, using native text:', ocrError);
      }
    }

    await this.updateJob(job.id, {
      progress: { stage: 'saving', percentage: 80, message: 'Saving document and paragraphs...' }
    });

    // Import Directus and create document
    const directus = (await import('@/lib/directus')).default;
    const { createItem } = await import('@directus/sdk');

    const document = await directus.request(createItem('documents', {
      title: title || fileName.replace('.pdf', ''),
      metadata: {
        source: 'pdf_upload_async',
        filename: fileName,
        file_size: fileSize,
        total_pages: pdfData.numpages,
        has_text_layer: !needsOCR,
        needs_ocr: needsOCR,
        text_quality: needsOCR ? 'poor' : 'good',
        ocr_performed: ocrResults !== null,
        language,
        uploaded_at: new Date().toISOString(),
        job_id: job.id
      }
    }));

    // Process pages into paragraphs
    const paragraphs = [];
    let paragraphOrder = 0;

    for (let pageIndex = 0; pageIndex < finalPages.length; pageIndex++) {
      const pageText = finalPages[pageIndex];
      if (!pageText.trim()) continue;

      const pageParagraphs = pageText
        .split(/\n\s*\n|\r\n\s*\r\n/)
        .filter((p: string) => p.trim().length > 0)
        .map((p: string) => p.trim());

      for (const paragraphText of pageParagraphs) {
        const paragraph = await directus.request(createItem('paragraphs', {
          doc_id: document.id,
          order_key: String(paragraphOrder++),
          text: paragraphText,
          metadata: {
            source_language: language,
            page_number: pageIndex + 1,
            has_text_layer: !needsOCR,
            needs_ocr: needsOCR,
            ocr_enhanced: ocrResults !== null && finalPages[pageIndex] !== pages[pageIndex],
            auto_generated: false
          }
        }));

        paragraphs.push(paragraph);

        // Create statement
        await directus.request(createItem('statements', {
          paragraph_id: paragraph.id,
          order_key: '0',
          text: paragraphText,
          metadata: {
            auto_generated: true,
            source: 'pdf_upload_async',
            page_number: pageIndex + 1,
            ocr_enhanced: ocrResults !== null && finalPages[pageIndex] !== pages[pageIndex]
          }
        }));
      }
    }

    await this.updateJob(job.id, {
      progress: { stage: 'finalizing', percentage: 95, message: 'Finalizing document...' }
    });

    return {
      documentId: document.id,
      pdfInfo: {
        filename: fileName,
        pages: pdfData.numpages,
        has_text_layer: !needsOCR,
        needs_ocr: needsOCR,
        ocr_performed: ocrResults !== null,
        paragraphs_created: paragraphs.length,
        total_characters: finalPages.join(' ').length
      }
    };
  }

  // Persistence methods
  private async saveJobsToDisk(): Promise<void> {
    try {
      // Convert jobs to serializable format
      const serializableJobs = Array.from(this.jobs.entries()).map(([id, job]) => [
        id,
        {
          ...job,
          data: {
            ...job.data,
            fileBuffer: job.data.fileBuffer.toString('base64') // Convert buffer to base64
          },
          createdAt: job.createdAt.toISOString(),
          startedAt: job.startedAt?.toISOString(),
          completedAt: job.completedAt?.toISOString()
        }
      ]);

      const fs = await import('fs');
      await fs.promises.writeFile(this.queueFile, JSON.stringify(serializableJobs, null, 2));
    } catch (error) {
      console.warn('Failed to save jobs to disk:', error);
    }
  }

  private async loadJobsFromDisk(): Promise<void> {
    try {
      const fs = await import('fs');
      if (await fs.promises.access(this.queueFile).then(() => true).catch(() => false)) {
        const data = await fs.promises.readFile(this.queueFile, 'utf8');
        const serializableJobs = JSON.parse(data);

        // Restore jobs from serializable format
        for (const [id, jobData] of serializableJobs) {
          const job: Job = {
            ...jobData,
            data: {
              ...jobData.data,
              fileBuffer: Buffer.from(jobData.data.fileBuffer, 'base64') // Convert back to buffer
            },
            createdAt: new Date(jobData.createdAt),
            startedAt: jobData.startedAt ? new Date(jobData.startedAt) : undefined,
            completedAt: jobData.completedAt ? new Date(jobData.completedAt) : undefined
          };
          this.jobs.set(id, job);
        }

        console.log(`Loaded ${this.jobs.size} jobs from disk`);
      }
    } catch (error) {
      console.warn('Failed to load jobs from disk:', error);
    }
  }

  // Get all jobs (for admin/debugging)
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  // Clean up old completed jobs
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const jobsToDelete: string[] = [];

    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' && job.completedAt && job.completedAt.getTime() < cutoffTime) {
        jobsToDelete.push(id);
      }
    }

    for (const id of jobsToDelete) {
      this.jobs.delete(id);
    }

    if (jobsToDelete.length > 0) {
      await this.saveJobsToDisk();
      console.log(`Cleaned up ${jobsToDelete.length} old completed jobs`);
    }
  }
}

// Singleton instance
let jobQueue: JobQueue | null = null;

export function getJobQueue(): JobQueue {
  if (!jobQueue) {
    jobQueue = new JobQueue();
  }
  return jobQueue;
}
