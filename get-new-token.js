const BASE_URL = 'http://localhost:8055';

async function getNewToken() {
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
        });

        const { data: { access_token } } = await loginRes.json();
        console.log('New token:', access_token);

        // Test fetching topics
        const topicsRes = await fetch(`${BASE_URL}/items/topics`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const topics = await topicsRes.json();
        console.log('Topics:', JSON.stringify(topics.data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

getNewToken();
