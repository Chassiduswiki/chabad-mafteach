import { createClient } from '@/lib/directus';
import { readItems, updateItem } from '@directus/sdk';
import { extractCitationReferences, createCitationMap, CitationReference } from '@/lib/citation-utils';

/**
 * Get topic by slug with associated content
 * 
 * OPTIMIZED: Uses deep queries to reduce N+1 query problems
 * 
 * @param slug Topic slug
 * @param lang Language code (default: 'en')
 * @returns Topic with content_blocks containing statements
 */
export async function getTopicBySlug(slug: string, lang: string = 'en') {
    try {
        const directus = createClient();

        // Normalize slug to lowercase for case-insensitive matching
        const normalizedSlug = slug.toLowerCase();

        // OPTIMIZED: Fetch topic with documents and nested content in fewer queries
        const topics = await directus.request(readItems('topics', {
            filter: { slug: { _eq: normalizedSlug } },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        const topic = topics[0];

        // Fetch translation for requested language
        let translation: any = null;
        try {
            const translations = await directus.request(readItems('topic_translations' as any, {
                filter: {
                    _and: [
                        { topic_id: { _eq: topic.id } },
                        { language_code: { _eq: lang } }
                    ]
                } as any,
                fields: ['*'],
                limit: 1
            }));

            if (translations && translations.length > 0) {
                translation = translations[0];
            } else {
                // Fallback to default language if requested language not found
                const defaultLang = (topic as any).default_language || 'he';
                if (lang !== defaultLang) {
                    const fallbackTranslations = await directus.request(readItems('topic_translations' as any, {
                        filter: {
                            _and: [
                                { topic_id: { _eq: topic.id } },
                                { language_code: { _eq: defaultLang } }
                            ]
                        } as any,
                        fields: ['*'],
                        limit: 1
                    }));
                    if (fallbackTranslations && fallbackTranslations.length > 0) {
                        translation = fallbackTranslations[0];
                    }
                }
            }
        } catch (translationError) {
            console.warn('Failed to fetch translation:', translationError);
            // Continue without translation - will use legacy fields
        }

        let contentBlocks: any[] = [];
        let validStatementTopics: any[] = [];
        
        try {
            // OPTIMIZED: Single query with deep nested fields instead of 3 separate queries
            const topicDocuments = await directus.request(readItems('documents', {
                filter: { topic: { _eq: topic.id } } as any,
                fields: [
                    'id', 'title', 'doc_type',
                    // Deep query: get content_blocks with their statements in one request
                    { content_blocks: ['id', 'content', 'order_key', 'block_type', { statements: ['id', 'text', 'order_key', 'block_id'] }] } as any
                ],
                limit: -1
            })) as any[];

            console.log(`Topic ${topic.id}: Found ${topicDocuments.length} documents (optimized query)`);

            // Process the nested data structure
            for (const doc of topicDocuments) {
                const docBlocks = doc.content_blocks || [];
                for (const block of docBlocks) {
                    contentBlocks.push({
                        id: block.id,
                        content: block.content,
                        order_key: block.order_key,
                        block_type: block.block_type,
                        document_title: doc.title || 'Unknown Document',
                        statements: (block.statements || []).map((stmt: any) => ({
                            id: stmt.id,
                            text: stmt.text,
                            order_key: stmt.order_key
                        }))
                    });
                }
            }

            // Sort content blocks by order_key
            contentBlocks.sort((a, b) => (a.order_key || '').localeCompare(b.order_key || ''));
            console.log(`Processed ${contentBlocks.length} content_blocks with nested statements`);

            // SECONDARY: Get additional statement_topics for sources/citations
            try {
                const statementTopics = await directus.request(readItems('statement_topics', {
                    filter: {
                        topic_id: { _eq: topic.id }
                    } as any,
                    fields: ['statement_id', 'relevance_score', 'is_primary'],
                    sort: ['-relevance_score'] as any,
                    limit: -1
                })) as any[];

                console.log(`Found ${statementTopics.length} statement_topics records for topic ${topic.id}`);

                if (statementTopics.length > 0) {
                    const statementIds = Array.from(new Set(statementTopics.map(st => st.statement_id).filter(id => !!id)));

                    if (statementIds.length > 0) {
                        // Fetch the actual statements
                        const citationStatements = await directus.request(readItems('statements', {
                            filter: { id: { _in: statementIds } } as any,
                            fields: ['id', 'text', 'appended_text', 'block_id', 'order_key'],
                            limit: -1
                        })) as any[];

                        console.log(`Fetched ${citationStatements.length} statements for citations`);

                        // Fetch blocks and documents for these statements
                        const blockIds = Array.from(new Set(citationStatements.map(s => s.block_id).filter(id => !!id)));
                        if (blockIds.length > 0) {
                            const blocks = await directus.request(readItems('content_blocks' as any, {
                                filter: { id: { _in: blockIds } } as any,
                                fields: ['id', 'document_id', 'order_key'],
                                limit: -1
                            })) as any[];

                            const docIds = Array.from(new Set(blocks.map(b => b.document_id).filter(id => !!id)));
                            if (docIds.length > 0) {
                                const docs = await directus.request(readItems('documents', {
                                    filter: { id: { _in: docIds } } as any,
                                    fields: ['id', 'title', 'doc_type'],
                                    limit: -1
                                })) as any[];

                                // Map everything together
                                validStatementTopics = citationStatements.map(stmt => {
                                    const block = blocks.find(b => b.id === stmt.block_id);
                                    const doc = block ? docs.find(d => d.id === block.document_id) : null;
                                    const stRecord = statementTopics.find(st => st.statement_id === stmt.id);

                                    return {
                                        id: stmt.id,
                                        text: stmt.text,
                                        appended_text: stmt.appended_text,
                                        document_title: doc?.title || 'Unknown Source',
                                        document_id: doc?.id,
                                        document_type: doc?.doc_type,
                                        order_key: stmt.order_key,
                                        relevance_score: stRecord?.relevance_score,
                                        is_primary: stRecord?.is_primary
                                    };
                                });
                            }
                        }
                    }
                }
                console.log(`Processed ${validStatementTopics.length} enriched citations`);
            } catch (statementTopicsError) {
                console.warn('Failed to fetch enriched citations:', (statementTopicsError as any)?.message || statementTopicsError);
            }
        } catch (error) {
            console.warn('Failed to fetch topic content:', error);
        }

        // Fetch related topics from topic_relationships table
        let relatedTopics: any[] = [];
        try {
            // Get relationships where this topic is the parent
            const parentRelationships = await directus.request(readItems('topic_relationships', {
                filter: { parent_topic_id: { _eq: topic.id } } as any,
                fields: ['*', { child_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Get relationships where this topic is the child
            const childRelationships = await directus.request(readItems('topic_relationships', {
                filter: { child_topic_id: { _eq: topic.id } } as any,
                fields: ['*', { parent_topic_id: ['id', 'canonical_title', 'slug', 'topic_type', 'description'] }] as any,
                sort: ['-strength'] as any
            })) as any[];

            // Combine and map to consistent format
            const parentTopics = parentRelationships.map(rel => ({
                ...rel.child_topic_id,
                relationship: {
                    type: rel.relation_type,
                    strength: rel.strength,
                    description: rel.description,
                    direction: 'child' // This topic is parent, related is child
                }
            }));

            const childTopics = childRelationships.map(rel => ({
                ...rel.parent_topic_id,
                relationship: {
                    type: rel.relation_type,
                    strength: rel.strength,
                    description: rel.description,
                    direction: 'parent' // This topic is child, related is parent
                }
            }));

            relatedTopics = [...parentTopics, ...childTopics];
        } catch (relationshipsError) {
            console.warn('Failed to fetch topic_relationships (likely permissions issue):', (relationshipsError as any)?.message || relationshipsError);
            // Continue without related topics - this is not critical
        }

        // Get linked sources from unified source_links table
        // Fetches both topic-level bibliography (statement_id is null) and statement-level citations
        let sources: any[] = [];
        let inlineCitations: any[] = [];
        try {
            // Fetch topic-level sources (bibliography)
            const topicSources = await directus.request(readItems('source_links' as any, {
                filter: { 
                    _and: [
                        { topic_id: { _eq: topic.id } },
                        { statement_id: { _null: true } }
                    ]
                } as any,
                fields: [
                    'id',
                    'relationship_type',
                    'page_number',
                    'verse_reference',
                    'section_reference',
                    'notes',
                    {
                        source_id: [
                            'id',
                            'title',
                            'publication_year',
                            'external_url',
                            'external_system',
                            'citation_text',
                            {
                                author_id: ['id', 'canonical_name', 'birth_year', 'death_year']
                            }
                        ]
                    }
                ] as any,
                sort: ['id'] as any
            })) as any[];

            console.log(`Found ${topicSources.length} topic-level sources for topic ${topic.id}`);

            // Transform to a cleaner format
            sources = topicSources.map(ts => ({
                id: ts.source_id?.id,
                title: ts.source_id?.title,
                author_id: ts.source_id?.author_id?.id,
                author: ts.source_id?.author_id?.canonical_name,
                publication_year: ts.source_id?.publication_year,
                external_url: ts.source_id?.external_url,
                external_system: ts.source_id?.external_system,
                citation_text: ts.source_id?.citation_text,
                // Link metadata
                link_id: ts.id,
                relationship_type: ts.relationship_type,
                page_number: ts.page_number,
                verse_reference: ts.verse_reference,
                section_reference: ts.section_reference,
                notes: ts.notes,
                is_primary: ts.notes?.includes('Primary'), // Infer from notes for now
                // Keep relationships array for backward compatibility
                relationships: [{
                    relationship_type: ts.relationship_type,
                    page_number: ts.page_number,
                    verse_reference: ts.verse_reference
                }]
            })).filter(s => s.id); // Filter out any with missing source data

            // Fetch statement-level citations (inline citations)
            // Get all statements for this topic first
            const statementIds = validStatementTopics.map(st => st.statement_id).filter(Boolean);
            
            if (statementIds.length > 0) {
                const citationLinks = await directus.request(readItems('source_links' as any, {
                    filter: { 
                        statement_id: { _in: statementIds }
                    } as any,
                    fields: [
                        'id',
                        'statement_id',
                        'relationship_type',
                        'page_number',
                        'verse_reference',
                        'section_reference',
                        'notes',
                        {
                            source_id: [
                                'id',
                                'title',
                                'publication_year',
                                'external_url',
                                'external_system',
                                {
                                    author_id: ['id', 'canonical_name', 'birth_year', 'death_year']
                                }
                            ]
                        }
                    ] as any
                })) as any[];

                console.log(`Found ${citationLinks.length} inline citations for topic ${topic.id}`);

                inlineCitations = citationLinks.map(cl => ({
                    id: cl.source_id?.id,
                    title: cl.source_id?.title,
                    author_id: cl.source_id?.author_id?.id,
                    author: cl.source_id?.author_id?.canonical_name,
                    publication_year: cl.source_id?.publication_year,
                    external_url: cl.source_id?.external_url,
                    external_system: cl.source_id?.external_system,
                    // Citation metadata
                    link_id: cl.id,
                    statement_id: cl.statement_id,
                    relationship_type: cl.relationship_type,
                    page_number: cl.page_number,
                    verse_reference: cl.verse_reference,
                    section_reference: cl.section_reference,
                    notes: cl.notes
                })).filter(c => c.id);
            }
        } catch (error) {
            console.warn('Could not fetch sources/citations (likely permissions):', error instanceof Error ? error.message : 'Unknown error');
            // Continue without sources - this is not critical
        }

        // Merge translation data with topic, preferring translation fields over legacy fields
        const mergedTopic = {
            ...topic,
            // Override with translation data if available
            title: translation?.title || topic.canonical_title || topic.name_hebrew,
            transliteration: translation?.transliteration || topic.canonical_title_transliteration,
            description: translation?.description || topic.description,
            overview: translation?.overview || topic.overview,
            article: translation?.article || topic.article,
            definition_positive: translation?.definition_positive || topic.definition_positive,
            definition_negative: translation?.definition_negative || topic.definition_negative,
            practical_takeaways: translation?.practical_takeaways || topic.practical_takeaways,
            historical_context: translation?.historical_context || topic.historical_context,
            mashal: translation?.mashal || topic.mashal,
            global_nimshal: translation?.global_nimshal || topic.global_nimshal,
            charts: translation?.charts || topic.charts,
            // Add translation metadata
            current_language: translation?.language_code || lang,
            translation_quality: translation?.translation_quality,
            is_machine_translated: translation?.is_machine_translated,
            contentBlocks // **[CHANGED]** from paragraphs
        };

        // Extract citation references from content fields
        let allCitationRefs: CitationReference[] = [];
        
        // Process each content field that might contain citations
        const contentFields = ['definition_positive', 'definition_negative', 'overview', 'article', 
            'mashal', 'practical_takeaways', 'global_nimshal', 'historical_context'];
        
        contentFields.forEach(field => {
            if (topic[field]) {
                try {
                    const fieldCitations = extractCitationReferences(topic[field]);
                    allCitationRefs = [...allCitationRefs, ...fieldCitations];
                } catch (error) {
                    console.warn(`Error extracting citations from ${field}:`, error);
                }
            }
        });
        
        // Create citation map for frontend use
        const citationMap = createCitationMap(allCitationRefs);
        
        // Return enriched topic with related data
        return {
            topic: {
                ...mergedTopic,
                citationMap
            },
            citations: validStatementTopics,
            relatedTopics,
            sources,
            inlineCitations
        };
    } catch (error) {
        console.error('Topic fetch error:', error);
        throw error;
    }
}

/**
 * Get all topics with minimal fields for sitemap/index
 */
export async function getAllTopics() {
    try {
        const directus = createClient();
        const topics = await directus.request(readItems('topics', {
            fields: ['id', 'slug', 'canonical_title', 'date_updated'],
            limit: -1
        }));
        return topics;
    } catch (error) {
        console.error('Error fetching all topics:', error);
        return [];
    }
}

/**
 * Update topic by slug
 *
 * @param slug Topic slug
 * @param updates Partial topic data to update
 * @returns Updated topic or null if not found
 */
export async function updateTopic(slug: string, updates: any) {
    try {
        const directus = createClient();
        const normalizedSlug = slug.toLowerCase();

        // First get the topic by slug to get its ID
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: normalizedSlug }
            },
            fields: ['id'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        const topicId = topics[0].id;

        // Update the topic
        const updatedTopic = await directus.request(updateItem('topics', topicId, updates));

        return updatedTopic;
    } catch (error) {
        console.error('Topic update error:', error);
        throw error;
    }
}

export async function getTopicMetadata(slug: string) {
    try {
        const directus = createClient();
        const normalizedSlug = slug.toLowerCase();

        // Fetch just the topic by slug
        const topics = await directus.request(readItems('topics', {
            filter: {
                slug: { _eq: normalizedSlug }
            },
            fields: ['*'],
            limit: 1
        }));

        if (!topics || topics.length === 0) {
            return null;
        }

        return topics[0];
    } catch (error) {
        console.error('Topic metadata fetch error:', error);
        throw error;
    }
}
