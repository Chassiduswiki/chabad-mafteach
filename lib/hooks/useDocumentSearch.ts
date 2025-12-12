import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { createClient } from "@/lib/directus";
const directus = createClient();
import { readItems } from "@directus/sdk";
import { Document } from "@/lib/types";

/**
 * Document search hook - searches existing books/documents in the library
 * Prioritizes exact matches and provides fuzzy search fallback
 */
export function useDocumentSearch() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Preload recent/popular documents for instant fuzzy search
  const { data: initialDocuments = [], isLoading: isInitialLoading } = useQuery({
    queryKey: ["documents", "initial"],
    queryFn: async () => {
      try {
        const result = await directus.request(
          readItems("documents", {
            fields: ["id", "title", "doc_type", "metadata"],
            filter: {
              status: { _eq: "published" },
              doc_type: { _in: ["sefer", "entry"] }
            },
            limit: 300, // Larger cache for document library
            sort: ["-published_at"], // Most recent first
          })
        );
        return result as Document[];
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Authentication failed: Unauthorized access. Please check your Directus token.');
        } else {
          setError(err.message || 'Error fetching documents');
        }
        return []; // Return empty array on error
      }
    },
    staleTime: 60_000,
  });

  // Network search for longer queries or when local results are insufficient
  const { data: remoteDocuments = [], isLoading: isRemoteLoading } = useQuery({
    queryKey: ["documents", "search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [] as Document[];
      try {
        const result = await directus.request(
          readItems("documents", {
            search,
            fields: ["id", "title", "doc_type", "metadata"],
            filter: {
              status: { _eq: "published" },
              doc_type: { _in: ["sefer", "entry"] }
            },
            limit: 20,
          })
        );
        return result as Document[];
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Authentication failed: Unauthorized access. Please check your Directus token.');
        } else {
          setError(err.message || 'Error fetching documents');
        }
        return []; // Return empty array on error
      }
    },
    enabled: search.length >= 2,
  });

  const fuse = useMemo(() => {
    return new Fuse(initialDocuments, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "metadata.author_name", weight: 0.2 },
        { name: "metadata.slug", weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }, [initialDocuments]);

  const fused = useMemo(() => {
    if (!search) return initialDocuments.slice(0, 10);

    // Get local fuzzy results
    const local = fuse.search(search).map((r) => ({
      ...r.item,
      searchScore: r.score,
      searchType: 'local' as const
    }));

    // Merge remote results (if any), dedup by id
    const merged = [...local, ...remoteDocuments.map(doc => ({
      ...doc,
      searchScore: 0, // Remote results get priority
      searchType: 'remote' as const
    }))];

    const seen = new Set<number>();
    return merged.filter((doc) => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    })
    .sort((a, b) => {
      // Prioritize remote results, then by score
      if (a.searchType === 'remote' && b.searchType === 'local') return -1;
      if (a.searchType === 'local' && b.searchType === 'remote') return 1;
      return (a.searchScore || 1) - (b.searchScore || 1);
    })
    .slice(0, 15); // Show more results for documents
  }, [search, fuse, initialDocuments, remoteDocuments]);

  return {
    search,
    setSearch,
    results: fused,
    isLoading: isInitialLoading || isRemoteLoading,
    error,
  };
}
