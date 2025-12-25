/**
 * Directus Schema Type Definitions
 * 
 * These interfaces define the structure of data in our Directus CMS.
 * Matches the new data model from Documentation/New-directus-data-model.md
 */

// ============ Core Collections ============

export interface Author {
    id: number;
    canonical_name: string;
    birth_year?: number;
    death_year?: number;
    era?: 'rishonim' | 'acharonim' | 'contemporary';
    bio_summary?: string;
}

export interface Document {
    id: number;
    title: string;
    doc_type?: 'entry' | 'sefer';
    original_lang?: string;
    status?: 'draft' | 'reviewed' | 'published' | 'archived';
    has_ocr?: boolean;
    ocr_confidence?: number;
    page_count?: number;
    source_format?: 'pdf' | 'html' | 'docx' | 'manual_entry';
    metadata?: Record<string, unknown>;
    published_at?: string;
    created_by?: string;
    parent_id?: number | Document;

    // Relations
    contentBlocks?: ContentBlock[]; // **[CHANGED]** from paragraphs?: Paragraph[];

    // Topic association
    topic?: string | Topic;

    // Legacy compatibility fields for citation system
    hebrewbooks_id?: number;
    title_hebrew?: string;
    author?: string;
    category?: 'tanach' | 'gemara' | 'rishonim' | 'acharonim' | 'chassidus' | 'other';
}

export interface Paragraph {
    id: number;
    order_key: string;
    original_lang?: string;
    text: string;
    status?: 'draft' | 'reviewed' | 'published';
    page_number?: number;
    column_number?: number;
    metadata?: Record<string, unknown>;
    doc_id?: number | Document;

    // Legacy compatibility fields for citation system
    reference_text?: string; // Alias for order_key
    reference_hebrew?: string;
    full_path?: string;
}

export interface ContentBlock {
    id: number;
    document_id?: number | Document;
    block_type?: 'heading' | 'subheading' | 'paragraph' | 'section_break';
    order_key: string;
    content: string;
    status?: 'draft' | 'reviewed' | 'published';

    // Citation fields
    page_number?: string;
    chapter_number?: number;
    halacha_number?: number;
    daf_number?: string;
    section_number?: number;
    citation_refs?: any[];

    metadata?: Record<string, unknown>;

    // Relations
    statements?: Statement[];
    block_commentaries?: BlockCommentary[];
}

export interface Statement {
    id: number;
    order_key: string;
    original_lang?: string;
    text: string;
    is_deleted?: boolean;
    status?: 'draft' | 'reviewed' | 'published';
    is_disputed?: boolean;
    importance_score?: number;
    metadata?: Record<string, unknown>;
    deleted_at?: string;
    block_id?: number; // Changed from paragraph_id
    deleted_by?: string;
}

export interface BlockCommentary {
    id: number;
    block_id?: number | ContentBlock;
    commentary_text: string;
    author?: string | Author;
    source?: string;
    commentary_type?: 'commentary' | 'translation' | 'cross_reference' | 'explanation';
    language?: string;
    order_position?: number;
    is_official?: boolean;
    quality_score?: number;
    moderation_status?: 'pending' | 'approved' | 'rejected' | 'flagged';
    reviewed_by?: number | Author;
    reviewed_at?: string;
    rejection_reason?: string;

    // Citation support for rabbit hole following
    citation_source?: number | Source; // Link to source document
    citation_page?: string; // Page reference in source
    citation_reference?: string; // Full citation string

    // Relations
    source_links?: SourceLink[]; // Citations within this commentary
}

export interface Source {
    id: number;
    title: string;
    original_lang?: string;
    publication_year?: number;
    publisher?: string;
    isbn?: string;
    is_external?: boolean;
    external_system?: 'sefaria' | 'wikisource' | 'hebrewbooks';
    external_id?: string;
    external_url?: string;
    citation_text?: string;
    metadata?: Record<string, unknown>;
    author_id?: number | Author;
    document_id?: number | Document; // Direct link to associated document
}

export interface SourceLink {
    id: number;
    relationship_type?: 'quotes' | 'paraphrases' | 'references' | 'supports' | 'contradicts' | 'refutes' | 'discusses' | 'alludes_to';
    page_number?: string;
    verse_reference?: string;
    section_reference?: string;
    confidence_level?: 'low' | 'medium' | 'high' | 'verified';
    notes?: string;
    verified_at?: string;
    statement_id?: number | Statement;
    source_id?: number | Source;
    verified_by?: string;
    created_by?: string;
}

