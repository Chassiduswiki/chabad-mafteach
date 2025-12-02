const { createDirectus, rest, staticToken } = require('@directus/sdk');

const directus = createDirectus('http://localhost:8055')
    .with(staticToken('chabad_research_static_token_2025'))
    .with(rest());

async function addArticleField() {
    try {
        console.log('Adding article field to topics collection...');

        const response = await fetch('http://localhost:8055/fields/topics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer chabad_research_static_token_2025'
            },
            body: JSON.stringify({
                field: 'article',
                type: 'text',
                meta: {
                    interface: 'input-rich-text-md',
                    options: {
                        toolbar: [
                            'bold',
                            'italic',
                            'strikethrough',
                            'heading',
                            'blockquote',
                            'code',
                            'link',
                            'bullist',
                            'numlist',
                            'hr',
                            'fullscreen'
                        ]
                    },
                    note: 'Wikipedia-style long-form article with markdown support (including footnotes)'
                },
                schema: {
                    is_nullable: true,
                    default_value: null
                }
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Article field added successfully!');
            console.log('Field details:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Error adding field:', result);
        }
    } catch (error) {
        console.error('❌ Failed to add article field:', error.message);
    }
}

addArticleField();
