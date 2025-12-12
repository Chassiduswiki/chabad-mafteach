const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BASE_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
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

async function populateTanya() {
    // Read the scraped Tanya JSON
    const tanyaPath = path.join(__dirname, '../../data/Tanya.json');
    const tanyaData = JSON.parse(fs.readFileSync(tanyaPath, 'utf8'));

    // Get the main book data
    const bookKey = Object.keys(tanyaData)[0];
    const bookData = tanyaData[bookKey];

    // 1. Create Document for Tanya Book (sefer)
    const bookDocumentData = {
        title: bookData.heading,
        doc_type: 'sefer',
        original_lang: 'he',
        status: 'draft',
        source_format: 'html'
    };

    const bookDocument = await createItem('documents', bookDocumentData);
    if (!bookDocument) {
        console.error('Failed to create book document');
        return;
    }

    console.log(`Created book document: ${bookDocument.title} (ID: ${bookDocument.id})`);

    // 2. Create Chapter Documents (chapter type) as children of the book
    const chapters = bookData.children || [];
    let chapterNumber = 1;

    for (const chapter of chapters) {
        const chapterDocumentData = {
            title: chapter.heading,
            doc_type: 'chapter',
            original_lang: 'he',
            status: 'draft',
            source_format: 'html',
            parent_id: bookDocument.id
        };

        const chapterDocument = await createItem('documents', chapterDocumentData);
        if (!chapterDocument) {
            console.error(`Failed to create chapter document for ${chapter.heading}`);
            continue;
        }

        console.log(`Created chapter document: ${chapterDocument.title} (ID: ${chapterDocument.id})`);

        // 3. Create Content Blocks for chapter content blocks
        // Split the text by [cup] tags to create content blocks
        const text = chapter.text;
        const cupRegex = /\[cup\](.*?)\[\/cup\]/g;
        const hagohoRegex = /\[hagoho\](.*?)\[\/hagoho\]/g;
        const contentBlocks = [];
        let match;
        let lastIndex = 0;
        
        while ((match = cupRegex.exec(text)) !== null) {
            // Add any text before this cup block
            if (match.index > lastIndex) {
                const beforeText = text.substring(lastIndex, match.index).trim();
                if (beforeText) {
                    contentBlocks.push({ text: beforeText, type: 'paragraph', footnotes: [] });
                }
            }
            // Add the cup block content
            contentBlocks.push({ text: match[1].trim(), type: 'paragraph', footnotes: [] });
            lastIndex = cupRegex.lastIndex;
        }
        
        // Add any remaining text after the last cup block
        if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex).trim();
            if (remainingText) {
                contentBlocks.push({ text: remainingText, type: 'paragraph', footnotes: [] });
            }
        }
        
        // If no cup blocks found, treat the whole text as one content block
        if (contentBlocks.length === 0) {
            contentBlocks.push({ text: text, type: 'paragraph', footnotes: [] });
        }
        
        // Parse footnotes from the full chapter text
        const footnotes = [];
        let footnoteMatch;
        while ((footnoteMatch = hagohoRegex.exec(text)) !== null) {
            footnotes.push(footnoteMatch[1].trim());
        }
        
        // Create content_blocks for each content block
        let blockNumber = 1;
        for (const block of contentBlocks) {
            if (block.text.trim()) {
                const contentBlockData = {
                    document_id: chapterDocument.id,
                    block_type: block.type,
                    order_key: `${chapterNumber}.${blockNumber}`,
                    content: block.text.trim(),
                    order_position: blockNumber
                };

                const contentBlock = await createItem('content_blocks', contentBlockData);
                if (!contentBlock) {
                    console.error(`Failed to create content block ${blockNumber} for ${chapter.heading}`);
                    continue;
                }

                console.log(`Created content block ${blockNumber} for ${chapter.heading} (ID: ${contentBlock.id})`);

                // Create statements for this content block
                const appendedText = footnotes.length > 0 
                    ? footnotes.map(note => `<div class="footnote">${note}</div>`).join('')
                    : null;

                const statementData = {
                    block_id: contentBlock.id,
                    order_key: '1',
                    text: block.text.trim(),
                    original_lang: 'he',
                    status: 'draft',
                    ...(appendedText && { appended_text: appendedText })
                };

                const statement = await createItem('statements', statementData);
                if (statement) {
                    console.log(`Created statement for content block ${contentBlock.id} (ID: ${statement.id})`);
                } else {
                    console.error(`Failed to create statement for content block ${contentBlock.id}`);
                }

                blockNumber++;
            }
        }

        chapterNumber++;
    }

    console.log('Tanya population completed!');
}

populateTanya().catch(console.error);
