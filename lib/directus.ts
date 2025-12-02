import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

export interface Author {
    id: number;
    name: string;
    name_hebrew?: string;
    title?: string;
    lineage?: '1_alter_rebbe' | '2_mitteler_rebbe' | '3_tzemach_tzedek' | '4_maharash' | '5_rashab' | '6_rayatz' | '7_rebbe' | 'talmidim' | 'other';
    dates_hebrew?: string;
    dates_gregorian?: string;
    bio_short?: string;
}

export interface Sefer {
    id: number;
    title: string;
    title_hebrew?: string;
    title_transliteration?: string;
    author?: string;
    author_hebrew?: string;
    author_normalized?: Author | number;
    year_published?: number;
    structure_type?: 'section_chapter_paragraph' | 'volume_parsha_sicha_paragraph' | 'volume_page_paragraph' | 'page_paragraph' | 'custom';
    description?: string; // Markdown
    category?: 'tanach' | 'gemara' | 'rishonim' | 'acharonim' | 'chassidus' | 'other';
    external_url?: string;
    hebrewbooks_id?: number;
    is_active: boolean;
    sort_order: number;
}

export interface Location {
    id: number;
    sefer: Sefer | number;
    location_type: 'volume' | 'section' | 'chapter' | 'sicha' | 'maamar' | 'paragraph' | 'page' | 'line';
    reference_text: string; // "Chapter 34"
    reference_hebrew?: string; // "פרק לד"
    full_path?: string; // Auto-generated breadcrumb
    parent_location?: Location | number;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'scholarly';
    content_tags?: string[];
    word_count?: number;
    is_citable: boolean;
    sort_order: number;

    // Deprecated but kept for backward compatibility if needed
    section?: string;
    page?: string;
    chapter?: number;
    verse?: number;
    display_name?: string;
    ad_loc_on?: Location | number;
}

export interface Text {
    id: number;
    location: Location | number;
    language: 'hebrew' | 'english' | 'transliteration' | 'yiddish' | 'french' | 'russian';
    content: string; // HTML
    content_plain?: string;
    translator?: string;
    translation_source?: string;
    is_verified: boolean;
}

export interface Topic {
    id: number;
    slug: string;
    name: string;
    name_hebrew?: string;
    name_transliteration?: string;
    alternate_names?: string[];
    category?: 'avodah' | 'emunah' | 'theology' | 'kabbalah' | 'halacha' | 'people' | 'places' | 'events';

    // Content
    definition_short?: string;
    definition_positive?: string; // Markdown
    definition_negative?: string; // Markdown
    overview?: string; // Markdown
    article_content?: string; // Markdown (Long-form)
    practical_takeaways?: string; // Markdown
    common_confusions?: { question: string; answer: string }[];
    key_concepts?: { concept: string; explanation: string; link?: string }[];
    historical_context?: string;

    // Metadata
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    estimated_read_time?: number;
    view_count?: number;
    is_published?: boolean;
    meta_description?: string;
}

export interface TopicCitation {
    id: number;
    topic: Topic | number;
    location: Location | number;
    citation_role: 'definition' | 'boundary' | 'explanation' | 'comparison' | 'practical' | 'historical' | 'commentary' | 'example';
    importance?: 'foundational' | 'key' | 'supporting' | 'reference';
    quoted_text?: string; // HTML
    quoted_text_english?: string;
    context_note?: string;
    page_reference?: string;
    sort_order: number;
    times_referenced: number;
    is_primary_source: boolean;
    is_verified: boolean;
}

export interface TopicRelationship {
    id: number;
    from_topic: Topic | number;
    to_topic: Topic | number;
    relationship_type: 'related' | 'prerequisite' | 'comparison' | 'opposite' | 'subconcept' | 'progression';
    description?: string;
    bidirectional: boolean;
    strength: number;
}

export interface CitationReference {
    id: number;
    citing_citation: TopicCitation | number;
    referenced_citation: TopicCitation | number;
    reference_type: 'explains' | 'expands' | 'applies' | 'questions' | 'resolves';
}

export interface Schema {
    authors: Author[];
    seforim: Sefer[];
    locations: Location[];
    texts: Text[];
    topics: Topic[];
    topic_citations: TopicCitation[];
    topic_relationships: TopicRelationship[];
    citation_references: CitationReference[];
}

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const directusToken = process.env.DIRECTUS_STATIC_TOKEN || 'chabad_research_static_token_2025';

console.log('Directus Config:', {
    url: directusUrl,
    tokenLength: directusToken?.length,
    tokenStart: directusToken?.substring(0, 10)
});

if (!directusToken) {
    console.error('Missing DIRECTUS_STATIC_TOKEN environment variable');
}

const directus = createDirectus<Schema>(directusUrl)
    .with(staticToken(directusToken || ''))
    .with(rest());

export const getAllTopics = async () => {
    return directus.request(readItems('topics', {
        fields: ['id', 'name', 'slug', 'alternate_names'],
        limit: -1,
        filter: { is_published: { _eq: true } }
    }));
};

export default directus;
