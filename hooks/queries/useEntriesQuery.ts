/**
 * Entries Query Hooks
 *
 * TanStack Query hooks for fetching entry data.
 * Entries are automatically decrypted if they have encrypted metadata.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type { Entry } from "@/api/types";
import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { decryptEntry, isEncryptedEntry } from "@/lib/crypto/entryEncryption";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to fetch entries by taskKey
 */
export function useEntriesQuery<T = Record<string, unknown>>(taskKey: string | undefined) {
  const { planId } = usePlan();
  const { entries } = useApi();
  const crypto = useOptionalCrypto();
  const cryptoReady = !crypto || (crypto.isReady && !crypto.isActiveDEKLoading);

  return useQuery({
    queryKey: queryKeys.entries.byTaskKey(planId!, taskKey!),
    queryFn: async () => {
      const raw = await entries.listByTaskKey<T>(planId!, taskKey!);
      if (!crypto?.activeDEK) return raw;
      return Promise.all(
        raw.map(async (e) => {
          if (!isEncryptedEntry(e)) return e;
          const decrypted = await decryptEntry<T>(
            e as unknown as Parameters<typeof decryptEntry>[0],
            crypto.activeDEK!,
          );
          return decrypted as unknown as Entry<T>;
        }),
      );
    },
    enabled: !!planId && !!taskKey && cryptoReady,
  });
}

/**
 * Hook to fetch a single entry by ID
 *
 * Uses initialData from cached list queries for instant display,
 * then refetches if data is stale.
 */
export function useEntryQuery<T = Record<string, unknown>>(
  entryId: string | undefined,
  taskKey?: string,
) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { entries } = useApi();
  const crypto = useOptionalCrypto();
  const cryptoReady = !crypto || (crypto.isReady && !crypto.isActiveDEKLoading);

  return useQuery({
    queryKey: queryKeys.entries.single(planId!, entryId!),
    queryFn: async () => {
      const raw = await entries.get<T>(planId!, entryId!);
      if (!crypto?.activeDEK || !isEncryptedEntry(raw)) return raw;
      const decrypted = await decryptEntry<T>(
        raw as unknown as Parameters<typeof decryptEntry>[0],
        crypto.activeDEK,
      );
      return decrypted as unknown as Entry<T>;
    },
    enabled: !!planId && !!entryId && cryptoReady,
    // Use cached data from list query as initial data for instant display
    initialData: () => {
      if (!planId || !entryId) return undefined;

      // Try to find in taskKey-specific list first
      if (taskKey) {
        const listData = queryClient.getQueryData<Entry<T>[]>(
          queryKeys.entries.byTaskKey(planId, taskKey),
        );
        const found = listData?.find((entry) => entry.id === entryId);
        if (found) return found;
      }

      // Fall back to all entries cache
      const allData = queryClient.getQueryData<Entry[]>(
        queryKeys.entries.all(planId),
      );
      return allData?.find((entry) => entry.id === entryId) as
        | Entry<T>
        | undefined;
    },
    // Provide timestamp so query knows how stale the initial data is
    initialDataUpdatedAt: () => {
      if (!planId) return undefined;

      if (taskKey) {
        const state = queryClient.getQueryState(
          queryKeys.entries.byTaskKey(planId, taskKey),
        );
        if (state?.dataUpdatedAt) return state.dataUpdatedAt;
      }

      return queryClient.getQueryState(queryKeys.entries.all(planId))
        ?.dataUpdatedAt;
    },
  });
}

/**
 * Hook to fetch all entries for a plan (for counting)
 */
export function useAllEntriesQuery() {
  const { planId } = usePlan();
  const { entries } = useApi();

  return useQuery({
    queryKey: queryKeys.entries.all(planId!),
    queryFn: () => entries.listAll(planId!),
    enabled: !!planId,
  });
}

/**
 * Hook to get entry counts by taskKey for dashboard display
 */
export function useEntryCountsQuery() {
  const { planId } = usePlan();
  const { entries } = useApi();

  return useQuery({
    queryKey: queryKeys.entries.counts(planId!),
    queryFn: async () => {
      const allEntries = await entries.listAll(planId!);
      const countMap: Record<string, number> = {};

      for (const entry of allEntries) {
        const key = entry.taskKey;
        if (key) {
          countMap[key] = (countMap[key] || 0) + 1;
        }
      }

      return countMap;
    },
    enabled: !!planId,
  });
}

/**
 * Hook to prefetch entries for multiple task keys
 *
 * Call this on section screens to prefetch entries for all tasks,
 * so navigation to task screens is instant.
 *
 * @param taskKeys - Array of task keys to prefetch
 *
 * @example
 * ```tsx
 * const tasks = section.tasks.map(t => t.taskKey);
 * usePrefetchEntriesByTaskKeys(tasks);
 * ```
 */
export function usePrefetchEntriesByTaskKeys(taskKeys: string[]) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { entries } = useApi();
  const crypto = useOptionalCrypto();

  // Prefetch on mount and when taskKeys change
  useEffect(() => {
    if (!planId || taskKeys.length === 0) return;

    // Skip prefetch when crypto is active — the prefetch queryFn doesn't
    // decrypt, so it would cache encrypted data under the same key the
    // decrypting query reads from, causing blank fields.
    if (crypto) return;

    // Prefetch entries for each task key
    taskKeys.forEach((taskKey) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.entries.byTaskKey(planId, taskKey),
        queryFn: () => entries.listByTaskKey(planId, taskKey),
        // Only prefetch if data is older than 30 seconds
        staleTime: 30000,
      });
    });
  }, [planId, taskKeys, queryClient, entries, crypto]);
}

