// Example of how document breakdown works in different scenarios

/*
DOCUMENT BREAKDOWN EXPLANATION
===============================

The confusion comes from TWO DIFFERENT processing flows:

===============================================================================
FLOW 1: SEFER DOCUMENTS (Imported Books) - BACKWARD FLOW (Already Processed)
===============================================================================

External Source → Document → Paragraphs → Statements → Appended Text

Example: Importing "Tanya - Likkutei Amarim" from Sefaria

1. EXTERNAL SOURCE (Sefaria API)
   ↓
   Raw HTML content with embedded footnotes

2. DOCUMENT CREATION (in database)
   ↓
   {
     "title": "Tanya - Likkutei Amarim",
     "doc_type": "sefer",
     "original_lang": "he",
     "content": "<h2>ליקוטי אמרים</h2>תניא משביעים אותו...<div class=\"footnote\">1. Footnote content</div>"
   }

3. PARAGRAPH EXTRACTION (AI/API processing)
   ↓
   Splits document into logical paragraphs:
   [
     {
       "text": "<h2>ליקוטי אמרים</h2>תניא משביעים אותו...",
       "order_key": "001",
       "metadata": { "section_title": "ליקוטי אמרים" }
     }
   ]

4. STATEMENT BREAKDOWN (AI processing)
   ↓
   Splits paragraphs into individual statements:
   [
     {
       "text": "תניא משביעים אותו על מצות התפילה",
       "order_key": "001",
       "appended_text": "<div class=\"footnote\">1. Footnote content here</div>"
     }
   ]

5. DISPLAY IN TOPIC EDITOR
   ↓
   Shows the processed hierarchy: Document → Paragraph → Statements → Appended Text

===============================================================================
FLOW 2: ENTRY DOCUMENTS (User-Written) - FORWARD FLOW (Real-time Processing)
===============================================================================

User Writing → Citations Added → Document Saved → Statement Breaking → Appended Text

Example: Writing an article about "Free Will in Tanya"

1. USER WRITING (in /editor/write)
   ↓
   User types: "According to Tanya [1:1], free will is essential for..."

2. CITATION INSERTION (during writing)
   ↓
   User clicks citation button, enters "Tanya 1:1"
   Content becomes: "According to Tanya [Tanya 1:1], free will is essential for..."

3. DOCUMENT CREATION (when saved)
   ↓
   {
     "title": "Free Will in Tanya",
     "doc_type": "entry",
     "content": "According to Tanya [Tanya 1:1], free will is essential for...",
     "author": "current_user"
   }

4. STATEMENT BREAKDOWN (when "Break into Statements" clicked)
   ↓
   AI processes content and creates:
   [
     {
       "text": "According to Tanya, free will is essential for spiritual growth",
       "order_key": "001",
       "appended_text": "<citation source=\"Tanya\" reference=\"1:1\">Tanya 1:1</citation>"
     }
   ]

5. DISPLAY IN TOPIC EDITOR
   ↓
   Shows: Document → Paragraph → Statements → Appended Text (citations)

===============================================================================
KEY DIFFERENCES:
===============================================================================

SEFER DOCUMENTS:
- Content comes from external sources (Sefaria, PDFs, etc.)
- Processing happens during import
- Appended text = footnotes from original source
- Already structured when viewed in editor

ENTRY DOCUMENTS:
- Content created by users in the platform
- Citations added during writing process
- Appended text = user-added citations/references
- Processing happens on-demand when requested

===============================================================================
HOW THIS WORKS IN THE CURRENT EDITOR:
===============================================================================

1. TOPIC EDITOR VIEW (/editor/topics/[slug])
   - Shows processed content for ANY associated documents
   - Whether from sefer imports or entry documents
   - Displays: Document → Paragraphs → Statements → Appended Text

2. WRITING INTERFACE (/editor/write)
   - Users create entry documents
   - Add citations during writing
   - Citations become appended text when processed

3. IMPORT INTERFACE (/editor/import)
   - Creates sefer documents
   - Processes external content into structured format
   - Appended text comes from source footnotes

===============================================================================
THE "SCARY" PART EXPLANED:
===============================================================================

The "scary" part is how citations become appended text:

FOR ENTRY DOCUMENTS:
User writes: "As the Tanya teaches [1:1]..."
AI processes: "As the Tanya teaches..." + appended_text: "[1:1] reference"

FOR SEFER DOCUMENTS:
Source has: "Text with footnote 1"
AI processes: "Text..." + appended_text: "1. footnote content"

The "scary" part is that citations get separated from the main text and attached as metadata!
*/
