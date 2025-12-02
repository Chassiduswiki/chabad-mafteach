const BASE_URL = 'http://localhost:8055';

async function setStaticToken() {
    try {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
        });
        const { data: { access_token } } = await loginRes.json();
        console.log('Got access token');

        // 2. Get current user ID
        const userRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const { data: user } = await userRes.json();
        console.log('User ID:', user.id);

        // 3. Update user with static token
        const staticToken = 'chabad_research_static_token_2025';
        const updateRes = await fetch(`${BASE_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({ token: staticToken })
        });

        if (updateRes.ok) {
            console.log('✅ Successfully set static token:', staticToken);
        } else {
            console.error('❌ Failed to set static token:', await updateRes.text());
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

setStaticToken();
