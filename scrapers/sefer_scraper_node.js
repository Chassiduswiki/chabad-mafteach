const fs = require('fs');
const path = require('path');
const https = require('https');

//B"H

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function getSeferHamaamarimMelukat(startIndex = 0) {
    console.log('Fetching book navigation...');
    const nav = await fetchJSON(
        "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962"
    );

    const sections = nav.children;
    if (!sections) {
        console.log('No children in navigation');
        return {};
    }

    console.log("Got", sections.length, "sections");

    const allData = {};

    for(let t = startIndex; t < sections.length; t++) {
        const section = sections[t];
        if(!section) continue;

        const sectionName = section["hebrew-title"] || "Section " + t;
        allData[sectionName] = {};
        console.log('Processing section:', sectionName);

        const maamarim = section.children;
        if (!maamarim) {
            console.log('No maamarim in section', sectionName);
            continue;
        }

        console.log('Found', maamarim.length, 'maamarim in section');

        for(let i = 0; i < maamarim.length; i++) {
            const maamar = maamarim[i];
            if(!maamar) continue;

            const articleId = maamar["article-id"];
            const maamarName = maamar["hebrew-title"];

            console.log('Processing maamar:', maamarName);

            try {
                const urlBase = "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/";
                const articleURL = urlBase + articleId;

                const art = await fetchJSON(articleURL);
                const v = art.verses;

                allData[sectionName][maamarName] = v;

                // Small delay to be respectful to the server
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error('Error fetching maamar:', maamarName, error.message);
            }
        }
    }

    return allData;
}

async function debugNavigation() {
    console.log('Fetching book navigation...');
    const nav = await fetchJSON(
        "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962"
    );

    console.log('Navigation structure:');
    console.log(JSON.stringify(nav, null, 2));
}

async function main() {
    try {
        console.log('Starting Sefer Hamaamarim Melukat scraper...');

        // Just test the first section
        console.log('Fetching book navigation...');
        const nav = await fetchJSON(
            "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962"
        );

        const sections = nav.children;
        console.log("Got", sections.length, "sections");

        // Process just first section
        const section = sections[0];
        const sectionName = section["hebrew-title"] || "Section 0";
        console.log('Processing section:', sectionName);

        const maamarim = section.children;
        if (!maamarim) {
            console.log('No maamarim in section', sectionName);
            return;
        }

        console.log('Found', maamarim.length, 'maamarim in section');

        // Process just first maamar
        const maamar = maamarim[0];
        const articleId = maamar["article-id"];
        const maamarName = maamar["hebrew-title"];

        console.log('Processing maamar:', maamarName);

        const urlBase = "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/";
        const articleURL = urlBase + articleId;

        console.log('Fetching from:', articleURL);
        const art = await fetchJSON(articleURL);
        const v = art.verses;

        console.log('Got verses:', v.length);

        const testData = {};
        testData[sectionName] = {};
        testData[sectionName][maamarName] = v;

        const outputPath = path.join(__dirname, 'test_output.json');
        fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

        console.log('Test completed! Check test_output.json');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
