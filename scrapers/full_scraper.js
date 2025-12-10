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

async function scrapeSeferHamaamarimMelukat() {
    console.log('Starting scraper for book ID: 5899093...');

    // Get navigation
    const nav = await fetchJSON('https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/5899093');
    console.log('Got navigation with', nav.children.length, 'sections');

    const allData = {};
    let totalMaamarim = 0;

    for (let sectionIndex = 0; sectionIndex < nav.children.length; sectionIndex++) {
        const section = nav.children[sectionIndex];
        const sectionName = section['hebrew-title'] || `Section ${sectionIndex}`;
        allData[sectionName] = {};

        console.log(`Processing section ${sectionIndex + 1}/${nav.children.length}: ${sectionName}`);

        if (!section.children) {
            console.log('No maamarim in this section');
            continue;
        }

        for (let maamarIndex = 0; maamarIndex < section.children.length; maamarIndex++) {
            const maamar = section.children[maamarIndex];
            const maamarName = maamar['hebrew-title'];
            const articleId = maamar['article-id'];

            console.log(`  Processing maamar ${maamarIndex + 1}/${section.children.length}: ${maamarName.substring(0, 50)}...`);

            try {
                const content = await fetchJSON(`https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/${articleId}`);
                allData[sectionName][maamarName] = content.verses;
                totalMaamarim++;

                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`Error fetching maamar ${maamarName}:`, error.message);
            }
        }
    }

    // Save complete data
    fs.writeFileSync('Sefer_5899093_Full.json', JSON.stringify(allData, null, 2));
    console.log('\nScraping completed!');
    console.log(`Total maamarim scraped: ${totalMaamarim}`);
    console.log('Data saved to: Sefer_5899093_Full.json');

    return allData;
}

scrapeSeferHamaamarimMelukat().catch(console.error);
