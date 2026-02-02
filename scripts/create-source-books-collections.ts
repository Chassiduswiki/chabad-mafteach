/**
 * Create Source Books collections in Directus
 *
 * These collections support the multi-platform source linking system,
 * enabling links to HebrewBooks, Chabad.org, Lahak, Sefaria, etc.
 *
 * Run with: npx ts-node scripts/create-source-books-collections.ts
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('DIRECTUS_STATIC_TOKEN environment variable is required');
    process.exit(1);
}

interface CollectionMeta {
    collection: string;
    icon?: string;
    note?: string;
    hidden?: boolean;
    singleton?: boolean;
    sort_field?: string;
    group?: string;
}

interface FieldSchema {
    name?: string;
    table?: string;
    data_type?: string;
    default_value?: any;
    max_length?: number;
    numeric_precision?: number;
    numeric_scale?: number;
    is_nullable?: boolean;
    is_unique?: boolean;
    is_primary_key?: boolean;
    has_auto_increment?: boolean;
    foreign_key_column?: string;
    foreign_key_table?: string;
}

interface FieldMeta {
    field: string;
    special?: string[];
    interface?: string;
    options?: Record<string, any>;
    display?: string;
    display_options?: Record<string, any>;
    readonly?: boolean;
    hidden?: boolean;
    sort?: number;
    width?: 'half' | 'half-left' | 'half-right' | 'full' | 'fill';
    translations?: any;
    note?: string;
    required?: boolean;
    group?: string;
}

interface FieldDefinition {
    field: string;
    type: string;
    schema?: FieldSchema;
    meta?: FieldMeta;
}

interface CollectionDefinition {
    collection: string;
    meta: CollectionMeta;
    fields: FieldDefinition[];
}

// Collection definitions based on the source linking brainstorm
const collections: CollectionDefinition[] = [
    // 1. source_books - The canonical book registry
    {
        collection: 'source_books',
        meta: {
            collection: 'source_books',
            icon: 'menu_book',
            note: 'Registry of Jewish texts with multi-platform linking support',
            hidden: false,
            singleton: false,
        },
        fields: [
            {
                field: 'id',
                type: 'uuid',
                schema: { is_primary_key: true, is_nullable: false },
                meta: { field: 'id', special: ['uuid'], hidden: true, readonly: true },
            },
            {
                field: 'status',
                type: 'string',
                schema: { max_length: 20, default_value: 'draft', is_nullable: false },
                meta: {
                    field: 'status',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: {
                        choices: [
                            { text: 'Draft', value: 'draft' },
                            { text: 'Published', value: 'published' },
                        ],
                    },
                },
            },
            // Basic Info
            {
                field: 'canonical_name',
                type: 'string',
                schema: { max_length: 255, is_nullable: false },
                meta: {
                    field: 'canonical_name',
                    interface: 'input',
                    width: 'half',
                    required: true,
                    note: 'Primary English name (e.g., "Derech Mitzvosecha")',
                },
            },
            {
                field: 'hebrew_name',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'hebrew_name',
                    interface: 'input',
                    width: 'half',
                    note: 'Hebrew name (e.g., "דרך מצוותיך")',
                },
            },
            {
                field: 'slug',
                type: 'string',
                schema: { max_length: 255, is_nullable: false, is_unique: true },
                meta: {
                    field: 'slug',
                    interface: 'input',
                    width: 'half',
                    required: true,
                    note: 'URL-safe identifier (e.g., "derech-mitzvosecha")',
                },
            },
            {
                field: 'alternate_names',
                type: 'json',
                schema: { is_nullable: true },
                meta: {
                    field: 'alternate_names',
                    interface: 'tags',
                    width: 'full',
                    note: 'Other spellings/names for search (e.g., ["Derech Mitzvotecha", "Way of the Commandments"])',
                },
            },
            {
                field: 'author',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'author',
                    interface: 'input',
                    width: 'half',
                    note: 'Author name',
                },
            },
            {
                field: 'year_written',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'year_written',
                    interface: 'input',
                    width: 'half',
                    note: 'Approximate year (negative for BCE)',
                },
            },
            {
                field: 'category',
                type: 'string',
                schema: { max_length: 50, is_nullable: true },
                meta: {
                    field: 'category',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: {
                        choices: [
                            { text: 'Chassidus', value: 'chassidus' },
                            { text: 'Halacha', value: 'halacha' },
                            { text: 'Kabbalah', value: 'kabbalah' },
                            { text: 'Mussar', value: 'mussar' },
                            { text: 'Tanach', value: 'tanach' },
                            { text: 'Talmud', value: 'talmud' },
                            { text: 'Midrash', value: 'midrash' },
                            { text: 'Sichos', value: 'sichos' },
                            { text: 'Maamarim', value: 'maamarim' },
                            { text: 'Other', value: 'other' },
                        ],
                    },
                },
            },
            {
                field: 'reference_style',
                type: 'string',
                schema: { max_length: 20, default_value: 'page', is_nullable: false },
                meta: {
                    field: 'reference_style',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: {
                        choices: [
                            { text: 'Page (1, 2, 3...)', value: 'page' },
                            { text: 'Folio (1a, 1b, 2a...)', value: 'folio' },
                            { text: 'Chapter', value: 'chapter' },
                            { text: 'Section', value: 'section' },
                        ],
                    },
                    note: 'How this book is traditionally cited',
                },
            },
            {
                field: 'total_pages',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'total_pages',
                    interface: 'input',
                    width: 'half',
                    note: 'Total printed pages (for validation)',
                },
            },
            {
                field: 'notes',
                type: 'text',
                schema: { is_nullable: true },
                meta: {
                    field: 'notes',
                    interface: 'input-multiline',
                    width: 'full',
                    note: 'Internal notes about this book',
                },
            },
            // HebrewBooks (PRIMARY platform)
            {
                field: 'hebrewbooks_id',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'hebrewbooks_id',
                    interface: 'input',
                    width: 'half',
                    note: 'HebrewBooks.org book ID (from URL)',
                },
            },
            {
                field: 'hebrewbooks_offset',
                type: 'integer',
                schema: { default_value: 0, is_nullable: false },
                meta: {
                    field: 'hebrewbooks_offset',
                    interface: 'input',
                    width: 'half',
                    note: 'PDF page offset (e.g., 10 means page 1 = PDF page 11)',
                },
            },
            // Chabad.org
            {
                field: 'chabad_org_root_id',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'chabad_org_root_id',
                    interface: 'input',
                    width: 'half',
                    note: 'Chabad.org torah-texts root ID (enables auto-sync)',
                },
            },
            {
                field: 'chabad_org_synced_at',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: {
                    field: 'chabad_org_synced_at',
                    interface: 'datetime',
                    width: 'half',
                    readonly: true,
                    note: 'Last time chapters were synced from Chabad.org API',
                },
            },
            // Lahak.org
            {
                field: 'lahak_root_id',
                type: 'string',
                schema: { max_length: 50, is_nullable: true },
                meta: {
                    field: 'lahak_root_id',
                    interface: 'input',
                    width: 'half',
                    note: 'Lahak.org content ID',
                },
            },
            // ChabadLibrary
            {
                field: 'chabadlibrary_id',
                type: 'string',
                schema: { max_length: 50, is_nullable: true },
                meta: {
                    field: 'chabadlibrary_id',
                    interface: 'input',
                    width: 'half',
                    note: 'ChabadLibrary.org book ID',
                },
            },
            // Sefaria
            {
                field: 'sefaria_slug',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'sefaria_slug',
                    interface: 'input',
                    width: 'half',
                    note: 'Sefaria book slug (e.g., "Derekh_Mitzvotekha")',
                },
            },
            // Timestamps
            {
                field: 'user_created',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: {
                    field: 'user_created',
                    interface: 'select-dropdown-m2o',
                    special: ['user-created'],
                    readonly: true,
                    hidden: true,
                },
            },
            {
                field: 'date_created',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: {
                    field: 'date_created',
                    interface: 'datetime',
                    special: ['date-created'],
                    readonly: true,
                    hidden: true,
                },
            },
            {
                field: 'date_updated',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: {
                    field: 'date_updated',
                    interface: 'datetime',
                    special: ['date-updated'],
                    readonly: true,
                    hidden: true,
                },
            },
        ],
    },

    // 2. source_book_chapters - Chapter/section definitions with platform IDs
    {
        collection: 'source_book_chapters',
        meta: {
            collection: 'source_book_chapters',
            icon: 'format_list_numbered',
            note: 'Chapters/sections of books with page boundaries and platform-specific IDs',
            hidden: false,
            singleton: false,
            sort_field: 'sort',
        },
        fields: [
            {
                field: 'id',
                type: 'uuid',
                schema: { is_primary_key: true, is_nullable: false },
                meta: { field: 'id', special: ['uuid'], hidden: true, readonly: true },
            },
            {
                field: 'book_id',
                type: 'uuid',
                schema: { is_nullable: false, foreign_key_table: 'source_books', foreign_key_column: 'id' },
                meta: {
                    field: 'book_id',
                    interface: 'select-dropdown-m2o',
                    special: ['m2o'],
                    required: true,
                    note: 'Parent book',
                },
            },
            {
                field: 'sort',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'sort',
                    interface: 'input',
                    width: 'half',
                    hidden: true,
                    note: 'Display order',
                },
            },
            // Chapter identification
            {
                field: 'chapter_number',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'chapter_number',
                    interface: 'input',
                    width: 'half',
                    note: 'Numeric chapter (if applicable)',
                },
            },
            {
                field: 'chapter_name',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'chapter_name',
                    interface: 'input',
                    width: 'full',
                    note: 'Hebrew chapter name (e.g., "מצות פריה ורביה")',
                },
            },
            {
                field: 'chapter_name_english',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'chapter_name_english',
                    interface: 'input',
                    width: 'full',
                    note: 'English chapter name (e.g., "The Mitzvah of Procreation")',
                },
            },
            // Page boundaries (enables page <-> chapter resolution)
            {
                field: 'start_page',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'start_page',
                    interface: 'input',
                    width: 'half',
                    note: 'First printed page of this chapter',
                },
            },
            {
                field: 'end_page',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'end_page',
                    interface: 'input',
                    width: 'half',
                    note: 'Last printed page of this chapter',
                },
            },
            // Platform-specific IDs
            {
                field: 'chabad_org_article_id',
                type: 'integer',
                schema: { is_nullable: true },
                meta: {
                    field: 'chabad_org_article_id',
                    interface: 'input',
                    width: 'half',
                    note: 'Chabad.org article ID (auto-synced)',
                },
            },
            {
                field: 'lahak_content_id',
                type: 'string',
                schema: { max_length: 50, is_nullable: true },
                meta: {
                    field: 'lahak_content_id',
                    interface: 'input',
                    width: 'half',
                    note: 'Lahak.org content ID for this chapter',
                },
            },
            {
                field: 'sefaria_ref',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: {
                    field: 'sefaria_ref',
                    interface: 'input',
                    width: 'full',
                    note: 'Sefaria reference path (e.g., "Derekh_Mitzvotekha,_Mitzvas_Peru_Urvu")',
                },
            },
            // Timestamps
            {
                field: 'date_created',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: {
                    field: 'date_created',
                    interface: 'datetime',
                    special: ['date-created'],
                    readonly: true,
                    hidden: true,
                },
            },
            {
                field: 'date_updated',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: {
                    field: 'date_updated',
                    interface: 'datetime',
                    special: ['date-updated'],
                    readonly: true,
                    hidden: true,
                },
            },
        ],
    },
];

async function createCollection(def: CollectionDefinition) {
    const { collection, meta, fields } = def;

    console.log(`\nCreating collection: ${collection}`);

    // First, create the collection with just the primary key field
    const primaryKeyField = fields.find(f => f.schema?.is_primary_key);
    if (!primaryKeyField) {
        throw new Error(`Collection ${collection} has no primary key field`);
    }

    const createCollectionPayload = {
        collection: meta.collection,
        meta: {
            icon: meta.icon,
            note: meta.note,
            hidden: meta.hidden ?? false,
            singleton: meta.singleton ?? false,
            sort_field: meta.sort_field,
        },
        schema: {},
        fields: [
            {
                field: primaryKeyField.field,
                type: primaryKeyField.type,
                schema: primaryKeyField.schema,
                meta: primaryKeyField.meta,
            },
        ],
    };

    try {
        const response = await fetch(`${DIRECTUS_URL}/collections`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createCollectionPayload),
        });

        if (!response.ok) {
            const error = await response.json();
            if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE' ||
                error.errors?.[0]?.message?.includes('already exists')) {
                console.log(`  Collection ${collection} already exists, skipping creation...`);
            } else {
                throw new Error(`Failed to create collection: ${JSON.stringify(error)}`);
            }
        } else {
            console.log(`  Created collection: ${collection}`);
        }
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            console.log(`  Collection ${collection} already exists, skipping...`);
        } else {
            throw error;
        }
    }

    // Now add the remaining fields
    const otherFields = fields.filter(f => !f.schema?.is_primary_key);

    for (const field of otherFields) {
        console.log(`  Adding field: ${field.field}`);

        try {
            const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field: field.field,
                    type: field.type,
                    schema: field.schema,
                    meta: field.meta,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE' ||
                    error.errors?.[0]?.message?.includes('already exists')) {
                    console.log(`    Field ${field.field} already exists, skipping...`);
                } else {
                    console.warn(`    Warning: Could not add field ${field.field}: ${JSON.stringify(error)}`);
                }
            } else {
                console.log(`    Added field: ${field.field}`);
            }
        } catch (error: any) {
            console.warn(`    Warning: Could not add field ${field.field}: ${error.message}`);
        }
    }
}

async function createRelations() {
    console.log('\n\nCreating relations...');

    const relations = [
        // source_book_chapters -> source_books
        {
            collection: 'source_book_chapters',
            field: 'book_id',
            related_collection: 'source_books',
            meta: { one_field: 'chapters', sort_field: 'sort' },
            schema: { on_delete: 'CASCADE' },
        },
        // source_books -> directus_users (user_created)
        {
            collection: 'source_books',
            field: 'user_created',
            related_collection: 'directus_users',
            meta: { one_field: null },
            schema: { on_delete: 'SET NULL' },
        },
    ];

    for (const relation of relations) {
        console.log(`  Creating relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}`);

        try {
            const response = await fetch(`${DIRECTUS_URL}/relations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(relation),
            });

            if (!response.ok) {
                const error = await response.json();
                if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE' ||
                    error.errors?.[0]?.message?.includes('already exists')) {
                    console.log(`    Relation already exists, skipping...`);
                } else {
                    console.warn(`    Warning: Could not create relation: ${JSON.stringify(error)}`);
                }
            } else {
                console.log(`    Created relation`);
            }
        } catch (error: any) {
            console.warn(`    Warning: Could not create relation: ${error.message}`);
        }
    }
}

async function main() {
    console.log('Creating Source Books collections in Directus...');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log(`Token: ${DIRECTUS_TOKEN?.slice(0, 10)}...`);

    // Create collections in order (parent tables first)
    const orderedCollections = [
        'source_books',
        'source_book_chapters',
    ];

    for (const collName of orderedCollections) {
        const def = collections.find(c => c.collection === collName);
        if (def) {
            await createCollection(def);
        }
    }

    // Create relations after all collections exist
    await createRelations();

    console.log('\n\nDone! Collections created successfully.');
    console.log('\nNext steps:');
    console.log('1. Check Directus admin UI to verify collections');
    console.log('2. Set up permissions for roles as needed');
    console.log('3. Add Derech Mitzvosecha as first test book');
    console.log('4. Run Chabad.org sync to auto-populate chapters');
}

main().catch(console.error);
