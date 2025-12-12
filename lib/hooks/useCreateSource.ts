import { useState } from "react";
import { createClient } from "@/lib/directus";
const directus = createClient();
import { createItem, readItems } from "@directus/sdk";
import { Author, Source, Document } from "@/lib/types";
import Fuse from "fuse.js";

type CreateStatus = "idle" | "creating-author" | "creating-source" | "finding-document" | "error";

interface CreateSourceInput {
  title: string;
  authorName?: string;
  documentId?: number;
  externalSource?: {
    external_id: string;
    external_url: string;
    external_system: 'sefaria' | 'wikisource' | 'hebrewbooks';
    citation_text?: string;
  };
}

interface DocumentMatch {
  document: Document;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function useCreateSource() {
  const [status, setStatus] = useState<CreateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [matchedAuthor, setMatchedAuthor] = useState<Author | null>(null);
  const [matchedDocument, setMatchedDocument] = useState<DocumentMatch | null>(null);

  const createSource = async ({ title, authorName, documentId, externalSource }: CreateSourceInput) => {
    setStatus("finding-document");
    setError(null);
    setMatchedAuthor(null);
    setMatchedDocument(null);

    try {
      let authorId: number | undefined;
      let resolvedDocumentId = documentId; // Use provided documentId or find one

      // FIRST: Try to associate with existing document if not explicitly provided
      if (!resolvedDocumentId && title.trim().length > 0) {
        const trimmedTitle = title.trim();

        // Search for existing documents that might match this source
        const possibleDocs = (await directus.request(
          readItems("documents", {
            search: trimmedTitle,
            fields: ["id", "title", "metadata"],
            filter: {
              status: { _eq: "published" },
              doc_type: { _in: ["sefer", "entry"] }
            },
            limit: 10,
          })
        )) as Document[];

        if (possibleDocs.length > 0) {
          const normalizedTitle = trimmedTitle.toLowerCase();

          // Exact title match gets highest priority
          const exactMatch = possibleDocs.find(
            (doc) => doc.title.toLowerCase() === normalizedTitle
          );

          if (exactMatch) {
            resolvedDocumentId = exactMatch.id;
            setMatchedDocument({
              document: exactMatch,
              confidence: 'high',
              reason: 'Exact title match'
            });
          } else {
            // Fuzzy matching for close matches
            const fuse = new Fuse(possibleDocs, {
              keys: ["title", "metadata.author_name"],
              threshold: 0.2,
              includeScore: true,
            });

            const bestMatch = fuse.search(trimmedTitle)[0];
            if (bestMatch && bestMatch.score !== undefined && bestMatch.score <= 0.15) {
              resolvedDocumentId = bestMatch.item.id;
              setMatchedDocument({
                document: bestMatch.item,
                confidence: bestMatch.score <= 0.05 ? 'high' : 'medium',
                reason: `Fuzzy match (${Math.round((1 - bestMatch.score) * 100)}% confidence)`
              });
            }
          }
        }
      }

      if (authorName && authorName.trim().length > 0) {
        const trimmedName = authorName.trim();

        // Attempt to find an existing author via fuzzy matching
        const possibles = (await directus.request(
          readItems("authors", {
            search: trimmedName,
            fields: ["id", "canonical_name"],
            limit: 15,
          })
        )) as Author[];

        const normalized = trimmedName.toLowerCase();
        const exactMatch = possibles.find(
          (candidate) => candidate.canonical_name.toLowerCase() === normalized
        );

        if (exactMatch) {
          authorId = exactMatch.id;
          setMatchedAuthor(exactMatch);
        } else if (possibles.length > 0) {
          const fuse = new Fuse(possibles, {
            keys: ["canonical_name"],
            threshold: 0.2,
          });
          const bestMatch = fuse.search(trimmedName)[0];

          if (bestMatch && bestMatch.score !== undefined && bestMatch.score <= 0.15) {
            authorId = bestMatch.item.id;
            setMatchedAuthor(bestMatch.item);
          }
        }

        if (!authorId) {
          setStatus("creating-author");
          const author = (await directus.request(
            createItem("authors", {
              canonical_name: trimmedName,
            })
          )) as { id: number };

          authorId = author.id;
        }
      }

      setStatus("creating-source");
      const source = (await directus.request(
        createItem("sources", {
          title: title.trim(),
          author_id: authorId,
          document_id: resolvedDocumentId, // Link to document if found
          ...(externalSource && {
            is_external: true,
            external_system: externalSource.external_system,
            external_id: externalSource.external_id,
            external_url: externalSource.external_url,
            citation_text: externalSource.citation_text,
          }),
        })
      )) as Source;

      setStatus("idle");
      return source;
    } catch (err: any) {
      console.error("Failed to create source", err);
      setStatus("error");
      setError(err?.message ?? "Unknown error creating source");
      throw err;
    }
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
    setMatchedAuthor(null);
    setMatchedDocument(null);
  };

  return {
    createSource,
    status,
    error,
    matchedAuthor,
    matchedDocument, // NEW: Return document match information
    reset,
  };
}
