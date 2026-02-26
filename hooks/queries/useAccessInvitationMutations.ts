/**
 * Access Invitation Mutation Hooks
 *
 * TanStack Query hooks for accepting and declining invitations
 * via the token-based endpoints: POST /access-invitations/:token/accept|decline
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook for accepting an access invitation by token.
 */
export function useAcceptAccessInvitation() {
  const queryClient = useQueryClient();
  const { accessInvitations } = useApi();

  return useMutation({
    mutationFn: (token: string) => accessInvitations.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedPlans.all(),
      });
    },
  });
}

/**
 * Hook for declining an access invitation by token.
 */
export function useDeclineAccessInvitation() {
  const { accessInvitations } = useApi();

  return useMutation({
    mutationFn: (token: string) => accessInvitations.decline(token),
  });
}
