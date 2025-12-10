//B"H
const fs = require('fs');
const path = require('path');

async function getEntireChabadLibraryBookSequential(idx) {

    // This helper function will handle the recursive fetching for a given item,
    // ensuring sequential data fetching.
    async function processItemSequential(item) {
        const id = item.id;
        const heading = item.heading;

        // --- FIRST REQUEST: Fetch data for the current item ---
        const data = await getData(id); // This is one request at a time

        // If 'data' has 'text' and 'haoros', it's a leaf node (actual content)
        if (data && data.text !== undefined && data.haoros !== undefined) {
            return {
                heading: heading,
                id: id,
                text: data.text,
                notes: data.haoros,
            };
        } else if (data && Array.isArray(data)) {
            // If 'data' is an array, it means it's a list of children
            const children = [];
            // --- SEQUENTIAL PROCESSING OF CHILDREN ---
            // Instead of Promise.all, we loop and await each child process
            for (const childItem of data) {
                const processedChild = await processItemSequential(childItem); // Recursive call, awaited
                children.push(processedChild);
            }

            return {
                heading: heading,
                id: id,
                children: children,
            };
        } else {
            // Handle cases where data might be empty or in an unexpected format
            console.warn(`Unexpected data format for id: ${id}`, data);
            return {
                heading: heading,
                id: id,
            };
        }
    }

    // --- INITIAL REQUEST: Fetch the top-level items ---
    const topLevelItems = await getData(idx); // This is the first request

    if (!Array.isArray(topLevelItems)) {
        console.error("Initial getData(idx) did not return an array. Cannot proceed.");
        return {};
    }

    const allBooks = {};
    // --- SEQUENTIAL PROCESSING OF TOP-LEVEL ITEMS ---
    for (const m of topLevelItems) {
        // 'm' is a top-level item with heading and id
        const processedBook = await processItemSequential(m); // Process each top-level item sequentially
        allBooks[m.heading] = processedBook;
    }

    return allBooks;
}



async function getEntireChabadLibraryBook(idx) {
    var start = await getData(idx)
    var all = {}
    for(var m of start) {
        var h = m.heading
        var id = m.id;
        var sub = await getData(id)
        var ch = [];
        all[h] = {
            id,
            children: ch
        }
        for(var s of sub) {
            var hd = s.heading;
            var idS = s.id;
           
            var ob = {
                heading: hd,
                id: idS,
                
            }
            var fin = await getData(idS)
            var t = fin.text
            var n = fin.haoros
           
            ob.text =t
            ob.notes = n;
            ch.push(ob)
         //   break;
        }
       // break;
    }
    return all;
}

function saveToFile(name, json) {
    const filePath = path.join(__dirname, '../../data', name); // Save to data folder
    fs.writeFileSync(filePath, JSON.stringify(json, null, "\t"));
    console.log(`Saved to ${filePath}`);
}
async function getData(id) {
    var d = await (await fetch(`https://chabadlibrary.org/books/api/main?path=/${id}`)).json()
    return d?.content?.data;
}

// Export functions for use in other scripts
module.exports = {
    getEntireChabadLibraryBookSequential,
    getEntireChabadLibraryBook,
    getData,
    saveToFile
};

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            console.log('Starting scrape of Shulchan Aruch...');
            const data = await getEntireChabadLibraryBookSequential(3100000000);
            saveToFile("Shulchan-Aruch.json", data);
            console.log('Scrape completed!');
        } catch (error) {
            console.error('Error during scraping:', error);
        }
    })();
}
