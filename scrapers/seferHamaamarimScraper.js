//B"H
var file; // Global file handle

async function getSeferHamaamarimMelukat(startIndex = 0) {
    var nav = await fetch(
        "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-navigation/3139962"
    )
    var j = await nav.json();

    var sections = j.children;
    console.log("Got sections!", sections)

    var t;
    for(t = startIndex; t < sections.length; t++) {
        var section = sections[t];
        if(!section) continue;
        
        var subsections = section.children;
        console.log("Subsections", subsections)
        var i;
        for(i = 0; i < subsections.length; i++) {
            var pages = subsections[i].children;
            var c;
            console.log("pages", pages)
            for(c = 0; c < pages.length; c++) {
                var pg = pages[c];
                if(!pg) {
                    console.log("no page!", pg);
                    continue;
                }
                console.log("page", pages[c])
                var article = pg["article-id"];
                var urlBase = "https://www.chabad.org/api/v2/chabadorg/torahtexts/book-content/"

                var articleURL = urlBase + article;
                var pageName = pg["native-title-2"].split(" ").join("_");

                var art = await fetch(articleURL);
                var js = await art.json();

                var v = js.verses;    
                
                console.log("verses", v)
                var newFil = await file.getFileHandle(
                    pageName+".json", {
                        create:true
                    }
                )
                var wr = await newFil.createWritable();
                await wr.write(JSON.stringify(v));
                await wr.close();
            }   
        }
    }
}

// Function to initialize directory picker
async function initDirectoryPicker() {
    file = await showDirectoryPicker();
    return file;
}
