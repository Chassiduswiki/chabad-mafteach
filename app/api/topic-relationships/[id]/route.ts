import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItem, updateItem, deleteItem } from '@directus/sdk';
import { handleApiError } from '@/lib/utils/api-errors';

const directus = createClient();

// GET - Get a specific topic relationship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const relationship = await directus.request(
      readItem('topic_relationships', parseInt(id), {
        fields: [
          'id',
          'relation_type',
          'strength',
          'display_order',
          'description',
          'parent_topic_id',
          'child_topic_id',
        ],
      } as any)
    );

    return NextResponse.json({ data: relationship });
  } catch (error) {
    console.error('Failed to fetch topic relationship:', error);
    return handleApiError(error);
  }
}

// PATCH - Update a topic relationship
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { relation_type, strength, description, display_order } = body;

    const updateData: any = {};
    if (relation_type !== undefined) updateData.relation_type = relation_type;
    if (strength !== undefined) updateData.strength = strength;
    if (description !== undefined) updateData.description = description;
    if (display_order !== undefined) updateData.display_order = display_order;

    const updated = await directus.request(
      updateItem('topic_relationships', parseInt(id), updateData)
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to update topic relationship:', error);
    return handleApiError(error);
  }
}

// DELETE - Remove a topic relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await directus.request(
      deleteItem('topic_relationships', parseInt(id))
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete topic relationship:', error);
    return handleApiError(error);
  }
}
