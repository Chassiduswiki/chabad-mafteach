const BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'chabad_maftaiach_admin_token_3rtvyzp67n5bdd2mui3acd'; // Fallback to known token if env not loaded in script context

async function createCollection() {
    console.log('Creating topic_sources collection...');
    try {
        const res = await fetch(`${BASE_URL}/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                collection: 'topic_sources',
                meta: {
                    hidden: false,
                    icon: 'library_books',
                    note: 'Junction table linking topics to sources (locations)'
                },
                schema: {
                    comment: 'Junction table linking topics to sources'
                }
            })
        });

        if (!res.ok) {
            const err = await res.json();
            if (err.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
                console.log('Collection already exists.');
            } else {
                console.error('Failed to create collection:', JSON.stringify(err, null, 2));
                return false;
            }
        } else {
            console.log('Collection created.');
        }
        return true;
    } catch (e) {
        console.error('Error creating collection:', e);
        return false;
    }
}

async function createField(field, type, schema = {}, meta = {}) {
    console.log(`Creating field ${field}...`);
    try {
        const res = await fetch(`${BASE_URL}/fields/topic_sources`, {
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
            console.log(`Field ${field} created.`);
        }
    } catch (e) {
        console.error(`Error creating field ${field}:`, e);
    }
}

async function setup() {
    if (!await createCollection()) return;

    // Fields
    // 1. topic_id (M2O -> topics)
    await createField('topic_id', 'integer', {}, {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true
    });

    // 2. source_id (M2O -> locations)
    // Note: We link to 'locations' because a source is a specific location in a sefer
    await createField('source_id', 'integer', {}, {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true
    });

    // 3. citation_type
    await createField('citation_type', 'string', {
        default_value: 'primary'
    }, {
        interface: 'select-dropdown',
        options: {
            choices: [
                { text: 'Primary Source', value: 'primary' },
                { text: 'Secondary Source', value: 'secondary' },
                { text: 'Mention', value: 'mention' }
            ]
        }
    });

    // 4. quote
    await createField('quote', 'text', {}, {
        interface: 'textarea',
        note: 'Excerpt from the source'
    });

    // 5. notes
    await createField('notes', 'text', {}, {
        interface: 'textarea',
        note: 'Internal notes or explanation'
    });

    console.log('Schema setup complete.');
}

setup();
