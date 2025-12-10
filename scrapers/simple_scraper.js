const fs = require('fs');
const https = require('https');

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function scrape() {
    console.log('Starting scrape...');

    // Get navigation
    const nav = await fetchJSON('https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962');
    console.log('Got navigation with', nav.children.length, 'sections');

    const data = {};

    // Process first section only for testing
    const section = nav.children[0];
    const sectionName = section['hebrew-title'];
    data[sectionName] = {};

    console.log('Processing section:', sectionName);

    // Process first maamar only
    const maamar = section.children[0];
    const maamarName = maamar['hebrew-title'];
    const articleId = maamar['article-id'];

    console.log('Processing maamar:', maamarName);

    const content = await fetchJSON(`https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/${articleId}`);
    data[sectionName][maamarName] = content.verses;

    console.log('Got', content.verses.length, 'verses');

    fs.writeFileSync('simple_test.json', JSON.stringify(data, null, 2));
    console.log('Saved to simple_test.json');
}

scrape().catch(console.error);
