import { Schema, NodeSpec, MarkSpec, DOMOutputSpec } from "prosemirror-model";

// Define the "Paragraph" node
// This corresponds to a record in the 'paragraphs' collection
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
    return [
      "p",
      {
        "data-id": node.attrs.id,
        "data-status": node.attrs.status,
        class: "mb-4 leading-relaxed text-gray-800 dir-auto", // Tailwind classes
      },
      0,
    ];
  },
};

// Define the "Doc" node (the root)
const doc: NodeSpec = {
  content: "paragraph+",
};

// Define the "Text" node
const text: NodeSpec = {
  group: "inline",
};

// Define the "Citation" node (Inline)
const citation: NodeSpec = {
  attrs: {
    source_id: { default: null },
    source_title: { default: "Unknown Source" },
    reference: { default: "" }, // e.g. "p. 42" or "Verse 1"
  },
  inline: true,
  group: "inline",
  draggable: true,
  // Make sure we parse the span exactly as we save it
  parseDOM: [
    {
      tag: "span[data-type='citation']",
      getAttrs(dom: HTMLElement) {
        return {
          source_id: dom.getAttribute("data-source-id"),
          source_title: dom.getAttribute("data-source-title"),
          reference: dom.getAttribute("data-reference"),
        };
      },
    },
  ],
  toDOM(node): DOMOutputSpec {
    return [
      "span",
      {
        "data-type": "citation",
        "data-source-id": node.attrs.source_id,
        "data-source-title": node.attrs.source_title,
        "data-reference": node.attrs.reference,
        // Tailwind classes for the blue chip look
        class: "bg-blue-100 text-blue-800 px-1 rounded cursor-pointer mx-1 border border-blue-200 text-sm font-medium select-none",
        contenteditable: "false" // Important: keep the chip atomic
      },
      `${node.attrs.source_title} ${node.attrs.reference ? `(${node.attrs.reference})` : ""}`,
    ];
  },
};

// Define Marks (Bold, Italic)
const strong: MarkSpec = {
  parseDOM: [{ tag: "strong" }, { tag: "b" }],
  toDOM(): DOMOutputSpec {
    return ["strong", 0];
  },
};

const em: MarkSpec = {
  parseDOM: [{ tag: "i" }, { tag: "em" }],
  toDOM(): DOMOutputSpec {
    return ["em", 0];
  },
};

// Define the Schema
export const mySchema = new Schema({
  nodes: {
    doc,
    paragraph,
    text,
    citation,
  },
  marks: {
    strong,
    em,
  },
});
