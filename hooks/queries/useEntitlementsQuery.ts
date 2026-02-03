/**
 * Entitlements Query Hook
 *
 * TanStack Query hook for fetching user entitlement data.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch the current user's entitlements
 *
 * Uses a 5-minute stale time since entitlements don't change often.
 * Refetches on app focus to catch subscription changes.
 */
export function useEntitlementsQuery() {
  const { entitlements, isSignedIn, isLoaded } = useApi();

  return useQuery({
    queryKey: queryKeys.entitlements.current(),
    queryFn: () => entitlements.getEntitlements(),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
