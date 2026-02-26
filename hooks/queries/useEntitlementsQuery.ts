/**
 * Entitlements Query Hooks
 *
 * TanStack Query hooks for fetching entitlement data.
 * - useEntitlementsQuery: current user's own entitlements (account menu display)
 * - usePlanEntitlementsQuery: entitlements for the active plan (all access checks)
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

/**
 * Hook to fetch entitlements for the active plan.
 *
 * The backend resolves the correct entitlements for any plan — whether
 * it's the user's own or a shared plan. Used for all access checks
 * (pillar locks, quotas, storage). Only enabled when a planId is provided.
 */
export function usePlanEntitlementsQuery(planId: string | null) {
  const { entitlements, isSignedIn, isLoaded } = useApi();

  return useQuery({
    queryKey: queryKeys.entitlements.forPlan(planId ?? ''),
    queryFn: () => entitlements.getPlanEntitlements(planId!),
    enabled: isLoaded && isSignedIn && planId !== null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
