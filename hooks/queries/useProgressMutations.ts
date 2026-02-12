/**
 * Progress Mutation Hooks
 *
 * TanStack Query hooks for updating task progress status.
 * Includes optimistic updates on both progress.all and progress.byKey caches.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useApi } from "@/api";
import type { TaskProgressData } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Shared mutation hook for upserting progress.
 * Both useMarkTaskComplete and useMarkTaskInProgress delegate to this.
 */
function useUpsertProgress(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  return useMutation({
    mutationFn: async (data: TaskProgressData) => {
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }
      return progress.upsert(planId, taskKey, data);
    },
    onMutate: async (data: TaskProgressData) => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.progress.all(planId),
      });

      // Snapshot both caches for rollback
      const previousAll = queryClient.getQueryData<
        Record<string, TaskProgressData>
      >(queryKeys.progress.all(planId));

      const previousByKey = queryClient.getQueryData<TaskProgressData | null>(
        queryKeys.progress.byKey(planId, taskKey),
      );

      // Optimistically update the all-progress cache
      queryClient.setQueryData<Record<string, TaskProgressData>>(
        queryKeys.progress.all(planId),
        (old) => ({
          ...old,
          [taskKey]: data,
        }),
      );

      // Also update the individual key cache
      queryClient.setQueryData(
        queryKeys.progress.byKey(planId, taskKey),
        data,
      );

      return { previousAll, previousByKey };
    },
    onError: (_err, _vars, context) => {
      if (!planId || !taskKey) return;

      // Roll back both caches
      if (context?.previousAll !== undefined) {
        queryClient.setQueryData(
          queryKeys.progress.all(planId),
          context.previousAll,
        );
      }
      if (context?.previousByKey !== undefined) {
        queryClient.setQueryData(
          queryKeys.progress.byKey(planId, taskKey),
          context.previousByKey,
        );
      }
    },
    onSettled: () => {
      if (!planId || !taskKey) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all(planId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.byKey(planId, taskKey),
      });
    },
  });
}

/**
 * Mark a task as complete.
 * Upserts { status: "complete", completedAt: ISO } and optimistically updates cache.
 */
export function useMarkTaskComplete(taskKey: string | undefined) {
  const mutation = useUpsertProgress(taskKey);

  return {
    ...mutation,
    mutate: () => {
      const data: TaskProgressData = {
        status: "complete",
        completedAt: new Date().toISOString(),
      };
      mutation.mutate(data);
    },
  };
}

/**
 * Mark a task as in-progress (undo completion).
 * Upserts { status: "in_progress" } and optimistically updates cache.
 */
export function useMarkTaskInProgress(taskKey: string | undefined) {
  const mutation = useUpsertProgress(taskKey);

  return {
    ...mutation,
    mutate: () => {
      const data: TaskProgressData = { status: "in_progress" };
      mutation.mutate(data);
    },
  };
}

/**
 * Fire-and-forget helper: set progress to "in_progress" if no record exists yet.
 * Used by entry/wish creation mutations to auto-track when a task is started.
 */
export function useSetProgressIfNew() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  const setIfNew = useCallback(
    async (taskKey: string) => {
      if (!planId) return;

      // Check if a progress record already exists in cache
      const allProgress = queryClient.getQueryData<
        Record<string, TaskProgressData>
      >(queryKeys.progress.all(planId));

      if (allProgress?.[taskKey]) {
        // Already has a progress record, skip
        return;
      }

      const data: TaskProgressData = { status: "in_progress" };

      // Optimistically update cache
      queryClient.setQueryData<Record<string, TaskProgressData>>(
        queryKeys.progress.all(planId),
        (old) => ({
          ...old,
          [taskKey]: data,
        }),
      );

      queryClient.setQueryData(
        queryKeys.progress.byKey(planId, taskKey),
        data,
      );

      // Fire-and-forget API call — roll back cache on failure
      try {
        await progress.upsert(planId, taskKey, data);
      } catch {
        // Roll back optimistic updates so next visit retries
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.all(planId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.progress.byKey(planId, taskKey),
        });
      }
    },
    [planId, queryClient, progress],
  );

  return { setIfNew };
}
