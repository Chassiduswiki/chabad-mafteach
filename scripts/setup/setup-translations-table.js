const BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'hAliuULIb4VaOpIkNa7vOFIRzMmYWPOl';

async function createTranslationsCollection() {
    console.log('Creating translations collection...');
    try {
        const res = await fetch(`${BASE_URL}/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                collection: 'translations',
                meta: {
                    hidden: false,
                    icon: 'translate',
                    note: 'Bilingual translations for all entities (topics, documents, etc.)'
                },
                schema: {
                    comment: 'Translations table for multilingual content'
                }
            })
        });

        if (!res.ok) {
            const err = await res.json();
            if (err.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
                console.log('Collection already exists.');
                return true;
            } else {
                console.error('Failed to create collection:', JSON.stringify(err, null, 2));
                return false;
            }
        } else {
            console.log('✅ Translations collection created.');
            return true;
        }
    } catch (e) {
        console.error('Error creating collection:', e);
        return false;
    }
}

async function createField(field, type, schema = {}, meta = {}) {
    console.log(`Creating field ${field}...`);
    try {
        const res = await fetch(`${BASE_URL}/fields/translations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                field,
                type,
                schema,
                meta
            })
        });

        if (!res.ok) {
            const err = await res.json();
            if (err.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
                console.log(`Field ${field} already exists.`);
            } else {
                console.error(`Failed to create field ${field}:`, JSON.stringify(err, null, 2));
            }
        } else {
            console.log(`✅ Field ${field} created.`);
        }
    } catch (e) {
        console.error(`Error creating field ${field}:`, e);
    }
}

async function setupTranslationsTable() {
    console.log('🚀 Setting up translations table...');

    // Create collection first
    if (!await createTranslationsCollection()) {
        console.log('❌ Failed to create translations collection');
        return;
    }

    // Create all the fields
    console.log('📝 Creating fields...');

    // entity_type - dropdown for entity types
    await createField('entity_type', 'string', {
        default_value: 'topic'
    }, {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Topic', value: 'topic' },
                { text: 'Document', value: 'document' },
                { text: 'Paragraph', value: 'paragraph' },
                { text: 'Statement', value: 'statement' },
                { text: 'Author', value: 'author' },
                { text: 'Source', value: 'source' }
            ]
        },
        required: true
    });

    // entity_id - relates to the entity being translated
    await createField('entity_id', 'integer', {}, {
        interface: 'input',
        required: true,
        note: 'ID of the entity being translated (topic ID, document ID, etc.)'
    });

    // field_name - which field is being translated
    await createField('field_name', 'string', {}, {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Title/Name', value: 'title' },
                { text: 'Canonical Title', value: 'canonical_title' },
                { text: 'Description', value: 'description' },
                { text: 'Text Content', value: 'text' },
                { text: 'Bio Summary', value: 'bio_summary' }
            ]
        },
        required: true
    });

    // target_lang - language code
    await createField('target_lang', 'string', {
        default_value: 'en',
        max_length: 10
    }, {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'English', value: 'en' },
                { text: 'Hebrew', value: 'he' },
                { text: 'Yiddish', value: 'yi' }
            ]
        },
        required: true
    });

    // translated_text - the actual translation
    await createField('translated_text', 'text', {}, {
        interface: 'textarea',
        required: true,
        note: 'The translated text content'
    });

    // translation_quality - quality assessment
    await createField('translation_quality', 'string', {
        default_value: 'unverified'
    }, {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Unverified', value: 'unverified' },
                { text: 'Machine Translation', value: 'machine' },
                { text: 'Human Draft', value: 'human_draft' },
                { text: 'Human Verified', value: 'human_verified' },
                { text: 'Professional', value: 'professional' }
            ]
        }
    });

    // metadata - additional info
    await createField('metadata', 'json', {}, {
        interface: 'key-value',
        note: 'Additional metadata (context, notes, etc.)'
    });

    // Timestamps
    await createField('translated_at', 'timestamp', {}, {
        interface: 'datetime',
        note: 'When this translation was created'
    });

    await createField('verified_at', 'timestamp', {}, {
        interface: 'datetime',
        note: 'When this translation was verified'
    });

    // User references (we'll use the directus_users table)
    await createField('translated_by', 'integer', {}, {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: 'User who created this translation'
    });

    await createField('verified_by', 'integer', {}, {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        note: 'User who verified this translation'
    });

    console.log('✅ Translations table setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Add sample translations for existing topics');
    console.log('2. Update API to fetch translations');
    console.log('3. Test bilingual display');
}

// Run the setup
setupTranslationsTable().catch(console.error);
