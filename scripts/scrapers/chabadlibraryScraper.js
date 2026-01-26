//B"H
const fs = require('fs');
const path = require('path');

const { parseTextIntoStatements } = require('../../lib/content/ingestion-parser');
const { routeContent } = require('../../lib/content/content-router');

async function getEntireChabadLibraryBookSequential(idx) {
    async function processItemSequential(item) {
        const id = item.id;
        const heading = item.heading;

        const data = await getData(id);

        if (data && data.text !== undefined && data.haoros !== undefined) {
            // Use advanced parser for leaf nodes
            const statements = parseTextIntoStatements(data.text, data.haoros);
            // Auto-detect content type for routing
            const routing = routeContent(heading, statements);
            
            return {
                heading: heading,
                id: id,
                type: routing.type,
                confidence: routing.confidence,
                routing_reason: routing.reasoning,
                statements: statements,
                raw_text: data.text,
                raw_notes: data.haoros,
            };
        } else if (data && Array.isArray(data)) {
            const children = [];
            for (const childItem of data) {
                const processedChild = await processItemSequential(childItem);
                children.push(processedChild);
            }

            return {
                heading: heading,
                id: id,
                children: children,
            };
        } else {
            console.warn(`Unexpected data format for id: ${id}`, data);
            return {
                heading: heading,
                id: id,
            };
        }
    }

    const topLevelItems = await getData(idx);

    if (!Array.isArray(topLevelItems)) {
        console.error("Initial getData(idx) did not return an array. Cannot proceed.");
        return {};
    }

    const allBooks = {};
    for (const m of topLevelItems) {
        const processedBook = await processItemSequential(m);
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
            console.log('Starting scrape of Tanya...');
            const data = await getEntireChabadLibraryBookSequential(3400000000);
            saveToFile("Tanya.json", data);
            console.log('Scrape completed!');
        } catch (error) {
            console.error('Error during scraping:', error);
        }
    })();
}
