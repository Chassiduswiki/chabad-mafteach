import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { updateItem, deleteItem } from '@directus/sdk';

/**
 * PATCH /api/editor/statements/[id]
 * Update a statement
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const directus = createClient();
        const id = parseInt(params.id);
        const body = await request.json();

        const updateData: any = {};
        if (body.text !== undefined) updateData.text = body.text;
        if (body.order_key !== undefined) updateData.order_key = body.order_key;
        if (body.appended_text !== undefined) updateData.appended_text = body.appended_text;
        if (body.metadata !== undefined) updateData.metadata = body.metadata;

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/statements/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ statement: data.data, success: true });
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Statement update error:', error);
        return NextResponse.json(
            { error: 'Failed to update statement' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/editor/statements/[id]
 * Delete a statement
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const directus = createClient();
        const id = parseInt(params.id);

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/statements/${id}`, {
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
        console.error('Statement deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete statement' },
            { status: 500 }
        );
    }
}
