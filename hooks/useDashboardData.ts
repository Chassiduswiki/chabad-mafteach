import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardData,
  fetchRealTimeData,
  fetchUserAnalytics,
  fetchReviewQueue,
  fetchActivityLog,
  fetchMaintenanceStatus,
  fetchPerformanceMetrics,
  fetchMonitoringMetrics
} from "@/lib/api/dashboard";

export function useDashboardData() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
  });

  const realTimeQuery = useQuery({
    queryKey: ["realtime"],
    queryFn: fetchRealTimeData,
    staleTime: 30 * 1000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const userAnalyticsQuery = useQuery({
    queryKey: ["user-analytics"],
    queryFn: fetchUserAnalytics,
    staleTime: 2 * 60 * 1000,
  });

  const reviewQueueQuery = useQuery({
    queryKey: ["review-queue"],
    queryFn: fetchReviewQueue,
    staleTime: 60 * 1000,
  });

  const activityLogQuery = useQuery({
    queryKey: ["activity-log"],
    queryFn: fetchActivityLog,
    staleTime: 60 * 1000,
  });

  const maintenanceQuery = useQuery({
    queryKey: ["maintenance-status"],
    queryFn: fetchMaintenanceStatus,
    staleTime: 5 * 60 * 1000,
  });

  const performanceQuery = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: fetchPerformanceMetrics,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-metrics"],
    queryFn: fetchMonitoringMetrics,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  return {
    dashboard: dashboardQuery.data,
    realTime: realTimeQuery.data,
    userAnalytics: userAnalyticsQuery.data,
    reviewQueue: reviewQueueQuery.data,
    activityLog: activityLogQuery.data,
    maintenance: maintenanceQuery.data,
    performance: performanceQuery.data,
    monitoring: monitoringQuery.data,
    isLoading: dashboardQuery.isLoading || realTimeQuery.isLoading || userAnalyticsQuery.isLoading,
    isError: dashboardQuery.isError || realTimeQuery.isError || userAnalyticsQuery.isError,
    isPerformanceLoading: performanceQuery.isLoading,
    isMonitoringLoading: monitoringQuery.isLoading,
    refetch: () => {
      dashboardQuery.refetch();
      realTimeQuery.refetch();
      userAnalyticsQuery.refetch();
      reviewQueueQuery.refetch();
      activityLogQuery.refetch();
      maintenanceQuery.refetch();
      performanceQuery.refetch();
      monitoringQuery.refetch();
    }
  };
}
