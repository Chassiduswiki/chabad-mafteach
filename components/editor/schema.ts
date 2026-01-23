import { Schema, NodeSpec, MarkSpec, DOMOutputSpec } from "prosemirror-model";

// Define the "Paragraph" node
const paragraph: NodeSpec = {
  attrs: {
    id: { default: null }, // The UUID from Directus
    status: { default: "draft" },
  },
  content: "inline*",
  group: "block",
  parseDOM: [
    {
      tag: "p",
      getAttrs(dom: HTMLElement) {
        return {
          id: dom.getAttribute("data-id"),
          status: dom.getAttribute("data-status") || "draft",
        };
      },
    },
  ],
  toDOM(node): DOMOutputSpec {
    // Detect if content contains Hebrew characters for RTL support
    const textContent = node.textContent || '';
    const hasHebrew = /[\u0590-\u05FF]/.test(textContent);
    const direction = hasHebrew ? 'rtl' : 'ltr';
    
    return [
      "p",
      {
        "data-id": node.attrs.id,
        "data-status": node.attrs.status,
        dir: direction,
        class: "mb-4 leading-relaxed text-gray-800 dir-auto", // Tailwind classes
      },
      0,
    ];
  },
};

// Define Heading nodes (H1, H2, H3)
const heading1: NodeSpec = {
  attrs: { level: { default: 1 } },
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [{ tag: "h1" }],
  toDOM(node): DOMOutputSpec {
    return ["h1", { class: "text-3xl font-bold mb-4 mt-8 text-gray-900" }, 0];
  },
};

const heading2: NodeSpec = {
  attrs: { level: { default: 2 } },
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [{ tag: "h2" }],
  toDOM(node): DOMOutputSpec {
    return ["h2", { class: "text-2xl font-bold mb-3 mt-6 text-gray-900" }, 0];
  },
};

const heading3: NodeSpec = {
  attrs: { level: { default: 3 } },
  content: "inline*",
  group: "block",
  defining: true,
  parseDOM: [{ tag: "h3" }],
  toDOM(node): DOMOutputSpec {
    return ["h3", { class: "text-xl font-semibold mb-3 mt-5 text-gray-900" }, 0];
  },
};

// Define List nodes
const bulletList: NodeSpec = {
  content: "listItem+",
  group: "block",
  parseDOM: [{ tag: "ul" }],
  toDOM(): DOMOutputSpec {
    return ["ul", { class: "list-disc list-inside mb-4 ml-4" }, 0];
  },
};

const orderedList: NodeSpec = {
  content: "listItem+",
  group: "block",
  parseDOM: [{ tag: "ol" }],
  toDOM(): DOMOutputSpec {
    return ["ol", { class: "list-decimal list-inside mb-4 ml-4" }, 0];
  },
};

const listItem: NodeSpec = {
  content: "paragraph block*",
  parseDOM: [{ tag: "li" }],
  toDOM(): DOMOutputSpec {
    return ["li", { class: "mb-1" }, 0];
  },
};

// Define Blockquote
const blockquote: NodeSpec = {
  content: "paragraph+",
  group: "block",
  parseDOM: [{ tag: "blockquote" }],
  toDOM(): DOMOutputSpec {
    return ["blockquote", { class: "border-l-4 border-gray-300 pl-4 italic mb-4 text-gray-700" }, 0];
  },
};

// Define Code Block
const codeBlock: NodeSpec = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
  toDOM(): DOMOutputSpec {
    return ["pre", { class: "bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto font-mono text-sm" }, ["code", 0]];
  },
};

// Define the "Doc" node (the root)
const doc: NodeSpec = {
  content: "(paragraph | heading1 | heading2 | heading3 | bulletList | orderedList | blockquote | codeBlock)+",
};

// Define the "Text" node
const text: NodeSpec = {
  group: "inline",
};

// Citation formatting helper
function formatCitation(attrs: any): string {
  const { source_title, citation_type, page_number, chapter_number, section_number, daf_number, verse_number, halacha_number, custom_reference } = attrs;
  
  if (!source_title) return "Unknown Source";
  
  let ref = "";
  
  switch (citation_type) {
    case "page":
      ref = page_number ? ` ${page_number}` : "";
      break;
    case "chapter":
      if (chapter_number) {
        ref = ` ch. ${chapter_number}`;
        if (section_number) ref += `:${section_number}`;
      }
      break;
    case "section":
      if (section_number) {
        ref = chapter_number ? ` ch. ${chapter_number}, §${section_number}` : ` §${section_number}`;
      }
      break;
    case "daf":
      ref = daf_number ? ` ${daf_number}` : "";
      break;
    case "verse":
      ref = verse_number ? ` ${verse_number}` : "";
      break;
    case "halacha":
      if (halacha_number) {
        ref = chapter_number ? ` ${chapter_number}:${halacha_number}` : ` ${halacha_number}`;
      }
      break;
    case "custom":
      ref = custom_reference ? ` ${custom_reference}` : "";
      break;
    default:
      // Fallback to old reference field if present
      ref = attrs.reference ? ` (${attrs.reference})` : "";
  }
  
  return `${source_title}${ref}`;
}

