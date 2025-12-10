import { useState } from "react";
import { createClient } from "@/lib/directus";
const directus = createClient();
import { createItem, readItems } from "@directus/sdk";
import { Author, Source } from "@/lib/types";
import Fuse from "fuse.js";

type CreateStatus = "idle" | "creating-author" | "creating-source" | "error";

interface CreateSourceInput {
  title: string;
  authorName?: string;
}

export function useCreateSource() {
  const [status, setStatus] = useState<CreateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [matchedAuthor, setMatchedAuthor] = useState<Author | null>(null);

  const createSource = async ({ title, authorName }: CreateSourceInput) => {
    setStatus("creating-source");
    setError(null);
    setMatchedAuthor(null);

    try {
      let authorId: number | undefined;

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
  };

  return {
    createSource,
    status,
    error,
    matchedAuthor,
    reset,
  };
}
