/**
 * Wishes Query Hooks
 *
 * TanStack Query hooks for fetching wishes data.
 * Follows same pattern as useEntriesQuery.ts for consistency.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useApi } from "@/api";
import type { Wish } from "@/api/types";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { decryptEntry, isEncryptedEntry } from "@/lib/crypto/entryEncryption";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to fetch wishes by taskKey
 *
 * @param taskKey - The task key to filter wishes (e.g., "wishes.carePrefs.whatMatters")
 * @returns Query result with wishes array
 *
 * @example
 * ```tsx
 * const { data: wishes, isLoading } = useWishesQuery('wishes.carePrefs.whatMatters');
 * ```
 */
export function useWishesQuery<T = Record<string, unknown>>(
  taskKey: string | undefined,
) {
  const { planId } = usePlan();
  const { wishes } = useApi();
  const crypto = useOptionalCrypto();

  return useQuery({
    queryKey: queryKeys.wishes.byTaskKey(planId!, taskKey!),
    queryFn: async () => {
      const raw = await wishes.listByTaskKey<T>(planId!, taskKey!);
      if (!crypto?.dekCryptoKey) return raw;
      return Promise.all(
        raw.map((w) =>
          isEncryptedEntry(w)
            ? decryptEntry<T>(w, crypto.dekCryptoKey!)
            : w,
        ),
      ) as Promise<Wish<T>[]>;
    },
    enabled: !!planId && !!taskKey,
  });
}

/**
 * Hook to fetch a single wish by ID
 *
 * Uses initialData from cached list queries for instant display,
 * then refetches if data is stale.
 *
 * @param wishId - The ID of the wish to fetch
 * @param taskKey - Optional taskKey to look up in list cache
 * @returns Query result with single wish
 *
 * @example
 * ```tsx
 * const { data: wish, isLoading } = useWishQuery(wishId, taskKey);
 * ```
 */
export function useWishQuery<T = Record<string, unknown>>(
  wishId: string | undefined,
  taskKey?: string,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();
  const crypto = useOptionalCrypto();

  return useQuery({
    queryKey: queryKeys.wishes.single(planId!, wishId!),
    queryFn: async () => {
      const raw = await wishes.get<T>(planId!, wishId!);
      if (!crypto?.dekCryptoKey || !isEncryptedEntry(raw)) return raw;
      return decryptEntry<T>(raw, crypto.dekCryptoKey) as Promise<Wish<T>>;
    },
    enabled: !!planId && !!wishId,
    // Use cached data from list query as initial data for instant display
    initialData: () => {
      if (!planId || !wishId) return undefined;

      // Try to find in taskKey-specific list first
      if (taskKey) {
        const listData = queryClient.getQueryData<Wish<T>[]>(
          queryKeys.wishes.byTaskKey(planId, taskKey),
        );
        const found = listData?.find((wish) => wish.id === wishId);
        if (found) return found;
      }

      // Fall back to all wishes cache
      const allData = queryClient.getQueryData<Wish[]>(
        queryKeys.wishes.all(planId),
      );
      return allData?.find((wish) => wish.id === wishId) as Wish<T> | undefined;
    },
    // Provide timestamp so query knows how stale the initial data is
    initialDataUpdatedAt: () => {
      if (!planId) return undefined;

      if (taskKey) {
        const state = queryClient.getQueryState(
          queryKeys.wishes.byTaskKey(planId, taskKey),
        );
        if (state?.dataUpdatedAt) return state.dataUpdatedAt;
      }

      return queryClient.getQueryState(queryKeys.wishes.all(planId))
        ?.dataUpdatedAt;
    },
  });
}

/**
 * Hook to fetch all wishes for a plan (for counting)
 *
 * @returns Query result with all wishes
 *
 * @example
 * ```tsx
 * const { data: allWishes } = useAllWishesQuery();
 * const totalCount = allWishes?.length ?? 0;
 * ```
 */
export function useAllWishesQuery() {
  const { planId } = usePlan();
  const { wishes } = useApi();

  return useQuery({
    queryKey: queryKeys.wishes.all(planId!),
    queryFn: () => wishes.listAll(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook to get wish counts by taskKey for dashboard display
 *
 * Returns a map of taskKey → count for displaying progress on the Wishes tab.
 *
 * @returns Query result with count map
 *
 * @example
 * ```tsx
 * const { data: counts } = useWishCountsQuery();
 * const carePrefsCount = counts?.['wishes.carePrefs.whatMatters'] ?? 0;
 * ```
 */
export function useWishCountsQuery() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();

  return useQuery({
    queryKey: queryKeys.wishes.counts(planId!),
    queryFn: async () => {
      const allWishes = await wishes.listAll(planId!);
      const countMap: Record<string, number> = {};
      const groupedByTaskKey: Record<string, Wish[]> = {};

      // Group wishes by taskKey and count them
      for (const wish of allWishes) {
        const key = wish.taskKey;
        if (key) {
          countMap[key] = (countMap[key] || 0) + 1;
          if (!groupedByTaskKey[key]) {
            groupedByTaskKey[key] = [];
          }
          groupedByTaskKey[key].push(wish);
        }
      }

      // Seed individual task caches for instant navigation
      // This eliminates the need for separate prefetch calls
      for (const [taskKey, taskWishes] of Object.entries(groupedByTaskKey)) {
        queryClient.setQueryData(
          queryKeys.wishes.byTaskKey(planId!, taskKey),
          taskWishes,
        );
      }

      // Also seed the all wishes cache
      queryClient.setQueryData(queryKeys.wishes.all(planId!), allWishes);

      return countMap;
    },
    enabled: !!planId,
  });
}

/**
 * Hook to prefetch wishes for multiple task keys
 *
 * Call this on section screens to prefetch wishes for all tasks,
 * so navigation to task screens is instant.
 *
 * @param taskKeys - Array of task keys to prefetch
 *
 * @example
 * ```tsx
 * const tasks = section.tasks.map(t => t.taskKey);
 * usePrefetchWishesByTaskKeys(tasks);
 * ```
 */
export function usePrefetchWishesByTaskKeys(taskKeys: string[]) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { wishes } = useApi();

  // Prefetch on mount and when taskKeys change
  useEffect(() => {
    if (!planId || taskKeys.length === 0) return;

    // Prefetch wishes for each task key
    // Use same staleTime as global config (5 minutes) so prefetched data
    // remains fresh when useWishesQuery reads it
    taskKeys.forEach((taskKey) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.wishes.byTaskKey(planId, taskKey),
        queryFn: () => wishes.listByTaskKey(planId, taskKey),
      });
    });
  }, [planId, taskKeys, queryClient, wishes]);
}
