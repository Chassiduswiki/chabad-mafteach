import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

/**
 * GET /api/topic-collections
 * Get all topic collections (public ones for regular users, all for admins)
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const featured = searchParams.get('featured') === 'true';

        const filter: any = {};
        if (featured) {
            filter.is_featured = { _eq: true };
        }
        filter.is_public = { _eq: true }; // Only public collections for now

        const filterString = Object.keys(filter).map(key => `${key}=${JSON.stringify(filter[key])}`).join('&');

        const response = await fetch(`${process.env.DIRECTUS_URL}/items/topic_collections?limit=-1&fields=*&sort[]=-created_at&${filterString}`, {
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const collections = data.data;

            // Get topic counts for each collection
            const collectionsWithCounts = await Promise.all(
                collections.map(async (collection: any) => {
                    try {
                        const countResponse = await fetch(`${process.env.DIRECTUS_URL}/items/topic_collection_topics?aggregate[count]=topic_id&filter[collection_id][_eq]=${collection.id}`, {
                            headers: {
                                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (countResponse.ok) {
                            const countData = await countResponse.json();
                            return {
                                ...collection,
                                topicCount: countData.data?.[0]?.count?.topic_id || 0
                            };
                        } else {
                            return { ...collection, topicCount: 0 };
                        }
                    } catch (error) {
                        return { ...collection, topicCount: 0 };
                    }
                })
            );

            return NextResponse.json({ collections: collectionsWithCounts });
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Topic collections fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic collections' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/topic-collections
 * Create a new topic collection
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();

        const { title, description, isPublic = false, topicIds = [] } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Create slug from title
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Create the collection
        const createResponse = await fetch(`${process.env.DIRECTUS_URL}/items/topic_collections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                slug,
                description: description || '',
                is_featured: false,
                is_public: isPublic
            })
        });

        if (!createResponse.ok) {
            throw new Error(`HTTP ${createResponse.status}`);
        }

        const createData = await createResponse.json();
        const collection = createData.data;

        // Add topics to collection if provided
        if (topicIds.length > 0) {
            for (const topicId of topicIds) {
                const relationResponse = await fetch(`${process.env.DIRECTUS_URL}/items/topic_collection_topics`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        collection_id: collection.id,
                        topic_id: topicId,
                        order_index: topicIds.indexOf(topicId)
                    })
                });

                if (!relationResponse.ok) {
                    console.error(`Failed to add topic ${topicId} to collection`);
                }
            }
        }

        return NextResponse.json({ collection, success: true });
    } catch (error) {
        console.error('Topic collection creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create topic collection' },
            { status: 500 }
        );
    }
}
