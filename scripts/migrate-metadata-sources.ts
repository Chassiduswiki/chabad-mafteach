/**
 * Migration Script: Convert topic.metadata.sources text to proper source links
 * 
 * This script:
 * 1. Finds all topics with metadata.sources (plain text arrays)
 * 2. For each source text, finds or creates a matching source record
 * 3. Creates topic_sources junction records to link them
 * 
 * Run with: npx tsx scripts/migrate-metadata-sources.ts
 */

import { createDirectus, rest, readItems, createItem, updateItem } from '@directus/sdk';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('ERROR: DIRECTUS_ADMIN_TOKEN environment variable is required');
    console.error('Run with: DIRECTUS_ADMIN_TOKEN=your_token npx tsx scripts/migrate-metadata-sources.ts');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(rest());

// Add auth header to requests
const authDirectus = {
    request: async (query: any) => {
        const response = await fetch(`${DIRECTUS_URL}${query.path}`, {
            method: query.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            },
            body: query.body ? JSON.stringify(query.body) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Directus API error: ${response.status} - ${JSON.stringify(error)}`);
        }
        return response.json();
    }
};

interface Topic {
    id: number;
    canonical_title: string;
    slug: string;
    metadata?: {
        sources?: string[];
        [key: string]: any;
    };
}

interface Source {
    id: number;
    title: string;
}

interface TopicSource {
    id: number;
    topic_id: number;
    source_id: number;
}

async function fetchTopicsWithMetadataSources(): Promise<Topic[]> {
    const response = await authDirectus.request({
        path: '/items/topics?filter[metadata][_nnull]=true&fields=id,canonical_title,slug,metadata&limit=-1',
        method: 'GET',
    });
    
    // Filter to only topics that have sources in metadata
    return (response.data || []).filter((t: Topic) => 
        t.metadata?.sources && Array.isArray(t.metadata.sources) && t.metadata.sources.length > 0
    );
}

async function fetchAllSources(): Promise<Source[]> {
    const response = await authDirectus.request({
        path: '/items/sources?fields=id,title&limit=-1',
        method: 'GET',
    });
    return response.data || [];
}

async function fetchExistingTopicSources(): Promise<TopicSource[]> {
    const response = await authDirectus.request({
        path: '/items/topic_sources?fields=id,topic_id,source_id&limit=-1',
        method: 'GET',
    });
    return response.data || [];
}

async function createSource(title: string): Promise<Source> {
    const response = await authDirectus.request({
        path: '/items/sources',
        method: 'POST',
        body: { title },
    });
    return response.data;
}

async function createTopicSource(topicId: number, sourceId: number, isPrimary: boolean = true): Promise<TopicSource> {
    const response = await authDirectus.request({
        path: '/items/topic_sources',
        method: 'POST',
        body: {
            topic_id: topicId,
            source_id: sourceId,
            relationship_type: 'references',
            is_primary: isPrimary,
        },
    });
    return response.data;
}

function normalizeTitle(title: string): string {
    return title.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findMatchingSource(sourceText: string, existingSources: Source[]): Source | null {
    const normalized = normalizeTitle(sourceText);
    
    // Exact match first
    const exactMatch = existingSources.find(s => normalizeTitle(s.title) === normalized);
    if (exactMatch) return exactMatch;
    
    // Partial match (source text contains existing title or vice versa)
    const partialMatch = existingSources.find(s => {
        const existingNorm = normalizeTitle(s.title);
        return normalized.includes(existingNorm) || existingNorm.includes(normalized);
    });
    
    return partialMatch || null;
}

async function migrate() {
    console.log('🚀 Starting metadata.sources migration...\n');
    
    // Fetch all data
    console.log('📥 Fetching topics with metadata.sources...');
    const topics = await fetchTopicsWithMetadataSources();
    console.log(`   Found ${topics.length} topics with metadata.sources\n`);
    
    console.log('📥 Fetching existing sources...');
    let existingSources = await fetchAllSources();
    console.log(`   Found ${existingSources.length} existing sources\n`);
    
    console.log('📥 Fetching existing topic_sources links...');
    const existingLinks = await fetchExistingTopicSources();
    console.log(`   Found ${existingLinks.length} existing links\n`);
    
    // Build a set of existing links for quick lookup
    const linkSet = new Set(existingLinks.map(l => `${l.topic_id}-${l.source_id}`));
    
    // Stats
    let sourcesCreated = 0;
    let linksCreated = 0;
    let linksSkipped = 0;
    let errors = 0;
    
    // Process each topic
    for (const topic of topics) {
        const sourceTexts = topic.metadata?.sources || [];
        console.log(`\n📖 Processing topic: "${topic.canonical_title}" (${sourceTexts.length} sources)`);
        
        for (let i = 0; i < sourceTexts.length; i++) {
            const sourceText = sourceTexts[i];
            if (!sourceText || typeof sourceText !== 'string' || !sourceText.trim()) {
                continue;
            }
            
            const cleanText = sourceText.trim();
            
            try {
                // Find or create source
                let source = findMatchingSource(cleanText, existingSources);
                
                if (!source) {
                    // Create new source
                    console.log(`   ➕ Creating source: "${cleanText.substring(0, 50)}..."`);
                    source = await createSource(cleanText);
                    existingSources.push(source); // Add to cache
                    sourcesCreated++;
                } else {
                    console.log(`   ✓ Found existing source: "${source.title.substring(0, 50)}..." (ID: ${source.id})`);
                }
                
                // Check if link already exists
                const linkKey = `${topic.id}-${source.id}`;
                if (linkSet.has(linkKey)) {
                    console.log(`   ⏭ Link already exists, skipping`);
                    linksSkipped++;
                    continue;
                }
                
                // Create the link
                const isPrimary = i === 0; // First source is primary
                await createTopicSource(topic.id, source.id, isPrimary);
                linkSet.add(linkKey);
                linksCreated++;
                console.log(`   🔗 Created link (primary: ${isPrimary})`);
                
            } catch (error) {
                console.error(`   ❌ Error processing "${cleanText.substring(0, 30)}...":`, (error as Error).message);
                errors++;
            }
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`   Topics processed: ${topics.length}`);
    console.log(`   Sources created:  ${sourcesCreated}`);
    console.log(`   Links created:    ${linksCreated}`);
    console.log(`   Links skipped:    ${linksSkipped} (already existed)`);
    console.log(`   Errors:           ${errors}`);
    console.log('='.repeat(60));
    
    if (errors > 0) {
        console.log('\n⚠️  Some errors occurred. Check the output above for details.');
    } else {
        console.log('\n✅ Migration completed successfully!');
    }
}

// Run migration
migrate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
