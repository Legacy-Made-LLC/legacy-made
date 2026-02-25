/**
 * Shared Plans Query Hook
 *
 * TanStack Query hook for fetching plans shared with the current user.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch all plans shared with the current user
 *
 * Uses a 5-minute stale time since shared plans rarely change.
 */
export function useSharedPlansQuery() {
  const { sharedPlans, isSignedIn, isLoaded } = useApi();

  return useQuery({
    queryKey: queryKeys.sharedPlans.all(),
    queryFn: () => sharedPlans.list(),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}
