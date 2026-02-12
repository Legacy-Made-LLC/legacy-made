/**
 * Progress Mutation Hooks
 *
 * TanStack Query hooks for updating task progress status.
 * Includes optimistic updates on the progress.all cache.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useApi } from "@/api";
import type { TaskProgressData } from "@/api/types";
import { usePlan } from "@/data/PlanProvider";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Mark a task as complete.
 * Upserts { status: "complete", completedAt: ISO } and optimistically updates cache.
 */
export function useMarkTaskComplete(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  return useMutation({
    mutationFn: async () => {
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }

      const data: TaskProgressData = {
        status: "complete",
        completedAt: new Date().toISOString(),
      };

      return progress.upsert(planId, taskKey, data);
    },
    onMutate: async () => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.progress.all(planId),
      });

      const previousProgress = queryClient.getQueryData<
        Record<string, TaskProgressData>
      >(queryKeys.progress.all(planId));

      const newData: TaskProgressData = {
        status: "complete",
        completedAt: new Date().toISOString(),
      };

      // Optimistically update the all-progress cache
      queryClient.setQueryData<Record<string, TaskProgressData>>(
        queryKeys.progress.all(planId),
        (old) => ({
          ...old,
          [taskKey]: newData,
        }),
      );

      // Also update the individual key cache
      queryClient.setQueryData(
        queryKeys.progress.byKey(planId, taskKey),
        newData,
      );

      return { previousProgress };
    },
    onError: (_err, _vars, context) => {
      if (!planId) return;

      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress.all(planId),
          context.previousProgress,
        );
      }
    },
    onSettled: () => {
      if (!planId) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all(planId),
      });
    },
  });
}

/**
 * Mark a task as in-progress (undo completion).
 * Upserts { status: "in_progress" } and optimistically updates cache.
 */
export function useMarkTaskInProgress(taskKey: string | undefined) {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  return useMutation({
    mutationFn: async () => {
      if (!planId || !taskKey) {
        throw new Error("Plan ID and task key are required");
      }

      const data: TaskProgressData = {
        status: "in_progress",
      };

      return progress.upsert(planId, taskKey, data);
    },
    onMutate: async () => {
      if (!planId || !taskKey) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.progress.all(planId),
      });

      const previousProgress = queryClient.getQueryData<
        Record<string, TaskProgressData>
      >(queryKeys.progress.all(planId));

      const newData: TaskProgressData = {
        status: "in_progress",
      };

      // Optimistically update the all-progress cache
      queryClient.setQueryData<Record<string, TaskProgressData>>(
        queryKeys.progress.all(planId),
        (old) => ({
          ...old,
          [taskKey]: newData,
        }),
      );

      // Also update the individual key cache
      queryClient.setQueryData(
        queryKeys.progress.byKey(planId, taskKey),
        newData,
      );

      return { previousProgress };
    },
    onError: (_err, _vars, context) => {
      if (!planId) return;

      if (context?.previousProgress) {
        queryClient.setQueryData(
          queryKeys.progress.all(planId),
          context.previousProgress,
        );
      }
    },
    onSettled: () => {
      if (!planId) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all(planId),
      });
    },
  });
}

/**
 * Fire-and-forget helper: set progress to "in_progress" if no record exists yet.
 * Used by entry/wish creation mutations to auto-track when a task is started.
 */
export function useSetProgressIfNew() {
  const queryClient = useQueryClient();
  const { planId } = usePlan();
  const { progress } = useApi();

  const setIfNew = useCallback(async (taskKey: string) => {
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

    // Fire-and-forget API call
    try {
      await progress.upsert(planId, taskKey, data);
    } catch {
      // Silently fail - will retry on next entry creation
    }
  }, [planId, queryClient, progress]);

  return { setIfNew };
}
