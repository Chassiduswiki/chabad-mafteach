'use client';

import { HydrationBoundary, DehydratedState } from "@tanstack/react-query";
import { ReactNode } from "react";
import { getQueryClient } from "@/components/providers/QueryProvider";

export function Hydrate({ children, state }: { children: ReactNode; state: DehydratedState }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={state} queryClient={queryClient}>
      {children}
    </HydrationBoundary>
  );
}
