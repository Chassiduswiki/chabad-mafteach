import { Plugin, PluginKey } from "prosemirror-state";
import {
  CitationAttrs,
  UnifiedCitation,
  unifiedToAttrs,
  attrsToUnified,
} from "@/lib/citations/types";

export const citationPluginKey = new PluginKey("citation-plugin");

// Re-export CitationAttrs for backwards compatibility
export type { CitationAttrs };

interface CitationPluginOptions {
  onTrigger?: (range: { from: number; to: number }) => void;
  onDismiss?: () => void;
  onClick?: (citation: CitationAttrs) => void;
  onEdit?: (citation: CitationAttrs, pos: number) => void;
}

export function createComprehensiveCitationPlugin(options: CitationPluginOptions = {}) {
  const { onTrigger = () => {}, onDismiss = () => {}, onClick = () => {}, onEdit } = options;

  return new Plugin({
    key: citationPluginKey,
    props: {
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement | null;
        if (!target) return false;

        const citationEl = target.closest("[data-type='citation']") as HTMLElement | null;
        if (!citationEl) return false;

        // Parse all citation attributes from DOM
        const citation: CitationAttrs = {
          source_id: citationEl.getAttribute("data-source-id") ? Number(citationEl.getAttribute("data-source-id")) || citationEl.getAttribute("data-source-id") : null,
          source_title: citationEl.getAttribute("data-source-title") || "Unknown Source",
          citation_type: citationEl.getAttribute("data-citation-type") || "page",
          page_number: citationEl.getAttribute("data-page-number") || "",
          chapter_number: citationEl.getAttribute("data-chapter-number") ? parseInt(citationEl.getAttribute("data-chapter-number")!) : null,
          section_number: citationEl.getAttribute("data-section-number") ? parseInt(citationEl.getAttribute("data-section-number")!) : null,
          daf_number: citationEl.getAttribute("data-daf-number") || "",
          halacha_number: citationEl.getAttribute("data-halacha-number") ? parseInt(citationEl.getAttribute("data-halacha-number")!) : null,
          verse_number: citationEl.getAttribute("data-verse-number") || "",
          custom_reference: citationEl.getAttribute("data-custom-reference") || "",
          reference: citationEl.getAttribute("data-reference") || "",
        };

        // Find the position of the citation node in the document
        const $pos = view.state.doc.resolve(pos);
        let citationPos = pos;
        
        // Check if we clicked inside a citation node
        if ($pos.parent.type.name === 'citation') {
          citationPos = $pos.before();
        } else {
          // Search for citation node at this position
          view.state.doc.nodesBetween(pos, pos + 1, (node, nodePos) => {
            if (node.type.name === 'citation') {
              citationPos = nodePos;
              return false;
            }
          });
        }

        // Call onEdit with position for editing functionality
        if (options.onEdit) {
          options.onEdit(citation, citationPos);
        } else {
          onClick(citation);
        }
        
        return true;
      },
      handleKeyDown(view, event) {
        if (event.key === "@") {
          return false; // Let handleTextInput manage it
        }
        if (event.key === "Escape") {
          onDismiss();
          return false;
        }
        return false;
      },
      handleTextInput(view, from, to, text) {
        if (text === "@") {
          onTrigger({ from, to: from + 1 });
        }
        return false;
      },
    },
  });
}

// Citation insertion utility function
export function insertCitation(
  view: any,
  range: { from: number; to: number } | null,
  source: { id: number; title: string },
  citationData: Partial<CitationAttrs>,
  schema: any
) {
  if (!view || !range) return;

  const citationNode = schema.nodes.citation.create({
    source_id: source.id,
    source_title: source.title,
    citation_type: citationData.citation_type || "page",
    page_number: citationData.page_number || "",
    chapter_number: citationData.chapter_number || null,
    section_number: citationData.section_number || null,
    daf_number: citationData.daf_number || "",
    halacha_number: citationData.halacha_number || null,
    verse_number: citationData.verse_number || "",
    custom_reference: citationData.custom_reference || "",
    reference: citationData.reference || "", // Legacy support
  });

  const tr = view.state.tr.replaceWith(
    range.from,
    range.to,
    citationNode
  );
  tr.insertText(" ", range.from + citationNode.nodeSize);
  view.dispatch(tr);
  view.focus();
}

// Citation update utility function
export function updateCitation(
  view: any,
  pos: number,
  citationData: Partial<CitationAttrs>,
  schema: any
) {
  if (!view) return;

  const node = view.state.doc.nodeAt(pos);
  if (!node || node.type.name !== 'citation') return;

  // Merge existing attributes with new data
  const newAttrs = {
    ...node.attrs,
    ...citationData,
  };

  const citationNode = schema.nodes.citation.create(newAttrs);
  
  const tr = view.state.tr.replaceWith(
    pos,
    pos + node.nodeSize,
    citationNode
  );
  
  view.dispatch(tr);
  view.focus();
}
