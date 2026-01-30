/**
 * Create Idea Chain collections in Directus
 *
 * Run with: npx ts-node scripts/create-idea-chain-collections.ts
 */

import { createDirectus, rest, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

if (!DIRECTUS_TOKEN) {
    console.error('DIRECTUS_STATIC_TOKEN environment variable is required');
    process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(DIRECTUS_TOKEN));

interface CollectionMeta {
    collection: string;
    icon?: string;
    note?: string;
    hidden?: boolean;
    singleton?: boolean;
    translations?: any;
    archive_field?: string;
    archive_value?: string;
    unarchive_value?: string;
    archive_app_filter?: boolean;
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

// Collection definitions based on the technical spec
const collections: CollectionDefinition[] = [
    // 1. idea_chains - Main container
    {
        collection: 'idea_chains',
        meta: {
            collection: 'idea_chains',
            icon: 'account_tree',
            note: 'Idea chains tracing intellectual genealogy through Chassidic literature',
            hidden: false,
            singleton: false,
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'title',
                type: 'string',
                schema: { max_length: 255, is_nullable: false },
                meta: { field: 'title', interface: 'input', width: 'full', required: true, note: 'Name of the concept being traced' },
            },
            {
                field: 'title_hebrew',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: { field: 'title_hebrew', interface: 'input', width: 'full', note: 'Hebrew title' },
            },
            {
                field: 'slug',
                type: 'string',
                schema: { max_length: 255, is_nullable: false, is_unique: true },
                meta: { field: 'slug', interface: 'input', width: 'half', required: true, note: 'URL-safe identifier' },
            },
            {
                field: 'description',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'description', interface: 'input-rich-text-md', width: 'full', note: 'Editorial summary of what this chain traces' },
            },
            {
                field: 'status',
                type: 'string',
                schema: { max_length: 20, default_value: 'draft', is_nullable: false },
                meta: {
                    field: 'status',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: { choices: [{ text: 'Draft', value: 'draft' }, { text: 'Review', value: 'review' }, { text: 'Published', value: 'published' }] },
                },
            },
            {
                field: 'is_featured',
                type: 'boolean',
                schema: { default_value: false, is_nullable: false },
                meta: { field: 'is_featured', interface: 'boolean', width: 'half', note: 'Highlight as specialty content' },
            },
            {
                field: 'cover_image',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: { field: 'cover_image', interface: 'file-image', special: ['file'] },
            },
            {
                field: 'user_created',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: { field: 'user_created', interface: 'select-dropdown-m2o', special: ['user-created'], readonly: true, hidden: true },
            },
            {
                field: 'date_created',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: { field: 'date_created', interface: 'datetime', special: ['date-created'], readonly: true, hidden: true },
            },
            {
                field: 'date_updated',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: { field: 'date_updated', interface: 'datetime', special: ['date-updated'], readonly: true, hidden: true },
            },
        ],
    },

    // 2. idea_chain_collaborators - Multi-scholar support
    {
        collection: 'idea_chain_collaborators',
        meta: {
            collection: 'idea_chain_collaborators',
            icon: 'group',
            note: 'Multi-scholar collaboration support for idea chains',
            hidden: false,
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'chain_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_chains', foreign_key_column: 'id' },
                meta: { field: 'chain_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'user_id',
                type: 'uuid',
                schema: { is_nullable: false },
                meta: { field: 'user_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'role',
                type: 'string',
                schema: { max_length: 20, default_value: 'viewer', is_nullable: false },
                meta: {
                    field: 'role',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: { choices: [{ text: 'Owner', value: 'owner' }, { text: 'Editor', value: 'editor' }, { text: 'Viewer', value: 'viewer' }] },
                },
            },
            {
                field: 'invited_by',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: { field: 'invited_by', interface: 'select-dropdown-m2o', special: ['m2o'] },
            },
            {
                field: 'date_added',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: { field: 'date_added', interface: 'datetime', special: ['date-created'], readonly: true },
            },
        ],
    },

    // 3. idea_chain_versions - Version history
    {
        collection: 'idea_chain_versions',
        meta: {
            collection: 'idea_chain_versions',
            icon: 'history',
            note: 'Version history for tracking chain evolution',
            hidden: false,
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'chain_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_chains', foreign_key_column: 'id' },
                meta: { field: 'chain_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'version_number',
                type: 'integer',
                schema: { is_nullable: false },
                meta: { field: 'version_number', interface: 'input', width: 'half', required: true },
            },
            {
                field: 'snapshot',
                type: 'json',
                schema: { is_nullable: false },
                meta: { field: 'snapshot', interface: 'input-code', options: { language: 'json' }, note: 'Full chain state at this version' },
            },
            {
                field: 'change_summary',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'change_summary', interface: 'input-multiline', note: 'What changed in this version' },
            },
            {
                field: 'user_created',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: { field: 'user_created', interface: 'select-dropdown-m2o', special: ['user-created'], readonly: true },
            },
            {
                field: 'date_created',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: { field: 'date_created', interface: 'datetime', special: ['date-created'], readonly: true },
            },
        ],
    },

    // 4. idea_nodes - Individual source contributions
    {
        collection: 'idea_nodes',
        meta: {
            collection: 'idea_nodes',
            icon: 'circle',
            note: 'Individual nodes in an idea chain representing source contributions',
            hidden: false,
            sort_field: 'position',
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'chain_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_chains', foreign_key_column: 'id' },
                meta: { field: 'chain_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'source_id',
                type: 'integer',
                schema: { is_nullable: true, foreign_key_table: 'sources', foreign_key_column: 'id' },
                meta: { field: 'source_id', interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Link to existing source' },
            },
            {
                field: 'citation_reference',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: { field: 'citation_reference', interface: 'input', width: 'full', note: 'Chapter-level reference (e.g., "Chapter 3", "Parshas Vayera")' },
            },
            {
                field: 'quote_hebrew',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'quote_hebrew', interface: 'input-multiline', note: 'Hebrew quotation from source' },
            },
            {
                field: 'quote_translated',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'quote_translated', interface: 'input-multiline', note: 'English translation of quote' },
            },
            {
                field: 'external_url',
                type: 'string',
                schema: { max_length: 500, is_nullable: true },
                meta: { field: 'external_url', interface: 'input', note: 'Link to Sefaria, HebrewBooks, etc.' },
            },
            {
                field: 'contribution_type',
                type: 'string',
                schema: { max_length: 20, default_value: 'expansion', is_nullable: false },
                meta: {
                    field: 'contribution_type',
                    interface: 'select-dropdown',
                    width: 'half',
                    required: true,
                    options: {
                        choices: [
                            { text: 'Origin', value: 'origin' },
                            { text: 'Expansion', value: 'expansion' },
                            { text: 'Application', value: 'application' },
                            { text: 'Counterpoint', value: 'counterpoint' },
                            { text: 'Synthesis', value: 'synthesis' },
                            { text: 'Reframe', value: 'reframe' },
                        ],
                    },
                },
            },
            {
                field: 'contribution_summary',
                type: 'text',
                schema: { is_nullable: false },
                meta: { field: 'contribution_summary', interface: 'input-multiline', required: true, note: 'What this node adds to the idea' },
            },
            {
                field: 'contribution_summary_hebrew',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'contribution_summary_hebrew', interface: 'input-multiline', note: 'Hebrew version of contribution summary' },
            },
            {
                field: 'base_idea_summary',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'base_idea_summary', interface: 'input-multiline', note: 'Optional: restate the inherited idea if complex' },
            },
            {
                field: 'approximate_year',
                type: 'integer',
                schema: { is_nullable: true },
                meta: { field: 'approximate_year', interface: 'input', width: 'half', note: 'For timeline ordering' },
            },
            {
                field: 'position',
                type: 'integer',
                schema: { is_nullable: true },
                meta: { field: 'position', interface: 'input', width: 'half', note: 'Display order hint' },
            },
            {
                field: 'is_origin',
                type: 'boolean',
                schema: { default_value: false, is_nullable: false },
                meta: { field: 'is_origin', interface: 'boolean', width: 'half', note: 'Marks this as a terminus/origin point' },
            },
            {
                field: 'metadata',
                type: 'json',
                schema: { is_nullable: true },
                meta: { field: 'metadata', interface: 'input-code', options: { language: 'json' }, hidden: true },
            },
            {
                field: 'user_created',
                type: 'uuid',
                schema: { is_nullable: true },
                meta: { field: 'user_created', interface: 'select-dropdown-m2o', special: ['user-created'], readonly: true, hidden: true },
            },
            {
                field: 'date_created',
                type: 'timestamp',
                schema: { is_nullable: true },
                meta: { field: 'date_created', interface: 'datetime', special: ['date-created'], readonly: true, hidden: true },
            },
        ],
    },

    // 5. idea_node_links - DAG edges
    {
        collection: 'idea_node_links',
        meta: {
            collection: 'idea_node_links',
            icon: 'link',
            note: 'Links between idea nodes (parent/child relationships)',
            hidden: false,
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'parent_node_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_nodes', foreign_key_column: 'id' },
                meta: { field: 'parent_node_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true, note: 'Earlier source' },
            },
            {
                field: 'child_node_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_nodes', foreign_key_column: 'id' },
                meta: { field: 'child_node_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true, note: 'Later source' },
            },
            {
                field: 'relationship_type',
                type: 'string',
                schema: { max_length: 20, default_value: 'builds_upon', is_nullable: false },
                meta: {
                    field: 'relationship_type',
                    interface: 'select-dropdown',
                    width: 'half',
                    options: {
                        choices: [
                            { text: 'Cites', value: 'cites' },
                            { text: 'Builds Upon', value: 'builds_upon' },
                            { text: 'Synthesizes With', value: 'synthesizes_with' },
                            { text: 'Reframes Via', value: 'reframes_via' },
                        ],
                    },
                },
            },
            {
                field: 'relationship_note',
                type: 'text',
                schema: { is_nullable: true },
                meta: { field: 'relationship_note', interface: 'input-multiline', note: 'Optional explanation of how they connect' },
            },
        ],
    },

    // 6. idea_chain_topics - Junction for embedding in topics
    {
        collection: 'idea_chain_topics',
        meta: {
            collection: 'idea_chain_topics',
            icon: 'hub',
            note: 'Links chains to topics for embedding',
            hidden: false,
        },
        fields: [
            {
                field: 'id',
                type: 'integer',
                schema: { is_primary_key: true, has_auto_increment: true },
                meta: { field: 'id', hidden: true, readonly: true },
            },
            {
                field: 'chain_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'idea_chains', foreign_key_column: 'id' },
                meta: { field: 'chain_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'topic_id',
                type: 'integer',
                schema: { is_nullable: false, foreign_key_table: 'topics', foreign_key_column: 'id' },
                meta: { field: 'topic_id', interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
            },
            {
                field: 'display_context',
                type: 'string',
                schema: { max_length: 255, is_nullable: true },
                meta: { field: 'display_context', interface: 'input', note: 'Where in the topic this chain appears' },
            },
            {
                field: 'order_index',
                type: 'integer',
                schema: { default_value: 0, is_nullable: false },
                meta: { field: 'order_index', interface: 'input', width: 'half', note: 'If multiple chains on one topic' },
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
        // idea_chain_collaborators -> idea_chains
        {
            collection: 'idea_chain_collaborators',
            field: 'chain_id',
            related_collection: 'idea_chains',
            meta: { one_field: 'collaborators', sort_field: null },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_chain_collaborators -> directus_users
        {
            collection: 'idea_chain_collaborators',
            field: 'user_id',
            related_collection: 'directus_users',
            meta: { one_field: null },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_chain_collaborators -> directus_users (invited_by)
        {
            collection: 'idea_chain_collaborators',
            field: 'invited_by',
            related_collection: 'directus_users',
            meta: { one_field: null },
            schema: { on_delete: 'SET NULL' },
        },
        // idea_chain_versions -> idea_chains
        {
            collection: 'idea_chain_versions',
            field: 'chain_id',
            related_collection: 'idea_chains',
            meta: { one_field: 'versions', sort_field: 'version_number' },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_nodes -> idea_chains
        {
            collection: 'idea_nodes',
            field: 'chain_id',
            related_collection: 'idea_chains',
            meta: { one_field: 'nodes', sort_field: 'position' },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_nodes -> sources
        {
            collection: 'idea_nodes',
            field: 'source_id',
            related_collection: 'sources',
            meta: { one_field: null },
            schema: { on_delete: 'SET NULL' },
        },
        // idea_node_links -> idea_nodes (parent)
        {
            collection: 'idea_node_links',
            field: 'parent_node_id',
            related_collection: 'idea_nodes',
            meta: { one_field: 'child_links', sort_field: null },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_node_links -> idea_nodes (child)
        {
            collection: 'idea_node_links',
            field: 'child_node_id',
            related_collection: 'idea_nodes',
            meta: { one_field: 'parent_links', sort_field: null },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_chain_topics -> idea_chains
        {
            collection: 'idea_chain_topics',
            field: 'chain_id',
            related_collection: 'idea_chains',
            meta: { one_field: 'topic_links', sort_field: 'order_index' },
            schema: { on_delete: 'CASCADE' },
        },
        // idea_chain_topics -> topics
        {
            collection: 'idea_chain_topics',
            field: 'topic_id',
            related_collection: 'topics',
            meta: { one_field: 'idea_chain_links', sort_field: 'order_index' },
            schema: { on_delete: 'CASCADE' },
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
    console.log('Creating Idea Chain collections in Directus...');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log(`Token: ${DIRECTUS_TOKEN?.slice(0, 10)}...`);

    // Create collections in order (parent tables first)
    const orderedCollections = [
        'idea_chains',
        'idea_chain_collaborators',
        'idea_chain_versions',
        'idea_nodes',
        'idea_node_links',
        'idea_chain_topics',
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
    console.log('3. Proceed with API routes and UI');
}

main().catch(console.error);
