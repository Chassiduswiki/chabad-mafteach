import { NextRequest, NextResponse } from 'next/server';
import { getJobQueue } from '@/lib/job-queue';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    const jobQueue = getJobQueue();
    const job = jobQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job status (exclude file buffer for security)
    const { data, ...jobStatus } = job;
    const response = {
      ...jobStatus,
      // Don't include file buffer in response
      fileName: data.fileName,
      fileSize: data.fileSize,
      title: data.title,
      language: data.language
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating jobs (used by PDF upload)
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

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    console.log(`Creating async job for PDF: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Add job to queue
    const jobQueue = getJobQueue();
    const jobId = await jobQueue.addJob('pdf_processing', {
      fileName: file.name,
      fileSize: file.size,
      title,
      language,
      fileBuffer: buffer
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'PDF processing job created. Check status for progress.',
      statusUrl: `/api/jobs/status?jobId=${jobId}`
    });

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create processing job' },
      { status: 500 }
    );
  }
}
