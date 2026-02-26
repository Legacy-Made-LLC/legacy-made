/**
 * Shared Plans Mutation Hooks
 *
 * TanStack Query hooks for accepting and declining shared plan invitations.
 * Uses the planId-based endpoints: POST /shared-plans/:planId/accept|decline
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import type { SharedPlan } from "@/api/types";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook for accepting a shared plan invitation
 *
 * Optimistically updates the shared plan's status to "accepted"
 * and invalidates related queries on completion.
 */
export function useAcceptSharedPlan() {
  const queryClient = useQueryClient();
  const { sharedPlans } = useApi();

  return useMutation({
    mutationFn: (planId: string) => {
      return sharedPlans.accept(planId);
    },
    onMutate: async (planId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });

      const previousSharedPlans = queryClient.getQueryData<SharedPlan[]>(
        queryKeys.sharedPlans.all(),
      );

      // Optimistically update status to accepted
      if (previousSharedPlans) {
        queryClient.setQueryData<SharedPlan[]>(
          queryKeys.sharedPlans.all(),
          previousSharedPlans.map((sp) =>
            sp.planId === planId
              ? { ...sp, accessStatus: "accepted" as const }
              : sp,
          ),
        );
      }

      return { previousSharedPlans };
    },
    onError: (_err, _planId, context) => {
      if (context?.previousSharedPlans) {
        queryClient.setQueryData(
          queryKeys.sharedPlans.all(),
          context.previousSharedPlans,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });
    },
  });
}

/**
 * Hook for declining a shared plan invitation
 *
 * Optimistically removes the shared plan from the list.
 */
export function useDeclineSharedPlan() {
  const queryClient = useQueryClient();
  const { sharedPlans } = useApi();

  return useMutation({
    mutationFn: (planId: string) => {
      return sharedPlans.decline(planId);
    },
    onMutate: async (planId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });

      const previousSharedPlans = queryClient.getQueryData<SharedPlan[]>(
        queryKeys.sharedPlans.all(),
      );

      // Optimistically remove declined plan from list
      if (previousSharedPlans) {
        queryClient.setQueryData<SharedPlan[]>(
          queryKeys.sharedPlans.all(),
          previousSharedPlans.filter((sp) => sp.planId !== planId),
        );
      }

      return { previousSharedPlans };
    },
    onError: (_err, _planId, context) => {
      if (context?.previousSharedPlans) {
        queryClient.setQueryData(
          queryKeys.sharedPlans.all(),
          context.previousSharedPlans,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });
    },
  });
}
