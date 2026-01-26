import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * request-scoped QueryClient for Server Components (RSC)
 */
export const getRSCQueryClient = cache(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
}));
