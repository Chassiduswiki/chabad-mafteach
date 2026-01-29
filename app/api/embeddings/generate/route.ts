/**
 * Generate Embedding for Single Item
 * POST /api/embeddings/generate
 *
 * Webhook endpoint for Directus Flows to generate embeddings
 * for newly created or updated items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';
import { generateEmbedding, prepareTextForEmbedding } from '@/lib/vector/embedding-service';
import { storeTopicEmbedding, storeStatementEmbedding } from '@/lib/vector/pgvector-client';

const directus = createClient();

interface GenerateEmbeddingRequest {
  collection: 'topics' | 'statements';
  item_id: string;
  force?: boolean; // Force regeneration even if embedding exists
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateEmbeddingRequest;
    const { collection, item_id, force = false } = body;

    if (!collection || !item_id) {
      return NextResponse.json(
        { error: 'collection and item_id are required' },
        { status: 400 }
      );
    }

    if (!['topics', 'statements'].includes(collection)) {
      return NextResponse.json(
        { error: 'collection must be either "topics" or "statements"' },
        { status: 400 }
      );
    }

    // Fetch the item
    let item: any;
    try {
      const items = await directus.request(
        readItems(collection, {
          filter: { id: { _eq: item_id } },
          fields: ['id', 'canonical_title', 'description', 'overview', 'text', 'embedding', 'embedding_updated_at'],
          limit: 1,
        })
      );

      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: `Item ${item_id} not found in ${collection}` },
          { status: 404 }
        );
      }

      item = items[0];
    } catch (error) {
      console.error(`Error fetching item ${item_id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch item from database' },
        { status: 500 }
      );
    }

    // Check if embedding already exists
    if (item.embedding && !force) {
      return NextResponse.json({
        success: true,
        message: 'Embedding already exists',
        item_id,
        collection,
        embedding_updated_at: item.embedding_updated_at,
        skipped: true,
      });
    }

    // Prepare text for embedding based on collection
    let text: string;
    if (collection === 'topics') {
      text = prepareTextForEmbedding({
        canonical_title: item.canonical_title,
        description: item.description,
        overview: item.overview,
      });
    } else {
      // statements
      text = prepareTextForEmbedding({
        text: item.text,
      });
    }

    if (!text.trim()) {
      return NextResponse.json({
        success: false,
        message: 'No content available to generate embedding',
        item_id,
        collection,
        skipped: true,
      });
    }

    // Generate embedding
    const embeddingResponse = await generateEmbedding({ text });

    // Store embedding
    if (collection === 'topics') {
      await storeTopicEmbedding(
        item_id,
        embeddingResponse.embedding,
        embeddingResponse.model
      );
    } else {
      await storeStatementEmbedding(
        item_id,
        embeddingResponse.embedding,
        embeddingResponse.model
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Embedding generated successfully',
      item_id,
      collection,
      model: embeddingResponse.model,
      dimensions: embeddingResponse.dimensions,
      text_length: text.length,
    });
  } catch (error) {
    console.error('Generate Embedding API Error:', error);
    return handleApiError(error);
  }
}

// GET endpoint for status check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collection = searchParams.get('collection') as 'topics' | 'statements' | null;
  const item_id = searchParams.get('item_id');

  if (!collection || !item_id) {
    return NextResponse.json(
      { error: 'collection and item_id query parameters are required' },
      { status: 400 }
    );
  }

  try {
    // Check if item has embedding
    const items = await directus.request(
      readItems(collection, {
        filter: { id: { _eq: item_id } },
        fields: ['id', 'embedding', 'embedding_model', 'embedding_updated_at'],
        limit: 1,
      })
    );

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = items[0];
    const hasEmbedding = !!item.embedding;

    return NextResponse.json({
      item_id,
      collection,
      has_embedding: hasEmbedding,
      embedding_model: item.embedding_model,
      embedding_updated_at: item.embedding_updated_at,
    });
  } catch (error) {
    console.error('Check Embedding Status Error:', error);
    return handleApiError(error);
  }
}
