import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

/**
 * GET /api/editor/translations
 * Get all translations for statements/paragraphs
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const statementId = searchParams.get('statementId');
        const paragraphId = searchParams.get('paragraphId');
        const language = searchParams.get('language');
        const status = searchParams.get('status');

        const filter: any = {};
        if (statementId) {
            filter.statement_id = { _eq: parseInt(statementId) };
        }
        if (paragraphId) {
            filter.paragraph_id = { _eq: parseInt(paragraphId) };
        }
        if (language) {
            filter.language_code = { _eq: language };
        }
        if (status) {
            filter.translation_status = { _eq: status };
        }

        const translations = await directus.request(readItems('statement_translations' as any, {
            filter,
            fields: ['*', { statement_id: ['text'], paragraph_id: ['text'] }],
            sort: ['language_code', 'created_at'],
            limit: -1
        })) as any[];

        return NextResponse.json({ translations });
    } catch (error) {
        console.error('Translations fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch translations' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/editor/translations
 * Create a new translation
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();

        const { statement_id, paragraph_id, language_code, translated_text, translator_notes, quality_score } = body;

        if (!language_code || !translated_text) {
            return NextResponse.json(
                { error: 'Language code and translated text are required' },
                { status: 400 }
            );
        }

        if (!statement_id && !paragraph_id) {
            return NextResponse.json(
                { error: 'Either statement_id or paragraph_id is required' },
                { status: 400 }
            );
        }

        const translation = await directus.request(createItem('statement_translations' as any, {
            statement_id: statement_id ? parseInt(statement_id) : null,
            paragraph_id: paragraph_id ? parseInt(paragraph_id) : null,
            language_code,
            translated_text,
            translator_notes: translator_notes || null,
            quality_score: quality_score || null,
            translation_status: 'draft',
            reviewed_by: null,
            reviewed_at: null
        })) as any;

        return NextResponse.json({ translation, success: true });
    } catch (error) {
        console.error('Translation creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create translation' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/editor/translations/[id]/review
 * Review a translation (approve/reject with quality score)
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<any> }
) {
    try {
        const resolvedParams = await context.params;
        const directus = createClient();
        const body = await request.json();
        const { id } = (resolvedParams as unknown) as { id: string };

        const { action, quality_score, review_notes } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Action must be either "approve" or "reject"' },
                { status: 400 }
            );
        }

        const updateData: any = {
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'current-user-id', // TODO: Get from auth
            review_notes: review_notes || null
        };

        if (action === 'approve') {
            updateData.translation_status = 'approved';
            updateData.quality_score = quality_score || 8; // Default quality score
        } else {
            updateData.translation_status = 'draft'; // Send back for revision
            updateData.quality_score = null;
        }

        const translation = await directus.request(updateItem('statement_translations' as any, id, updateData)) as any;

        return NextResponse.json({ translation, success: true });
    } catch (error) {
        console.error('Translation review error:', error);
        return NextResponse.json(
            { error: 'Failed to review translation' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/editor/translations/[id]
 * Delete a translation
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<any> }
) {
    try {
        const resolvedParams = await context.params;
        const directus = createClient();
        const { id } = (resolvedParams as unknown) as { id: string };

        await directus.request(deleteItem('statement_translations' as any, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Translation deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete translation' },
            { status: 500 }
        );
    }
}
