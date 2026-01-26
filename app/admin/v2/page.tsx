import { getRSCQueryClient } from "@/lib/rsc-query-client";
import { dehydrate } from "@tanstack/react-query";
import { AdminDashboardHydration } from "@/components/admin/v2/AdminDashboardHydration";
import { 
  fetchDashboardData, 
  fetchRealTimeData, 
  fetchUserAnalytics, 
  fetchReviewQueue, 
  fetchActivityLog, 
  fetchMaintenanceStatus,
  fetchContentStats
} from "@/lib/api/dashboard";

export default async function AdminV2Page() {
  const queryClient = getRSCQueryClient();
  
  // Prefetch ALL dashboard data on the server to ensure stable hydration.
  // This ensures that 'isLoading' will be false for these queries on first client render.
  await Promise.all([
    queryClient.prefetchQuery({ 
      queryKey: ["dashboard"], 
      queryFn: fetchDashboardData 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["contentStats"], 
      queryFn: fetchContentStats 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["maintenance-status"], 
      queryFn: fetchMaintenanceStatus 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["realtime"], 
      queryFn: fetchRealTimeData 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["user-analytics"], 
      queryFn: fetchUserAnalytics 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["review-queue"], 
      queryFn: fetchReviewQueue 
    }),
    queryClient.prefetchQuery({ 
      queryKey: ["activity-log"], 
      queryFn: fetchActivityLog 
    })
  ]);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-serif italic mb-8 px-4">Admin Dashboard v2 (React Query Sandbox)</h1>
      <AdminDashboardHydration dehydratedState={dehydrate(queryClient)} />
    </div>
  );
}
