'use client';

import { HydrationBoundary, DehydratedState } from '@tanstack/react-query';
import { AdminDashboardV2 } from './AdminDashboardV2';
import { getQueryClient } from '@/components/providers/QueryProvider';

interface AdminDashboardHydrationProps {
  dehydratedState: DehydratedState;
}

/**
 * Client wrapper for AdminDashboardV2 that handles React Query hydration.
 * Explicitly passing the queryClient ensures that HydrationBoundary
 * has access to the client even during the initial hydration phase.
 */
export function AdminDashboardHydration({ dehydratedState }: AdminDashboardHydrationProps) {
  const queryClient = getQueryClient();
  
  return (
    <HydrationBoundary state={dehydratedState} queryClient={queryClient}>
      <AdminDashboardV2 />
    </HydrationBoundary>
  );
}
