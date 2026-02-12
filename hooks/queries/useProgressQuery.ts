/**
 * Progress Query Hooks
 *
 * TanStack Query hooks for fetching task progress data.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type { TaskProgressData } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fetch all progress records and return as a taskKey -> TaskProgressData map.
 * Seeds individual byKey caches for instant access.
 */
export function useAllProgressQuery() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  return useQuery({
    queryKey: queryKeys.progress.all(planId!),
    queryFn: async () => {
      const records = await progress.listAll(planId!);
      const map: Record<string, TaskProgressData> = {};

      for (const record of records) {
        map[record.key] = record.data;

        // Seed individual key caches
        queryClient.setQueryData(
          queryKeys.progress.byKey(planId!, record.key),
          record.data,
        );
      }

      return map;
    },
    enabled: !!planId,
  });
}

/**
 * Get progress for a single task key.
 * Reads from the all-progress cache when available, otherwise fetches individually.
 */
export function useTaskProgressQuery(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  return useQuery({
    queryKey: queryKeys.progress.byKey(planId!, taskKey!),
    queryFn: async (): Promise<TaskProgressData | null> => {
      try {
        const record = await progress.get(planId!, taskKey!);
        return record.data;
      } catch {
        // No progress record exists for this task (not started)
        return null;
      }
    },
    placeholderData: () => {
      const allProgress = queryClient.getQueryData<
        Record<string, TaskProgressData>
      >(queryKeys.progress.all(planId!));

      return allProgress?.[taskKey!] ?? undefined;
    },
    enabled: !!planId && !!taskKey,
  });
}
