/**
 * Add Derech Mitzvosecha as first test book and sync chapters from Chabad.org
 *
 * Run with: npx ts-node scripts/add-derech-mitzvosecha.ts
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://directus-production-20db.up.railway.app';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

// Inline fetch function to avoid import issues
interface ChabadOrgNavigationChild {
    'article-id': number;
    'hebrew-title'?: string;
    'toc-hebrew-title'?: string;
}

interface ChabadOrgNavigationResponse {
    'article-id': number;
    children?: ChabadOrgNavigationChild[];
}

async function fetchChabadOrgChapters(rootId: number) {
    const response = await fetch(
        `https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/${rootId}`
    );

    if (!response.ok) {
        return { chapters: [], error: `API returned ${response.status}` };
    }

    const data: ChabadOrgNavigationResponse = await response.json();

    if (!data.children || !Array.isArray(data.children)) {
        return { chapters: [], error: 'No children found in response' };
    }

    const chapters = data.children.map((child, index) => ({
        sort: index + 1,
        chapter_name: child['hebrew-title'] || child['toc-hebrew-title'] || '',
        chabad_org_article_id: child['article-id'],
    }));

    return { chapters, error: undefined };
}

if (!DIRECTUS_TOKEN) {
    console.error('DIRECTUS_STATIC_TOKEN environment variable is required');
    process.exit(1);
}

// Derech Mitzvosecha book data
const derechMitzvosecha = {
    canonical_name: 'Derech Mitzvosecha',
    hebrew_name: 'דרך מצוותיך',
    slug: 'derech-mitzvosecha',
    alternate_names: ['Derech Mitzvotecha', 'Way of the Commandments', 'דרך מצותיך'],
    author: 'Rabbi Menachem Mendel of Lubavitch (Tzemach Tzedek)',
    year_written: 1840, // approximate
    category: 'chassidus',
    reference_style: 'chapter',
    status: 'published',
    // HebrewBooks
    hebrewbooks_id: 16082,
    hebrewbooks_offset: 10, // Page 1 = PDF page 11
    // Chabad.org
    chabad_org_root_id: 5580713,
    // Sefaria
    sefaria_slug: 'Derekh_Mitzvotekha',
    // ChabadLibrary
    chabadlibrary_id: '2900000000',
};

async function createBook() {
    console.log('Creating Derech Mitzvosecha book...');

    const response = await fetch(`${DIRECTUS_URL}/items/source_books`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(derechMitzvosecha),
    });

    if (!response.ok) {
        const error = await response.json();
        if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            console.log('Book already exists, fetching existing record...');
            // Fetch existing
            const existing = await fetch(
                `${DIRECTUS_URL}/items/source_books?filter[slug][_eq]=derech-mitzvosecha`,
                {
                    headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
                }
            );
            const data = await existing.json();
            return data.data[0];
        }
        throw new Error(`Failed to create book: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log(`Created book with ID: ${data.data.id}`);
    return data.data;
}

async function syncChapters(bookId: string) {
    console.log('\nFetching chapters from Chabad.org API...');

    const { chapters, error } = await fetchChabadOrgChapters(5580713);

    if (error) {
        console.error(`Error fetching chapters: ${error}`);
        return;
    }

    console.log(`Found ${chapters.length} chapters`);

    // Create chapters in Directus
    console.log('\nCreating chapters in Directus...');

    let created = 0;
    let skipped = 0;

    for (const chapter of chapters) {
        const chapterData = {
            book_id: bookId,
            sort: chapter.sort,
            chapter_name: chapter.chapter_name,
            chabad_org_article_id: chapter.chabad_org_article_id,
        };

        try {
            const response = await fetch(`${DIRECTUS_URL}/items/source_book_chapters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chapterData),
            });

            if (!response.ok) {
                const error = await response.json();
                if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
                    skipped++;
                    continue;
                }
                console.warn(`  Warning: Could not create chapter ${chapter.sort}: ${JSON.stringify(error)}`);
                continue;
            }

            created++;
            if (created <= 5 || created % 10 === 0) {
                console.log(`  Created chapter ${chapter.sort}: ${chapter.chapter_name}`);
            }
        } catch (err) {
            console.warn(`  Error creating chapter: ${err}`);
        }
    }

    console.log(`\nCreated ${created} chapters, skipped ${skipped} (already exist)`);

    // Update book sync timestamp
    await fetch(`${DIRECTUS_URL}/items/source_books/${bookId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chabad_org_synced_at: new Date().toISOString(),
        }),
    });

    console.log('Updated sync timestamp');
}

async function main() {
    console.log('Adding Derech Mitzvosecha to Source Books...');
    console.log(`URL: ${DIRECTUS_URL}\n`);

    // Create the book
    const book = await createBook();

    // Sync chapters from Chabad.org
    await syncChapters(book.id);

    console.log('\n✓ Done!');
    console.log('\nYou can now:');
    console.log('1. View the book in Directus admin');
    console.log('2. Add page boundaries to chapters manually');
    console.log('3. Test URL generation via the API');
}

main().catch(console.error);
