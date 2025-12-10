const https = require('https');

async function testFetch() {
    return new Promise((resolve, reject) => {
        const url = "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962";
        console.log('Testing fetch to:', url);

        https.get(url, (res) => {
            console.log('Status:', res.statusCode);
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('Success! Got data with', json.children ? json.children.length : 'no', 'children');
                    resolve(json);
                } catch (e) {
                    console.error('JSON parse error:', e.message);
                    reject(e);
                }
            });
        }).on('error', (err) => {
            console.error('Request error:', err.message);
            reject(err);
        });
    });
}

testFetch().then(() => {
    console.log('Test completed');
}).catch(err => {
    console.error('Test failed:', err);
});
