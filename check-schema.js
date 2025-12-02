const { createDirectus, rest, staticToken, readItems } = require('@directus/sdk');

const directus = createDirectus('http://localhost:8055')
    .with(staticToken('chabad_research_static_token_2025'))
    .with(rest());

async function checkSchema() {
    try {
        console.log('Checking Locations schema...');
        const locations = await directus.request(readItems('locations', {
            limit: 1
        }));

        if (locations.length > 0) {
            console.log('Location fields:', Object.keys(locations[0]));
            console.log('Sample Location:', JSON.stringify(locations[0], null, 2));
        } else {
            console.log('No locations found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
