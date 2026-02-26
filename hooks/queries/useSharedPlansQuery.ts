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
 * Uses a short stale time and always refetches on app focus because
 * shared plan statuses (pending → accepted, revoked, etc.) can change
 * at any time via the plan owner's actions.
 */
export function useSharedPlansQuery() {
  const { sharedPlans, isSignedIn, isLoaded } = useApi();

  return useQuery({
    queryKey: queryKeys.sharedPlans.all(),
    queryFn: () => sharedPlans.list(),
    enabled: isLoaded && isSignedIn,
    staleTime: 30 * 1000, // 30 seconds — statuses change frequently
    refetchOnWindowFocus: "always",
  });
}
