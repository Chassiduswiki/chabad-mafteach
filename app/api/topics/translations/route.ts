import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { createItem, readItems, updateItem, deleteItem } from '@directus/sdk';
import { verifyAuth } from '@/lib/auth';

const directus = createClient();

// GET - Fetch translations for a topic
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topic_id');
        const lang = searchParams.get('lang');

        if (!topicId) {
            return NextResponse.json(
                { error: 'topic_id parameter required' },
                { status: 400 }
            );
        }

        const filter: any = { topic_id: { _eq: parseInt(topicId) } };
        if (lang) {
            filter.language_code = { _eq: lang };
        }

        const translations = await directus.request(
            readItems('topic_translations' as any, {
                filter,
                fields: ['*']
            })
        );

        return NextResponse.json(translations);
    } catch (error) {
        console.error('Translation fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch translations' },
            { status: 500 }
        );
    }
}

// POST - Create new translation
export async function POST(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';
        
        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Validate required fields
        if (!data.topic_id || !data.language_code || !data.title) {
            return NextResponse.json(
                { error: 'topic_id, language_code, and title are required' },
                { status: 400 }
            );
        }

        const translation = await directus.request(
            createItem('topic_translations' as any, data)
        );

        return NextResponse.json(translation, { status: 201 });
    } catch (error: any) {
        console.error('Translation creation error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to create translation' },
            { status: 500 }
        );
    }
}

// PATCH - Update translation
export async function PATCH(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';
        
        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'id parameter required' },
                { status: 400 }
            );
        }

        const updates = await request.json();

        const translation = await directus.request(
            updateItem('topic_translations' as any, parseInt(id), updates)
        );

        return NextResponse.json(translation);
    } catch (error: any) {
        console.error('Translation update error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to update translation' },
            { status: 500 }
        );
    }
}

// DELETE - Remove translation
export async function DELETE(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        const isDev = process.env.NODE_ENV === 'development';
        
        if (!auth && !isDev) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'id parameter required' },
                { status: 400 }
            );
        }

        await directus.request(
            deleteItem('topic_translations' as any, parseInt(id))
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Translation deletion error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to delete translation' },
            { status: 500 }
        );
    }
}
