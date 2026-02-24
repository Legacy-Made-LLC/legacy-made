/**
 * Plan Query Hook
 *
 * TanStack Query hook for fetching the user's plan.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch the current user's plan
 *
 * Uses a 5-minute stale time since the plan rarely changes.
 * Refetches on app focus to catch any changes.
 */
export function usePlanQuery() {
  const { plans, isSignedIn, isLoaded } = useApi();

  return useQuery({
    queryKey: queryKeys.plan.current(),
    queryFn: () => plans.getMyPlan(),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
