/**
 * Entries Query Hooks
 *
 * TanStack Query hooks for fetching entry data.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/api';
import { usePlan } from '@/data/PlanProvider';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to fetch entries by taskKey
 */
export function useEntriesQuery<T = Record<string, unknown>>(taskKey: string | undefined) {
  const { planId } = usePlan();
  const { entries } = useApi();

  return useQuery({
    queryKey: queryKeys.entries.byTaskKey(planId!, taskKey!),
    queryFn: () => entries.listByTaskKey<T>(planId!, taskKey!),
    enabled: !!planId && !!taskKey,
  });
}

/**
 * Hook to fetch a single entry by ID
 */
export function useEntryQuery<T = Record<string, unknown>>(entryId: string | undefined) {
  const { planId } = usePlan();
  const { entries } = useApi();

  return useQuery({
    queryKey: queryKeys.entries.single(planId!, entryId!),
    queryFn: () => entries.get<T>(planId!, entryId!),
    enabled: !!planId && !!entryId,
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
