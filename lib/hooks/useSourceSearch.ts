import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import directus from "@/lib/directus";
import { readItems } from "@directus/sdk";
import { Source } from "@/lib/types";

/**
 * Lightweight source search hook.
 * - Quickly returns client-side results via Fuse.js
 * - Falls back to a network search for more matches
 */
export function useSourceSearch() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Preload a batch of sources for instant fuzzy search
  const { data: initialSources = [], isLoading: isInitialLoading } = useQuery({
    queryKey: ["sources", "initial"],
    queryFn: async () => {
      try {
        const result = await directus.request(
          readItems("sources", {
            fields: ["id", "title"],
            limit: 200, // small cache for fast fuzzy search
            sort: ["title"],
          })
        );
        return result as Source[];
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Authentication failed: Unauthorized access. Please check your Directus token.');
        } else {
          setError(err.message || 'Error fetching sources');
        }
        return []; // Return empty array on error
      }
    },
    staleTime: 60_000,
  });

  // Network search for longer queries
  const { data: remoteSources = [], isLoading: isRemoteLoading } = useQuery({
    queryKey: ["sources", "search", search],
    queryFn: async () => {
      if (!search || search.length < 3) return [] as Source[];
      try {
        const result = await directus.request(
          readItems("sources", {
            search,
            fields: ["id", "title"],
            limit: 10,
          })
        );
        return result as Source[];
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Authentication failed: Unauthorized access. Please check your Directus token.');
        } else {
          setError(err.message || 'Error fetching sources');
        }
        return []; // Return empty array on error
      }
    },
    enabled: search.length >= 3,
  });

  const fuse = useMemo(() => {
    return new Fuse(initialSources, {
      keys: ["title"],
      threshold: 0.3,
    });
  }, [initialSources]);

  const fused = useMemo(() => {
    if (!search) return initialSources.slice(0, 10);
    const local = fuse.search(search).map((r) => r.item).slice(0, 10);
    // Merge remote results (if any), dedup by id
    const merged = [...local, ...remoteSources];
    const seen = new Set<number>();
    return merged.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).slice(0, 10);
  }, [search, fuse, initialSources, remoteSources]);

  return {
    search,
    setSearch,
    results: fused,
    isLoading: isInitialLoading || isRemoteLoading,
    error,
  };
}
