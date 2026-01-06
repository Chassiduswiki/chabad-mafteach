import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * POST /api/editor/import-export
 * Bulk import topics, paragraphs, and statements from JSON
 */
export async function POST(request: NextRequest) {
    try {
        const directus = createClient();
        const body = await request.json();
        const { data, type } = body;

        if (!data || !type) {
            return NextResponse.json(
                { error: 'Data and type are required' },
                { status: 400 }
            );
        }

        let results = [];

        switch (type) {
            case 'topics':
                results = await importTopics(directus, data);
                break;
            case 'paragraphs':
                results = await importParagraphs(directus, data);
                break;
            case 'statements':
                results = await importStatements(directus, data);
                break;
            case 'full':
                results = await importFullStructure(directus, data);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid import type. Must be: topics, paragraphs, statements, or full' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ 
            success: true, 
            results,
            message: `Successfully imported ${results.length} items`
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: 'Failed to import data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/editor/import-export
 * Export topics, paragraphs, and statements to JSON
 */
export async function GET(request: NextRequest) {
    try {
        const directus = createClient();
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'full';
        const topicId = searchParams.get('topicId');

        let data = {};

        switch (type) {
            case 'topics':
                data = await exportTopics(directus);
                break;
            case 'paragraphs':
                data = await exportParagraphs(directus, topicId);
                break;
            case 'statements':
                data = await exportStatements(directus, topicId);
                break;
            case 'full':
                data = await exportFullStructure(directus, topicId);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid export type. Must be: topics, paragraphs, statements, or full' },
                    { status: 400 }
                );
        }

        return NextResponse.json({ 
            data,
            exportedAt: new Date().toISOString(),
            type
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Import functions using REST API
async function importTopics(directus: any, topics: any[]): Promise<any[]> {
    const results = [];
    
    for (const topicData of topics) {
        try {
            const response = await fetch(`${process.env.DIRECTUS_URL}/items/topics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    canonical_title: topicData.canonical_title,
                    slug: topicData.slug || topicData.canonical_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    topic_type: topicData.topic_type || 'concept',
                    description: topicData.description || '',
                    definition_positive: topicData.definition_positive || '',
                    definition_negative: topicData.definition_negative || '',
                    metadata: topicData.metadata || {}
                })
            });

            if (response.ok) {
                const topic = await response.json();
                results.push({ type: 'topic', id: topic.data.id, success: true });
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            results.push({ type: 'topic', data: topicData, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    
    return results;
}

async function importParagraphs(directus: any, paragraphs: any[]): Promise<any[]> {
    const results = [];
    
    for (const paragraphData of paragraphs) {
        try {
            const response = await fetch(`${process.env.DIRECTUS_URL}/items/paragraphs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic_id: paragraphData.topic_id,
                    text: paragraphData.text,
                    order_key: paragraphData.order_key || 1,
                    document_id: paragraphData.document_id || null,
                    metadata: paragraphData.metadata || {}
                })
            });

            if (response.ok) {
                const paragraph = await response.json();
                results.push({ type: 'paragraph', id: paragraph.data.id, success: true });
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            results.push({ type: 'paragraph', data: paragraphData, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    
    return results;
}

async function importStatements(directus: any, statements: any[]): Promise<any[]> {
    const results = [];
    
    for (const statementData of statements) {
        try {
            const response = await fetch(`${process.env.DIRECTUS_URL}/items/statements`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paragraph_id: statementData.paragraph_id,
                    text: statementData.text,
                    order_key: statementData.order_key || 1,
                    appended_text: statementData.appended_text || null,
                    metadata: statementData.metadata || {}
                })
            });

            if (response.ok) {
                const statement = await response.json();
                results.push({ type: 'statement', id: statement.data.id, success: true });
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            results.push({ type: 'statement', data: statementData, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    
    return results;
}

async function importFullStructure(directus: any, data: any) {
    const results = [];
    
    // Import topics first
    if (data.topics) {
        const topicResults = await importTopics(directus, data.topics);
        results.push(...topicResults);
        
        // Create topic mapping for reference
        const topicMap = new Map();
        topicResults.forEach((result, index) => {
            if (result.success) {
                topicMap.set(data.topics[index].originalId || index, result.id);
            }
        });
        
        // Import paragraphs with updated topic IDs
        if (data.paragraphs) {
            const updatedParagraphs = data.paragraphs.map((p: any) => ({
                ...p,
                topic_id: topicMap.get(p.topic_original_id) || p.topic_id
            }));
            
            const paragraphResults = await importParagraphs(directus, updatedParagraphs);
            results.push(...paragraphResults);
            
            // Create paragraph mapping for reference
            const paragraphMap = new Map();
            paragraphResults.forEach((result, index) => {
                if (result.success) {
                    paragraphMap.set(data.paragraphs[index].originalId || index, result.id);
                }
            });
            
            // Import statements with updated paragraph IDs
            if (data.statements) {
                const updatedStatements = data.statements.map((s: any) => ({
                    ...s,
                    paragraph_id: paragraphMap.get(s.paragraph_original_id) || s.paragraph_id
                }));
                
                const statementResults = await importStatements(directus, updatedStatements);
                results.push(...statementResults);
            }
        }
    }
    
    return results;
}

// Export functions using REST API
async function exportTopics(directus: any) {
    const response = await fetch(`${process.env.DIRECTUS_URL}/items/topics?limit=-1&fields=*`, {
        headers: {
            'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        return { topics: data.data };
    } else {
        throw new Error(`HTTP ${response.status}`);
    }
}

async function exportParagraphs(directus: any, topicId?: string | null) {
    const filter = topicId ? `&filter[topic_id][_eq]=${topicId}` : '';
    const response = await fetch(`${process.env.DIRECTUS_URL}/items/paragraphs?limit=-1&fields=*&sort[]=topic_id&sort[]=order_key${filter}`, {
        headers: {
            'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        return { paragraphs: data.data };
    } else {
        throw new Error(`HTTP ${response.status}`);
    }
}

async function exportStatements(directus: any, topicId?: string | null) {
    let filter = '';
    
    if (topicId) {
        // Get paragraphs for this topic first
        const paragraphsResponse = await fetch(`${process.env.DIRECTUS_URL}/items/paragraphs?limit=-1&fields=id&filter[topic_id][_eq]=${topicId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (paragraphsResponse.ok) {
            const paragraphsData = await paragraphsResponse.json();
            const paragraphIds = paragraphsData.data.map((p: any) => p.id);
            filter = `&filter[paragraph_id][_in]=${paragraphIds.join(',')}`;
        }
    }
    
    const response = await fetch(`${process.env.DIRECTUS_URL}/items/statements?limit=-1&fields=*&sort[]=paragraph_id&sort[]=order_key${filter}`, {
        headers: {
            'Authorization': `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        return { statements: data.data };
    } else {
        throw new Error(`HTTP ${response.status}`);
    }
}

async function exportFullStructure(directus: any, topicId?: string | null) {
    const topics = await exportTopics(directus);
    const paragraphs = await exportParagraphs(directus, topicId);
    const statements = await exportStatements(directus, topicId);
    
    return {
        ...topics,
        ...paragraphs,
        ...statements,
        exportedAt: new Date().toISOString()
    };
}
