const BASE_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'chabad_maftaiach_admin_token_3rtvyzp67n5bdd2mui3acd';

async function createItem(collection, data) {
    console.log(`Creating item in ${collection}...`);
    try {
        const res = await fetch(`${BASE_URL}/items/${collection}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            console.error(`Failed to create item in ${collection}:`, JSON.stringify(err, null, 2));
            return null;
        }

        const result = await res.json();
        console.log(`Item created in ${collection}:`, result.data.id);
        return result.data;
    } catch (e) {
        console.error(`Error creating item in ${collection}:`, e);
        return null;
    }
}

async function populate() {
    // 1. Create Location: Tanya Chapter 32
    const locationData = {
        sefer: 8, // Tanya
        chapter: 32,
        display_name: "Tanya, Likutei Amarim, Chapter 32"
    };

    const location = await createItem('locations', locationData);
    if (!location) return;

    // 2. Create Topic Source: Bittul -> Tanya Ch 32
    const sourceData = {
        topic_id: 1, // Bittul
        source_id: location.id,
        citation_type: 'primary',
        quote: "And this is the essence of the service of the heart... to nullify oneself completely...",
        notes: "Key source discussing Bittul HaYesh"
    };

    await createItem('topic_sources', sourceData);

    // 3. Create another Location: Tanya Chapter 18
    const location2 = await createItem('locations', {
        sefer: 8,
        chapter: 18,
        display_name: "Tanya, Likutei Amarim, Chapter 18"
    });

    if (location2) {
        await createItem('topic_sources', {
            topic_id: 1,
            source_id: location2.id,
            citation_type: 'secondary',
            quote: "Regarding the hidden love...",
            notes: "Discusses the natural bittul of the soul"
        });
    }
}

populate();