export interface Topic {
    id: number;
    canonical_title: string;
    original_lang?: string;
    slug: string;
    topic_type?: 'person' | 'concept' | 'place' | 'event' | 'mitzvah' | 'sefirah';
    description?: string;
    metadata?: Record<string, unknown>;

    // Legacy compatibility fields (mapped from new schema)
    name?: string; // Alias for canonical_title
    name_hebrew?: string; // Can be fetched from translations table if needed
    name_transliteration?: string;
    alternate_names?: string[];
    category?: string; // Alias for topic_type
    definition_short?: string; // Alias for description

    // Content fields (can be stored in metadata or separate content table)
    definition_positive?: string;
    definition_negative?: string;
    overview?: string;
    article?: string;
    practical_takeaways?: string; // **[NEW]** Rich text field for practical applications
    historical_context?: string; // **[NEW]** Rich text field for historical background
    common_confusions?: { question: string; answer: string }[];
    key_concepts?: { concept: string; explanation: string; link?: string }[];

    // Related content (document > paragraphs > statements)
    paragraphs?: {
        id: number;
        text: string;
        order_key: string;
        document_title?: string;
        relevance_score?: number;
        statements?: {
            id: number;
            text: string;
            order_key: string;
        }[];
    }[];

    // Metadata fields
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    estimated_read_time?: number;
    view_count?: number;
    is_published?: boolean;
    meta_description?: string;
}

export interface Citation {
    id: number;
    text: string;
    appended_text?: string;
    document_title: string;
    document_id?: number;
    document_type?: string;
    order_key?: string;
    relevance_score?: number;
    is_primary?: boolean;
}

export interface TopicRelationship {
    id: number;
    relation_type?: 'subcategory' | 'instance_of' | 'part_of' | 'related_to' | 'sefirah_hierarchy' | 'chronological' | 'conceptual_parent';
    strength?: number;
    display_order?: number;
    description?: string;
    parent_topic_id?: number | Topic;
    child_topic_id?: number | Topic;
    created_by?: string;

    // Legacy compatibility fields
    from_topic?: number | Topic;
    to_topic?: number | Topic;
    relationship_type?: string;
}

export interface StatementTopic {
    id: number;
    relevance_score?: number;
    is_primary?: boolean;
    notes?: string;
    tagged_at?: string;
    statement_id?: number | Statement;
    topic_id?: number | Topic;
    tagged_by?: string;
}

export interface Translation {
    id: number;
    entity_type?: 'document' | 'paragraph' | 'statement' | 'topic' | 'author' | 'source';
    entity_id?: string;
    field_name?: string;
    target_lang?: string;
    translated_text?: string;
    translation_quality?: 'unverified' | 'machine' | 'human_draft' | 'human_verified' | 'professional';
    metadata?: Record<string, unknown>;
    translated_at?: string;
    verified_at?: string;
    translated_by?: string;
    verified_by?: string;
}

// ============ Directus SDK Schema ============

export interface Schema {
    authors: Author[];
    documents: Document[];
    paragraphs: Paragraph[];
    content_blocks: ContentBlock[];
    statements: Statement[];
    block_commentaries: BlockCommentary[];
    sources: Source[];
    source_links: SourceLink[];
    topics: Topic[];
    topic_relationships: TopicRelationship[];
    statement_topics: StatementTopic[];
    translations: Translation[];
}

// ============ Legacy Type Aliases ============
// These provide backward compatibility with old code that used different type names

/** @deprecated Use Document instead */
export type Sefer = Document;

/** @deprecated Use Paragraph instead */
export type Location = Paragraph;

/** @deprecated Use Statement instead */
export type Text = Statement;

/** @deprecated Use StatementTopic instead - maps topics to statements */
export interface TopicCitation {
    id: number;
    topic: Topic | number;
    location: Location | number;
    citation_role?: string;
    importance?: string;
    quoted_text_hebrew?: string;
    quoted_text_english?: string;
    context_note?: string;
    page_reference?: string;
    sort_order?: number;
    times_referenced?: number;
    is_primary_source?: boolean;
    is_verified?: boolean;
}

/** @deprecated Use TopicRelationship instead */
export type CitationReference = TopicRelationship;
