import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem, deleteItem } from '@directus/sdk';

/**
 * PATCH /api/editor/paragraphs/[id]
 * Update a content block
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const directus = createClient();
        const id = parseInt(params.id);
        const body = await request.json();

        // Support both 'text' (frontend) and 'content' (DB)
        const updateData: any = {};
        if (body.text !== undefined) updateData.content = body.text;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.order_key !== undefined) updateData.order_key = body.order_key;
        if (body.block_type !== undefined) updateData.block_type = body.block_type;
        if (body.metadata !== undefined) updateData.metadata = body.metadata;

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/content_blocks/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                paragraph: { ...data.data, text: data.data.content },
                success: true
            });
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Content block update error:', error);
        return NextResponse.json(
            { error: 'Failed to update content block' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/editor/paragraphs/[id]
 * Delete a content block
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const directus = createClient();
        const id = parseInt(params.id);

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/content_blocks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`
            }
        });

        if (response.ok) {
            return NextResponse.json({ success: true });
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Content block deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete content block' },
            { status: 500 }
        );
    }
}
