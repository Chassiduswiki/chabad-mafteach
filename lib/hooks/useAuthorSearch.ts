import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import directus from "@/lib/directus";
import { readItems } from "@directus/sdk";
import { Author } from "@/lib/types";

export function useAuthorSearch() {
  const [search, setSearch] = useState("");

  const { data: initialAuthors = [] } = useQuery({
    queryKey: ["authors", "initial"],
    queryFn: async () => {
      const result = await directus.request(
        readItems("authors", {
          fields: ["id", "canonical_name"],
          limit: 200,
          sort: ["canonical_name"],
        })
      );
      return result as Author[];
    },
    staleTime: 60_000,
  });

  const { data: remoteAuthors = [] } = useQuery({
    queryKey: ["authors", "search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [] as Author[];
      const result = await directus.request(
        readItems("authors", {
          search,
          fields: ["id", "canonical_name"],
          limit: 10,
        })
      );
      return result as Author[];
    },
    enabled: search.length >= 2,
  });

  const fuse = useMemo(() => {
    return new Fuse(initialAuthors, {
      keys: ["canonical_name"],
      threshold: 0.3,
    });
  }, [initialAuthors]);

  const results = useMemo(() => {
    if (!search) return initialAuthors.slice(0, 10);
    const local = fuse.search(search).map((r) => r.item).slice(0, 10);
    const merged = [...local, ...remoteAuthors];
    const seen = new Set<number>();
    return merged.filter((author) => {
      if (seen.has(author.id)) return false;
      seen.add(author.id);
      return true;
    });
  }, [search, fuse, initialAuthors, remoteAuthors]);

  return {
    search,
    setSearch,
    results,
  };
}