// Define the "Citation" node (Inline) - Enhanced with full citation types
const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "Unknown Source" },
    
    // Citation type determines which fields are relevant
    citation_type: { default: "page" }, // page|chapter|section|daf|verse|halacha|custom
    
    // Flexible reference fields (maps to content_blocks schema)
    page_number: { default: "" },
    chapter_number: { default: null },
    section_number: { default: null },
    daf_number: { default: "" },
    halacha_number: { default: null },
    verse_number: { default: "" },
    custom_reference: { default: "" },
    
    // Legacy field for backward compatibility
    reference: { default: "" },
  },
  inline: true,
  group: "inline",
  draggable: true,
  selectable: true, // Make selectable for editing
  atom: true, // Treat as atomic unit
  parseDOM: [
    {
      tag: "span[data-type='citation']",
      getAttrs(dom: HTMLElement) {
        return {
          source_id: dom.getAttribute("data-source-id"),
          source_title: dom.getAttribute("data-source-title"),
          citation_type: dom.getAttribute("data-citation-type") || "page",
          page_number: dom.getAttribute("data-page-number") || "",
          chapter_number: dom.getAttribute("data-chapter-number") ? parseInt(dom.getAttribute("data-chapter-number")!) : null,
          section_number: dom.getAttribute("data-section-number") ? parseInt(dom.getAttribute("data-section-number")!) : null,
          daf_number: dom.getAttribute("data-daf-number") || "",
          halacha_number: dom.getAttribute("data-halacha-number") ? parseInt(dom.getAttribute("data-halacha-number")!) : null,
          verse_number: dom.getAttribute("data-verse-number") || "",
          custom_reference: dom.getAttribute("data-custom-reference") || "",
          reference: dom.getAttribute("data-reference") || "",
        };
      },
    },
  ],
  toDOM(node): DOMOutputSpec {
    const display = formatCitation(node.attrs);
    
    return [
      "span",
      {
        "data-type": "citation",
        "data-source-id": node.attrs.source_id,
        "data-source-title": node.attrs.source_title,
        "data-citation-type": node.attrs.citation_type,
        "data-page-number": node.attrs.page_number || "",
        "data-chapter-number": node.attrs.chapter_number || "",
        "data-section-number": node.attrs.section_number || "",
        "data-daf-number": node.attrs.daf_number || "",
        "data-halacha-number": node.attrs.halacha_number || "",
        "data-verse-number": node.attrs.verse_number || "",
        "data-custom-reference": node.attrs.custom_reference || "",
        "data-reference": node.attrs.reference || "",
        class: "citation-node bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-medium mx-1 border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors",
        contenteditable: "false",
        title: "Click to edit citation"
      },
      display,
    ];
  },
};

// Define Marks
const strong: MarkSpec = {
  parseDOM: [{ tag: "strong" }, { tag: "b" }],
  toDOM(): DOMOutputSpec {
    return ["strong", { class: "font-semibold" }, 0];
  },
};

const em: MarkSpec = {
  parseDOM: [{ tag: "i" }, { tag: "em" }],
  toDOM(): DOMOutputSpec {
    return ["em", { class: "italic" }, 0];
  },
};

const code: MarkSpec = {
  parseDOM: [{ tag: "code" }],
  toDOM(): DOMOutputSpec {
    return ["code", { class: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" }, 0];
  },
};

const link: MarkSpec = {
  attrs: {
    href: {},
    title: { default: null }
  },
  inclusive: false,
  parseDOM: [{
    tag: "a[href]",
    getAttrs(dom: HTMLElement) {
      return {
        href: dom.getAttribute("href"),
        title: dom.getAttribute("title")
      };
    }
  }],
  toDOM(node): DOMOutputSpec {
    return ["a", {
      href: node.attrs.href,
      title: node.attrs.title,
      class: "text-blue-600 hover:text-blue-800 underline"
    }, 0];
  }
};

// Define the Schema
export const mySchema = new Schema({
  nodes: {
    doc,
    paragraph,
    heading1,
    heading2,
    heading3,
    bulletList,
    orderedList,
    listItem,
    blockquote,
    codeBlock,
    text,
    citation,
  },
  marks: {
    strong,
    em,
    code,
    link,
  },
});
